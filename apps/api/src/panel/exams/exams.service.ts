import type {
  Created,
  ExamDraft,
  ExamItem,
  ExamSummary,
  Published,
} from '@codeportal/contracts';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { postgresCode, UNIQUE_VIOLATION } from '../../db/errors.js';
import type { Db } from '../../db/index.js';
import {
  examAccess,
  examProblems,
  exams,
  groups,
  problems,
} from '../../db/schema.js';
import { ExamFactsService, summarize } from './exam-facts.service.js';
import {
  DEFAULT_DURATION_MIN,
  examStatus,
  MINUTE_MS,
  settingsOf,
  type ExamRow,
} from './exam-rules.js';
import { hashPassword } from './exam-password.js';
import { joinCode } from './join-code.js';
import { fromWarsaw, toWarsaw } from './warsaw-time.js';

const CODE_ATTEMPTS = 8;
const MIN_PUBLISH_DURATION_MIN = 5;
const MIN_PASSWORD_LENGTH = 4;
const COPY_SUFFIX = ' (kopia)';

const ACCESS_TYPE = {
  code: 'link',
  list: 'list',
  password: 'password',
  sso: 'sso',
} as const;

type ExamProblemRow = typeof examProblems.$inferSelect;

function itemsFrom(rows: ExamProblemRow[]): ExamItem[] {
  const items: ExamItem[] = [];
  for (const row of rows) {
    const points = row.pointsOverride ?? 0;
    const pool = row.poolTag
      ? items.find((i) => i.kind === 'pool' && i.key === row.poolTag)
      : undefined;
    if (pool?.kind === 'pool') pool.ids.push(row.problemId);
    else if (row.poolTag)
      items.push({
        key: row.poolTag,
        kind: 'pool',
        ids: [row.problemId],
        points,
      });
    else
      items.push({
        key: `p-${row.problemId}`,
        kind: 'problem',
        id: row.problemId,
        points,
      });
  }
  return items;
}

function problemRowsFrom(examId: string, items: ExamItem[]) {
  return items
    .flatMap(
      (
        item,
      ): {
        problemId: string;
        poolTag: string | null;
        pointsOverride: number;
      }[] =>
        item.kind === 'problem'
          ? [{ problemId: item.id, poolTag: null, pointsOverride: item.points }]
          : item.ids.map((problemId) => ({
              problemId,
              poolTag: item.key,
              pointsOverride: item.points,
            })),
    )
    .map((row, order) => ({ ...row, examId, order }));
}

function examValues(draft: ExamDraft) {
  const startsAt = fromWarsaw(draft.date, draft.time);
  const durationMin = draft.duration || DEFAULT_DURATION_MIN;
  return {
    title: draft.title.trim(),
    mode: draft.mode,
    groupId: draft.groupId || null,
    startsAt,
    durationMin,
    endsAt: new Date(startsAt.getTime() + durationMin * MINUTE_MS),
    attempts: draft.attempts,
    protectionLevel: draft.protection,
    resultsVisibility: draft.results,
    scoringRule: draft.scoring,
    settings: {
      instructions: draft.instructions,
      access: draft.access,
      lateJoinMin: draft.lateJoinMin,
      attempts: draft.attempts,
      protection: draft.protection,
      blockPaste: draft.blockPaste,
      fullscreen: draft.fullscreen,
      fullscreenExits: draft.fullscreenExits,
      shuffle: draft.shuffle,
      results: draft.results,
      scoring: draft.scoring,
      thresholds: draft.thresholds,
    },
  };
}

function publishProblem(
  exam: ExamRow,
  itemCount: number,
  hasPassword: boolean,
) {
  const settings = settingsOf(exam);
  if (!exam.title.trim()) return 'Nadaj testowi nazwę.';
  if ((exam.durationMin ?? 0) < MIN_PUBLISH_DURATION_MIN)
    return `Test musi trwać co najmniej ${MIN_PUBLISH_DURATION_MIN} minut.`;
  if (itemCount === 0) return 'Dodaj przynajmniej jedno zadanie.';
  if (settings.access === 'password' && !hasPassword)
    return 'Ustaw hasło do testu.';
  if (settings.access === 'list' && !exam.groupId)
    return 'Dostęp z listy wymaga wybrania klasy.';
  if (
    settings.thresholds.some(
      (t, i) => i > 0 && t <= settings.thresholds[i - 1]!,
    )
  )
    return 'Progi ocen muszą rosnąć.';
  return null;
}

@Injectable()
export class ExamsService {
  constructor(
    @InjectDrizzle() private readonly db: Db,
    private readonly examFacts: ExamFactsService,
  ) {}

  async list(ownerId: string): Promise<ExamSummary[]> {
    return (await this.examFacts.load(ownerId)).map(summarize);
  }

  async create(ownerId: string, draft: ExamDraft): Promise<Created> {
    await this.assertOwnership(ownerId, draft);
    const id = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(exams)
        .values({ ownerId, ...examValues(draft) })
        .returning({ id: exams.id });
      const examId = row!.id;
      if (draft.items.length)
        await tx
          .insert(examProblems)
          .values(problemRowsFrom(examId, draft.items));
      await this.saveAccess(tx, examId, draft);
      return examId;
    });
    return { id };
  }

  async draft(ownerId: string, examId: string): Promise<ExamDraft> {
    const exam = await this.owned(ownerId, examId);
    const rows = await this.db
      .select()
      .from(examProblems)
      .where(eq(examProblems.examId, examId))
      .orderBy(asc(examProblems.order));
    const { date, time } = toWarsaw(exam.startsAt ?? exam.createdAt);
    return {
      ...settingsOf(exam),
      title: exam.title,
      mode: exam.mode,
      groupId: exam.groupId ?? '',
      date,
      time,
      duration: exam.durationMin ?? DEFAULT_DURATION_MIN,
      items: itemsFrom(rows),
      password: '',
    };
  }

  async save(ownerId: string, examId: string, draft: ExamDraft) {
    const exam = await this.owned(ownerId, examId);
    const status = examStatus(exam);
    if (status !== 'draft' && status !== 'scheduled')
      throw new ConflictException(
        'Test już się rozpoczął — nie można go edytować.',
      );
    await this.assertOwnership(ownerId, draft);
    await this.db.transaction(async (tx) => {
      await tx.update(exams).set(examValues(draft)).where(eq(exams.id, examId));
      await tx.delete(examProblems).where(eq(examProblems.examId, examId));
      if (draft.items.length)
        await tx
          .insert(examProblems)
          .values(problemRowsFrom(examId, draft.items));
      await this.saveAccess(tx, examId, draft);
    });
  }

  async publish(ownerId: string, examId: string): Promise<Published> {
    const exam = await this.owned(ownerId, examId);
    if (exam.publishedAt && exam.slug) return { code: exam.slug };
    const [items, [access]] = await Promise.all([
      this.db
        .select({ problemId: examProblems.problemId })
        .from(examProblems)
        .where(eq(examProblems.examId, examId)),
      this.db.select().from(examAccess).where(eq(examAccess.examId, examId)),
    ]);
    const problem = publishProblem(
      exam,
      items.length,
      Boolean(access?.secretHash),
    );
    if (problem) throw new BadRequestException(problem);
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
      const code = joinCode();
      try {
        await this.db
          .update(exams)
          .set({ slug: code, publishedAt: new Date() })
          .where(eq(exams.id, examId));
        return { code };
      } catch (err) {
        if (postgresCode(err) !== UNIQUE_VIOLATION) throw err;
      }
    }
    throw new ConflictException(
      'Nie udało się wygenerować kodu testu. Spróbuj ponownie.',
    );
  }

  async duplicate(ownerId: string, examId: string): Promise<Created> {
    const exam = await this.owned(ownerId, examId);
    const id = await this.db.transaction(async (tx) => {
      const [copy] = await tx
        .insert(exams)
        .values({
          ownerId,
          groupId: exam.groupId,
          title: `${exam.title}${COPY_SUFFIX}`,
          mode: exam.mode,
          startsAt: exam.startsAt,
          endsAt:
            exam.startsAt && exam.durationMin
              ? new Date(exam.startsAt.getTime() + exam.durationMin * MINUTE_MS)
              : null,
          durationMin: exam.durationMin,
          attempts: exam.attempts,
          protectionLevel: exam.protectionLevel,
          resultsVisibility: exam.resultsVisibility,
          scoringRule: exam.scoringRule,
          settings: exam.settings,
        })
        .returning({ id: exams.id });
      const copyId = copy!.id;
      const rows = await tx
        .select()
        .from(examProblems)
        .where(eq(examProblems.examId, examId));
      if (rows.length)
        await tx
          .insert(examProblems)
          .values(rows.map((r) => ({ ...r, examId: copyId })));
      const accessRows = await tx
        .select()
        .from(examAccess)
        .where(eq(examAccess.examId, examId));
      if (accessRows.length)
        await tx.insert(examAccess).values(
          accessRows.map(({ type, secretHash, allowedEmails }) => ({
            examId: copyId,
            type,
            secretHash,
            allowedEmails,
          })),
        );
      return copyId;
    });
    return { id };
  }

  async owned(ownerId: string, examId: string) {
    const [exam] = await this.db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.ownerId, ownerId)));
    if (!exam) throw new NotFoundException('Nie ma takiego testu.');
    return exam;
  }

  private async assertOwnership(ownerId: string, draft: ExamDraft) {
    const problemIds = draft.items.flatMap((i) =>
      i.kind === 'problem' ? [i.id] : i.ids,
    );
    if (new Set(problemIds).size !== problemIds.length)
      throw new BadRequestException(
        'Zadanie występuje w teście więcej niż raz.',
      );
    if (problemIds.length) {
      const owned = await this.db
        .select({ id: problems.id })
        .from(problems)
        .where(
          and(eq(problems.ownerId, ownerId), inArray(problems.id, problemIds)),
        );
      if (owned.length !== problemIds.length)
        throw new BadRequestException(
          'Nie znaleziono części zadań w twoim banku.',
        );
    }
    if (draft.groupId) {
      const [group] = await this.db
        .select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.id, draft.groupId), eq(groups.ownerId, ownerId)));
      if (!group) throw new BadRequestException('Nie ma takiej klasy.');
    }
  }

  private async saveAccess(
    tx: Parameters<Parameters<Db['transaction']>[0]>[0],
    examId: string,
    draft: ExamDraft,
  ) {
    const [current] = await tx
      .select()
      .from(examAccess)
      .where(eq(examAccess.examId, examId));
    const newPassword =
      draft.access === 'password' &&
      draft.password.trim().length >= MIN_PASSWORD_LENGTH
        ? draft.password.trim()
        : null;
    const secretHash =
      draft.access !== 'password'
        ? null
        : newPassword
          ? await hashPassword(newPassword)
          : (current?.secretHash ?? null);
    const values = { examId, type: ACCESS_TYPE[draft.access], secretHash };
    if (current)
      await tx
        .update(examAccess)
        .set(values)
        .where(eq(examAccess.id, current.id));
    else await tx.insert(examAccess).values(values);
  }
}

import type {
  EventsResult,
  ExamEventInput,
  ExamIntro,
  FinishReason,
  IntroStatus,
  JoinInput,
  JoinResult,
  Language,
  SaveCodeInput,
  StudentProblem,
  StudentResult,
  StudentSession,
  StudentSubmission,
  TeacherNotice,
} from '@codeportal/contracts';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  and,
  asc,
  between,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  or,
} from 'drizzle-orm';
import type { Db } from '../db/index.js';
import {
  codeSnapshots,
  editorEvents,
  examAccess,
  examProblems,
  exams,
  groupStudents,
  groups,
  problems,
  sessions,
  submissions,
  teacherActions,
  testCases,
  users,
} from '../db/schema.js';
import {
  buildSlots,
  ExamFactsService,
  fullName,
  type Slot,
} from '../panel/exams/exam-facts.service.js';
import { verifyPassword } from '../panel/exams/exam-password.js';
import {
  examEnd,
  examStatus,
  gradeFor,
  MINUTE_MS,
  percentOf,
  settingsOf,
  type ExamRow,
} from '../panel/exams/exam-rules.js';
import { submitLatestDrafts } from '../panel/exams/submit-drafts.js';
import { examToken } from './exam-token.js';
import { languageKey, starterFiles } from './starter-files.js';

type SessionRow = typeof sessions.$inferSelect;
type ProblemRow = typeof problems.$inferSelect;
type SubmissionRow = typeof submissions.$inferSelect;

type ExamContext = {
  exam: ExamRow;
  teacher: string;
  group: string | null;
  slots: Slot[];
  problemById: Map<string, ProblemRow>;
};

type JoinMeta = { ip?: string; userAgent?: string };

const SECOND_MS = 1000;
const SAME_MOMENT_MS = SECOND_MS;
const HEX_PREFIX_LENGTH = 8;
const RECEIPT_SUFFIX_LENGTH = 4;
const NOTICE_KINDS = ['message', 'add_time'] as const;
const TEACHER_END_KINDS = ['end_session', 'end_exam'] as const;
const FINISHED_STATUSES = new Set(['finished', 'terminated']);

const NOT_FOUND = 'Nie znaleźliśmy testu o tym kodzie.';
const NOT_STARTED = 'Test jeszcze się nie zaczął.';
const CLOSED = 'Test jest zamknięty. Nie można już do niego dołączyć.';
const SSO_UNAVAILABLE =
  'Ten test wymaga logowania kontem szkoły. Ta opcja jeszcze nie działa – poproś nauczyciela o zmianę dostępu.';
const WRONG_PASSWORD = 'Nieprawidłowe hasło do testu.';
const NOT_ON_LIST =
  'Nie ma cię na liście uczestników tego testu. Sprawdź pisownię imienia i nazwiska albo zapytaj nauczyciela.';
const SESSION_ELSEWHERE =
  'Masz już rozpoczęty ten test na innym urządzeniu. Wróć do niego albo poproś nauczyciela o pomoc.';
const SESSION_GONE = 'Sesja testu wygasła. Otwórz link do testu ponownie.';
const NOT_ACTIVE = 'Test nie jest już aktywny.';
const WAITING = 'Czekasz na decyzję nauczyciela.';
const UNKNOWN_PROBLEM = 'Nie ma takiego zadania w tym teście.';
const UNKNOWN_LANGUAGE = 'Ten język nie jest dozwolony w zadaniu.';

const normalizeName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');

const attemptsExhausted = (used: number, allowed: number) =>
  `Wykorzystałeś wszystkie podejścia (${used} z ${allowed}).`;

function assignedProblemId(slot: Slot, sessionId: string) {
  const seed = Number.parseInt(
    sessionId.replace(/-/g, '').slice(0, HEX_PREFIX_LENGTH),
    16,
  );
  return slot.problemIds[seed % slot.problemIds.length]!;
}

function joinUntil(exam: ExamRow) {
  const start = exam.startsAt ?? exam.createdAt;
  const lateJoinEnd =
    start.getTime() + settingsOf(exam).lateJoinMin * MINUTE_MS;
  return new Date(Math.min(lateJoinEnd, examEnd(exam).getTime()));
}

function introStatus(exam: ExamRow, now: Date): IntroStatus {
  const status = examStatus(exam, now);
  if (status === 'scheduled') return 'scheduled';
  if (status === 'live' && now <= joinUntil(exam)) return 'live';
  return 'closed';
}

function effectiveDeadline(session: SessionRow, exam: ExamRow) {
  const deadline = session.deadlineAt ?? examEnd(exam);
  return exam.endedAt && exam.endedAt < deadline ? exam.endedAt : deadline;
}

function resultsVisible(exam: ExamRow, now: Date) {
  const { results } = settingsOf(exam);
  if (results === 'immediate') return true;
  if (results === 'after_end') return now >= examEnd(exam);
  return Boolean(exam.resultsApprovedAt);
}

function toSubmission(
  row: SubmissionRow,
  max: number,
  showPoints: boolean,
): StudentSubmission {
  const graded = row.status === 'done';
  return {
    id: row.id,
    submittedAt: row.submittedAt.toISOString(),
    state: graded ? 'graded' : row.status === 'error' ? 'error' : 'grading',
    points: graded && showPoints ? Math.round((row.score ?? 0) * max) : null,
  };
}

@Injectable()
export class StudentService {
  constructor(
    @InjectDrizzle() private readonly db: Db,
    private readonly examFacts: ExamFactsService,
    private readonly config: ConfigService,
  ) {}

  async intro(code: string): Promise<ExamIntro> {
    return this.introOf(await this.contextByCode(code));
  }

  async join(
    code: string,
    input: JoinInput,
    meta: JoinMeta,
  ): Promise<JoinResult> {
    const context = await this.contextByCode(code);
    const { exam } = context;
    const status = introStatus(exam, new Date());
    if (status === 'scheduled') throw new ConflictException(NOT_STARTED);
    if (status === 'closed') throw new ConflictException(CLOSED);
    const settings = settingsOf(exam);
    if (settings.access === 'sso')
      throw new ForbiddenException(SSO_UNAVAILABLE);
    if (settings.access === 'password')
      await this.checkPassword(exam.id, input.password ?? '');

    const identity =
      settings.access === 'list'
        ? {
            studentId: await this.rosterStudentId(exam, input.name),
            guestName: null,
          }
        : {
            studentId: null,
            guestName: input.className
              ? `${input.name} (${input.className})`
              : input.name,
          };

    if (identity.studentId) {
      const reusable = await this.reusableSession(exam, identity.studentId);
      if (reusable) return { token: this.tokenFor(reusable) };
    }

    const [row] = await this.db
      .insert(sessions)
      .values({
        examId: exam.id,
        ...identity,
        ip: meta.ip,
        userAgent: meta.userAgent,
      })
      .returning({ id: sessions.id });
    return { token: this.tokenFor(row!.id) };
  }

  async state(sessionId: string): Promise<StudentSession> {
    let session = await this.sessionRow(sessionId);
    const context = await this.contextById(session.examId);
    const now = new Date();
    session = await this.closeIfExpired(session, context.exam, now);
    const finished = FINISHED_STATUSES.has(session.status);
    if (!finished)
      await this.db
        .update(sessions)
        .set({ lastSeenAt: now })
        .where(eq(sessions.id, sessionId));

    const phase = finished
      ? 'finished'
      : session.startedAt
        ? 'active'
        : 'ready';
    const [
      name,
      notices,
      fullscreenExitsUsed,
      problemList,
      finishReason,
      result,
    ] = await Promise.all([
      this.nameOf(session),
      session.startedAt ? this.notices(session) : [],
      this.fullscreenExitsUsed(session.id),
      session.startedAt ? this.problems(session, context) : [],
      finished ? this.finishReason(session) : null,
      finished ? this.result(session, context, now) : null,
    ]);

    return {
      name,
      phase,
      exam: this.introOf(context),
      startedAt: session.startedAt?.toISOString() ?? null,
      deadlineAt: session.startedAt
        ? effectiveDeadline(session, context.exam).toISOString()
        : null,
      finishedAt: session.finishedAt?.toISOString() ?? null,
      finishReason,
      waitingForDecision: Boolean(session.waitingSince) && !finished,
      fullscreenExitsUsed,
      notices,
      problems: problemList,
      result,
    };
  }

  async start(sessionId: string) {
    const session = await this.sessionRow(sessionId);
    if (session.startedAt) return;
    const { exam } = await this.contextById(session.examId);
    const now = new Date();
    if (
      examStatus(exam, now) !== 'live' ||
      FINISHED_STATUSES.has(session.status)
    )
      throw new ConflictException(NOT_ACTIVE);
    await this.db
      .update(sessions)
      .set({
        startedAt: now,
        deadlineAt: examEnd(exam),
        status: 'active',
        lastSeenAt: now,
      })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.startedAt)));
  }

  async saveCode(sessionId: string, input: SaveCodeInput) {
    const { session } = await this.writable(sessionId, input);
    await this.db
      .insert(codeSnapshots)
      .values({ sessionId: session.id, ...input });
    await this.db
      .update(sessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  async submit(
    sessionId: string,
    input: SaveCodeInput,
  ): Promise<StudentSubmission> {
    const { session, max } = await this.writable(sessionId, input);
    if (session.waitingSince) throw new ConflictException(WAITING);
    const [row] = await this.db
      .insert(submissions)
      .values({ sessionId, ...input })
      .returning();
    return toSubmission(row!, max, false);
  }

  async events(
    sessionId: string,
    events: ExamEventInput[],
  ): Promise<EventsResult> {
    const session = await this.sessionRow(sessionId);
    const { exam } = await this.contextById(session.examId);
    const now = new Date();
    if (!session.startedAt || FINISHED_STATUSES.has(session.status))
      throw new ConflictException(NOT_ACTIVE);
    await this.db.insert(editorEvents).values(
      events.map((e) => {
        const at = new Date(e.at);
        return {
          sessionId,
          type: e.type,
          ts: at > now ? now : at,
          payload: e.payload,
        };
      }),
    );
    const fullscreenExitsUsed = await this.fullscreenExitsUsed(sessionId);
    const settings = settingsOf(exam);
    const overLimit =
      settings.fullscreen && fullscreenExitsUsed > settings.fullscreenExits;
    if (overLimit && !session.waitingSince)
      await this.db
        .update(sessions)
        .set({ waitingSince: now })
        .where(eq(sessions.id, sessionId));
    return {
      waitingForDecision: overLimit || Boolean(session.waitingSince),
      fullscreenExitsUsed,
    };
  }

  async finish(sessionId: string) {
    const session = await this.sessionRow(sessionId);
    if (FINISHED_STATUSES.has(session.status)) return;
    if (!session.startedAt) throw new ConflictException(NOT_ACTIVE);
    await this.db
      .update(sessions)
      .set({ status: 'finished', finishedAt: new Date(), waitingSince: null })
      .where(eq(sessions.id, sessionId));
  }

  private tokenFor(sessionId: string) {
    return examToken(
      sessionId,
      this.config.getOrThrow<string>('BETTER_AUTH_SECRET'),
    );
  }

  private introOf({
    exam,
    teacher,
    group,
    slots,
    problemById,
  }: ExamContext): ExamIntro {
    const settings = settingsOf(exam);
    const languages = new Set<Language>();
    for (const problem of problemById.values())
      for (const set of problem.languages)
        for (const language of set) languages.add(language);
    return {
      code: exam.slug!,
      title: exam.title,
      mode: exam.mode,
      teacher,
      group,
      status: introStatus(exam, new Date()),
      startsAt: (exam.startsAt ?? exam.createdAt).toISOString(),
      endsAt: examEnd(exam).toISOString(),
      joinUntil: joinUntil(exam).toISOString(),
      durationMin: exam.durationMin ?? 0,
      problems: slots.length,
      maxPoints: slots.reduce((sum, s) => sum + s.max, 0),
      languages: [...languages],
      attempts: settings.attempts,
      access: settings.access,
      protection: settings.protection,
      blockPaste: settings.blockPaste,
      fullscreen: settings.fullscreen,
      fullscreenExits: settings.fullscreenExits,
      serverNow: new Date().toISOString(),
    };
  }

  private async contextByCode(code: string) {
    const [exam] = await this.db
      .select({ id: exams.id })
      .from(exams)
      .where(and(eq(exams.slug, code), isNotNull(exams.publishedAt)));
    if (!exam) throw new NotFoundException(NOT_FOUND);
    return this.contextById(exam.id);
  }

  private async contextById(examId: string): Promise<ExamContext> {
    const [row] = await this.db
      .select({ exam: exams, teacher: users.name, group: groups.name })
      .from(exams)
      .innerJoin(users, eq(users.id, exams.ownerId))
      .leftJoin(groups, eq(groups.id, exams.groupId))
      .where(eq(exams.id, examId));
    if (!row) throw new NotFoundException(NOT_FOUND);
    const problemRows = await this.db
      .select({ link: examProblems, problem: problems })
      .from(examProblems)
      .innerJoin(problems, eq(problems.id, examProblems.problemId))
      .where(eq(examProblems.examId, examId))
      .orderBy(asc(examProblems.order));
    return {
      exam: row.exam,
      teacher: row.teacher,
      group: row.group,
      slots: buildSlots(
        problemRows.map(({ link, problem }) => ({
          problemId: problem.id,
          poolTag: link.poolTag,
          pointsOverride: link.pointsOverride,
          title: problem.title,
          points: problem.points,
        })),
      ),
      problemById: new Map(
        problemRows.map(({ problem }) => [problem.id, problem]),
      ),
    };
  }

  private async checkPassword(examId: string, password: string) {
    const [access] = await this.db
      .select({ secretHash: examAccess.secretHash })
      .from(examAccess)
      .where(eq(examAccess.examId, examId));
    if (
      !access?.secretHash ||
      !(await verifyPassword(password, access.secretHash))
    )
      throw new ForbiddenException(WRONG_PASSWORD);
  }

  private async rosterStudentId(exam: ExamRow, name: string) {
    const roster = exam.groupId
      ? await this.db
          .select()
          .from(groupStudents)
          .where(eq(groupStudents.groupId, exam.groupId))
      : [];
    const wanted = normalizeName(name);
    const student = roster.find((s) => normalizeName(fullName(s)) === wanted);
    if (!student) throw new ForbiddenException(NOT_ON_LIST);
    return student.id;
  }

  private async reusableSession(exam: ExamRow, studentId: string) {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(
        and(eq(sessions.examId, exam.id), eq(sessions.studentId, studentId)),
      );
    if (rows.some((s) => s.startedAt && !FINISHED_STATUSES.has(s.status)))
      throw new ConflictException(SESSION_ELSEWHERE);
    const finished = rows.filter((s) => FINISHED_STATUSES.has(s.status)).length;
    const { attempts } = settingsOf(exam);
    if (finished >= attempts)
      throw new ConflictException(attemptsExhausted(finished, attempts));
    return rows.find((s) => !s.startedAt)?.id;
  }

  private async sessionRow(sessionId: string) {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));
    if (!session) throw new UnauthorizedException(SESSION_GONE);
    return session;
  }

  private async closeIfExpired(session: SessionRow, exam: ExamRow, now: Date) {
    if (!session.startedAt || FINISHED_STATUSES.has(session.status))
      return session;
    const deadline = effectiveDeadline(session, exam);
    if (now < deadline) return session;
    const [closed] = await this.db.transaction(async (tx) => {
      await submitLatestDrafts(tx, [session.id]);
      return tx
        .update(sessions)
        .set({ status: 'finished', finishedAt: deadline, waitingSince: null })
        .where(
          and(eq(sessions.id, session.id), eq(sessions.status, session.status)),
        )
        .returning();
    });
    return closed ?? (await this.sessionRow(session.id));
  }

  private async writable(sessionId: string, input: SaveCodeInput) {
    const session = await this.sessionRow(sessionId);
    const context = await this.contextById(session.examId);
    if (
      !session.startedAt ||
      FINISHED_STATUSES.has(session.status) ||
      new Date() >= effectiveDeadline(session, context.exam)
    )
      throw new ConflictException(NOT_ACTIVE);
    const slot = context.slots.find(
      (s) => assignedProblemId(s, session.id) === input.problemId,
    );
    const problem = context.problemById.get(input.problemId);
    if (!slot || !problem) throw new NotFoundException(UNKNOWN_PROBLEM);
    if (!problem.languages.some((set) => languageKey(set) === input.language))
      throw new ConflictException(UNKNOWN_LANGUAGE);
    return { session, max: slot.max };
  }

  private async nameOf(session: SessionRow) {
    if (!session.studentId) return session.guestName ?? 'Gość';
    const [student] = await this.db
      .select()
      .from(groupStudents)
      .where(eq(groupStudents.id, session.studentId));
    return student ? fullName(student) : 'Uczeń';
  }

  private async notices(session: SessionRow): Promise<TeacherNotice[]> {
    const rows = await this.db
      .select()
      .from(teacherActions)
      .where(
        and(
          eq(teacherActions.examId, session.examId),
          inArray(teacherActions.kind, [...NOTICE_KINDS]),
          gt(teacherActions.createdAt, session.startedAt!),
          or(
            eq(teacherActions.sessionId, session.id),
            and(
              isNull(teacherActions.sessionId),
              eq(teacherActions.kind, 'add_time'),
            ),
          ),
        ),
      )
      .orderBy(asc(teacherActions.createdAt));
    return rows.map((row) => {
      const base = { id: row.id, at: row.createdAt.toISOString() };
      return row.kind === 'message'
        ? {
            ...base,
            kind: 'message',
            text: typeof row.payload.text === 'string' ? row.payload.text : '',
          }
        : { ...base, kind: 'time', minutes: Number(row.payload.minutes ?? 0) };
    });
  }

  private async fullscreenExitsUsed(sessionId: string) {
    const [lastReadmit] = await this.db
      .select({ at: teacherActions.createdAt })
      .from(teacherActions)
      .where(
        and(
          eq(teacherActions.sessionId, sessionId),
          eq(teacherActions.kind, 'readmit'),
        ),
      )
      .orderBy(desc(teacherActions.createdAt))
      .limit(1);
    const [row] = await this.db
      .select({ exits: count() })
      .from(editorEvents)
      .where(
        and(
          eq(editorEvents.sessionId, sessionId),
          eq(editorEvents.type, 'fullscreen_exit'),
          lastReadmit ? gt(editorEvents.ts, lastReadmit.at) : undefined,
        ),
      );
    return row?.exits ?? 0;
  }

  private async problems(
    session: SessionRow,
    context: ExamContext,
  ): Promise<StudentProblem[]> {
    const assigned = context.slots.map((slot) => ({
      slot,
      problem: context.problemById.get(assignedProblemId(slot, session.id))!,
    }));
    const ids = assigned.map((a) => a.problem.id);
    if (ids.length === 0) return [];
    const [tests, drafts, submissionRows] = await Promise.all([
      this.db
        .select()
        .from(testCases)
        .where(inArray(testCases.problemId, ids))
        .orderBy(asc(testCases.position)),
      this.db
        .selectDistinctOn([codeSnapshots.problemId])
        .from(codeSnapshots)
        .where(eq(codeSnapshots.sessionId, session.id))
        .orderBy(codeSnapshots.problemId, desc(codeSnapshots.createdAt)),
      this.db
        .select()
        .from(submissions)
        .where(eq(submissions.sessionId, session.id))
        .orderBy(desc(submissions.submittedAt)),
    ]);
    const showPoints = settingsOf(context.exam).results === 'immediate';
    return assigned.map(({ slot, problem }) => {
      const own = tests.filter((t) => t.problemId === problem.id);
      const draft = drafts.find((d) => d.problemId === problem.id);
      return {
        number: slot.number,
        id: problem.id,
        title: problem.title,
        type: problem.type,
        max: slot.max,
        tags: problem.tags,
        statement: problem.statementMd,
        inputSpec: problem.inputSpec,
        outputSpec: problem.outputSpec,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        tests: own.length,
        examples: own
          .filter((t) => t.isSample)
          .map((t) => ({ input: t.input, output: t.expectedOutput })),
        languages: problem.languages,
        starter: starterFiles(problem.languages, problem.starterCode),
        draft: draft
          ? {
              language: draft.language,
              files: draft.files,
              savedAt: draft.createdAt.toISOString(),
            }
          : null,
        submissions: submissionRows
          .filter((s) => s.problemId === problem.id)
          .map((s) => toSubmission(s, slot.max, showPoints)),
      };
    });
  }

  private async finishReason(session: SessionRow): Promise<FinishReason> {
    const [teacherEnd] = await this.db
      .select({ id: teacherActions.id })
      .from(teacherActions)
      .where(
        and(
          eq(teacherActions.examId, session.examId),
          inArray(teacherActions.kind, [...TEACHER_END_KINDS]),
          or(
            eq(teacherActions.sessionId, session.id),
            isNull(teacherActions.sessionId),
          ),
          between(
            teacherActions.createdAt,
            new Date(session.finishedAt!.getTime() - SAME_MOMENT_MS),
            new Date(session.finishedAt!.getTime() + SAME_MOMENT_MS),
          ),
        ),
      )
      .limit(1);
    if (teacherEnd) return 'teacher';
    if (session.deadlineAt && session.finishedAt! >= session.deadlineAt)
      return 'time';
    return 'student';
  }

  private async result(
    session: SessionRow,
    context: ExamContext,
    now: Date,
  ): Promise<StudentResult> {
    const rows = await this.db
      .select({ problemId: submissions.problemId, status: submissions.status })
      .from(submissions)
      .where(eq(submissions.sessionId, session.id));
    const submittedIds = new Set(rows.map((r) => r.problemId));
    const base = {
      submitted: context.slots.filter((s) =>
        s.problemIds.some((id) => submittedIds.has(id)),
      ).length,
      problems: context.slots.length,
      workSec:
        session.startedAt && session.finishedAt
          ? Math.round(
              (session.finishedAt.getTime() - session.startedAt.getTime()) /
                SECOND_MS,
            )
          : 0,
      receipt: `CP-${context.exam.slug!.split('-')[0]}-${session.id.slice(0, RECEIPT_SUFFIX_LENGTH).toUpperCase()}`,
    };
    if (!resultsVisible(context.exam, now)) return { visible: false, ...base };

    const facts = await this.examFacts.loadOne(
      context.exam.ownerId,
      context.exam.id,
    );
    const own = facts.sessions.find((s) => s.row.id === session.id);
    const points = own?.total ?? 0;
    const percent = percentOf(points, facts.maxPoints);
    return {
      visible: true,
      ...base,
      points,
      max: facts.maxPoints,
      percent,
      grade: gradeFor(percent, settingsOf(context.exam).thresholds),
      grading: rows.filter(
        (r) => r.status === 'queued' || r.status === 'running',
      ).length,
      approved: Boolean(context.exam.resultsApprovedAt),
      breakdown: facts.slots.map((slot, i) => ({
        number: slot.number,
        title: context.problemById.get(assignedProblemId(slot, session.id))!
          .title,
        points: own?.scores[i] ?? 0,
        max: slot.max,
      })),
    };
  }
}

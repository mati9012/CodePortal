import type {
  ExamProblem,
  ExamStatus,
  ExamSummary,
} from '@codeportal/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import type { Db } from '../../db/index.js';
import {
  codeSnapshots,
  editorEvents,
  examProblems,
  exams,
  groupStudents,
  groups,
  problems,
  reviews,
  sessions,
  similarityPairs,
  submissions,
  teacherActions,
  users,
} from '../../db/schema.js';
import {
  average,
  examStatus,
  isGraded,
  percentOf,
  settingsOf,
  type ExamRow,
} from './exam-rules.js';
import {
  HIGH_RISK,
  JUMP_MAX_MS,
  JUMP_MIN_LINES,
  riskScore,
  type SignalFacts,
} from './risk.js';

type SessionRow = typeof sessions.$inferSelect;
type SubmissionRow = typeof submissions.$inferSelect;
type ReviewRow = typeof reviews.$inferSelect;
type SignalEventRow = typeof editorEvents.$inferSelect;
type TeacherActionRow = typeof teacherActions.$inferSelect;
export type StudentRow = typeof groupStudents.$inferSelect;

export type Slot = {
  number: number;
  problemIds: string[];
  titles: string[];
  max: number;
};

export type SessionFacts = {
  row: SessionRow;
  name: string;
  scores: number[];
  autoScores: number[];
  scoringSubmissions: (SubmissionRow | undefined)[];
  slotReviews: (ReviewRow | undefined)[];
  submissions: SubmissionRow[];
  signalEvents: SignalEventRow[];
  signals: SignalFacts;
  risk: number;
  total: number;
  activeProblem?: number;
};

export type ExamFacts = {
  exam: ExamRow;
  status: ExamStatus;
  group: { id: string; name: string } | null;
  roster: StudentRow[];
  slots: Slot[];
  maxPoints: number;
  sessions: SessionFacts[];
  actions: TeacherActionRow[];
};

type PayloadNumbers = {
  chars?: number;
  insertedLines?: number;
  durationMs?: number;
  problemId?: string;
};

const SIGNAL_EVENT_TYPES = [
  'paste_blocked',
  'blur',
  'fullscreen_exit',
] as const;

const payloadOf = (event: SignalEventRow) =>
  (event.payload ?? {}) as PayloadNumbers;

export const fullName = (s: { firstName: string; lastName: string }) =>
  `${s.firstName} ${s.lastName}`;

export function buildSlots(
  rows: {
    problemId: string;
    poolTag: string | null;
    pointsOverride: number | null;
    title: string;
    points: number;
  }[],
) {
  const slots: Slot[] = [];
  const byKey = new Map<string, Slot>();
  for (const row of rows) {
    const key = row.poolTag ?? row.problemId;
    const existing = byKey.get(key);
    if (existing) {
      existing.problemIds.push(row.problemId);
      existing.titles.push(row.title);
      continue;
    }
    const slot: Slot = {
      number: slots.length + 1,
      problemIds: [row.problemId],
      titles: [row.title],
      max: row.pointsOverride ?? row.points,
    };
    slots.push(slot);
    byKey.set(key, slot);
  }
  return slots;
}

function pickScoring(list: SubmissionRow[], rule: string) {
  if (list.length === 0) return undefined;
  if (rule === 'last')
    return list.reduce((a, b) => (b.submittedAt > a.submittedAt ? b : a));
  return list.reduce((a, b) => ((b.score ?? 0) > (a.score ?? 0) ? b : a));
}

@Injectable()
export class ExamFactsService {
  constructor(@InjectDrizzle() private readonly db: Db) {}

  async loadOne(ownerId: string, examId: string) {
    const [facts] = await this.load(ownerId, [examId]);
    if (!facts) throw new NotFoundException('Nie ma takiego testu.');
    return facts;
  }

  async load(ownerId: string, examIds?: string[]): Promise<ExamFacts[]> {
    const examRows = await this.db
      .select()
      .from(exams)
      .where(
        and(
          eq(exams.ownerId, ownerId),
          examIds ? inArray(exams.id, examIds) : undefined,
        ),
      )
      .orderBy(desc(exams.startsAt));
    if (examRows.length === 0) return [];
    const ids = examRows.map((e) => e.id);
    const groupIds = [
      ...new Set(examRows.flatMap((e) => (e.groupId ? [e.groupId] : []))),
    ];

    const [
      groupRows,
      rosterRows,
      problemRows,
      sessionRows,
      actionRows,
      similarityRows,
    ] = await Promise.all([
      groupIds.length
        ? this.db
            .select({ id: groups.id, name: groups.name })
            .from(groups)
            .where(inArray(groups.id, groupIds))
        : [],
      groupIds.length
        ? this.db
            .select()
            .from(groupStudents)
            .where(inArray(groupStudents.groupId, groupIds))
        : [],
      this.db
        .select({
          examId: examProblems.examId,
          problemId: examProblems.problemId,
          poolTag: examProblems.poolTag,
          pointsOverride: examProblems.pointsOverride,
          title: problems.title,
          points: problems.points,
        })
        .from(examProblems)
        .innerJoin(problems, eq(problems.id, examProblems.problemId))
        .where(inArray(examProblems.examId, ids))
        .orderBy(asc(examProblems.order)),
      this.db
        .select({
          session: sessions,
          firstName: groupStudents.firstName,
          lastName: groupStudents.lastName,
          userName: users.name,
        })
        .from(sessions)
        .leftJoin(groupStudents, eq(groupStudents.id, sessions.studentId))
        .leftJoin(users, eq(users.id, sessions.userId))
        .where(inArray(sessions.examId, ids)),
      this.db
        .select()
        .from(teacherActions)
        .where(inArray(teacherActions.examId, ids))
        .orderBy(desc(teacherActions.createdAt)),
      this.db
        .select()
        .from(similarityPairs)
        .where(inArray(similarityPairs.examId, ids)),
    ]);

    const sessionIds = sessionRows.map((r) => r.session.id);
    const [submissionRows, eventRows, latestSnapshots] = sessionIds.length
      ? await Promise.all([
          this.db
            .select()
            .from(submissions)
            .where(
              and(
                inArray(submissions.sessionId, sessionIds),
                eq(submissions.status, 'done'),
              ),
            )
            .orderBy(asc(submissions.submittedAt)),
          this.db
            .select()
            .from(editorEvents)
            .where(
              and(
                inArray(editorEvents.sessionId, sessionIds),
                or(
                  inArray(editorEvents.type, [...SIGNAL_EVENT_TYPES]),
                  and(
                    eq(editorEvents.type, 'delta'),
                    sql`(${editorEvents.payload}->>'insertedLines')::int >= ${JUMP_MIN_LINES}`,
                    sql`(${editorEvents.payload}->>'durationMs')::int <= ${JUMP_MAX_MS}`,
                  ),
                ),
              ),
            )
            .orderBy(asc(editorEvents.ts)),
          this.db
            .selectDistinctOn([codeSnapshots.sessionId], {
              sessionId: codeSnapshots.sessionId,
              problemId: codeSnapshots.problemId,
            })
            .from(codeSnapshots)
            .where(inArray(codeSnapshots.sessionId, sessionIds))
            .orderBy(codeSnapshots.sessionId, desc(codeSnapshots.createdAt)),
        ])
      : [[], [], []];

    const submissionIds = submissionRows.map((s) => s.id);
    const reviewRows = submissionIds.length
      ? await this.db
          .select()
          .from(reviews)
          .where(inArray(reviews.submissionId, submissionIds))
          .orderBy(asc(reviews.createdAt))
      : [];

    const groupName = new Map(groupRows.map((g) => [g.id, g.name]));
    const submissionById = new Map(submissionRows.map((s) => [s.id, s]));
    const sessionName = new Map(
      sessionRows.map((r) => [
        r.session.id,
        r.firstName && r.lastName
          ? fullName({ firstName: r.firstName, lastName: r.lastName })
          : (r.session.guestName ?? r.userName ?? 'Gość'),
      ]),
    );
    const activeProblemOf = new Map(
      latestSnapshots.map((s) => [s.sessionId, s.problemId]),
    );

    return examRows.map((exam) => {
      const slots = buildSlots(problemRows.filter((p) => p.examId === exam.id));
      const slotOf = new Map(
        slots.flatMap((slot) =>
          slot.problemIds.map((id) => [id, slot] as const),
        ),
      );
      const rule = settingsOf(exam).scoring;
      const maxPoints = slots.reduce((sum, s) => sum + s.max, 0);
      const examSimilarity = similarityRows.filter((p) => p.examId === exam.id);

      const sessionFacts = sessionRows
        .filter((r) => r.session.examId === exam.id)
        .map(({ session }): SessionFacts => {
          const own = submissionRows.filter((s) => s.sessionId === session.id);
          const ownSubmissionIds = new Set(own.map((s) => s.id));
          const ownReviews = reviewRows.filter((r) =>
            ownSubmissionIds.has(r.submissionId),
          );
          const inSlot = (slot: Slot, submissionId: string) =>
            slot.problemIds.includes(
              submissionById.get(submissionId)!.problemId,
            );
          const scoringSubmissions = slots.map((slot) =>
            pickScoring(
              own.filter((s) => inSlot(slot, s.id)),
              rule,
            ),
          );
          const slotReviews = slots.map((slot) =>
            ownReviews.filter((r) => inSlot(slot, r.submissionId)).at(-1),
          );
          const autoScores = slots.map((slot, i) =>
            Math.round((scoringSubmissions[i]?.score ?? 0) * slot.max),
          );
          const scores = autoScores.map(
            (auto, i) => slotReviews[i]?.manualScore ?? auto,
          );
          const signalEvents = eventRows.filter(
            (e) => e.sessionId === session.id,
          );
          const strongestPair = examSimilarity
            .filter(
              (p) =>
                ownSubmissionIds.has(p.submissionA) ||
                ownSubmissionIds.has(p.submissionB),
            )
            .sort((a, b) => b.score - a.score)[0];
          const otherSubmission =
            strongestPair &&
            submissionById.get(
              ownSubmissionIds.has(strongestPair.submissionA)
                ? strongestPair.submissionB
                : strongestPair.submissionA,
            );
          const signals: SignalFacts = {
            pastes: signalEvents
              .filter((e) => e.type === 'paste_blocked')
              .map((e) => ({ at: e.ts, chars: payloadOf(e).chars ?? 0 })),
            jumps: signalEvents
              .filter((e) => e.type === 'delta')
              .map((e) => ({
                problemNumber:
                  slotOf.get(payloadOf(e).problemId ?? '')?.number ?? null,
                lines: payloadOf(e).insertedLines ?? 0,
                durationMs: payloadOf(e).durationMs ?? 0,
              })),
            focusLosses: signalEvents.filter(
              (e) => e.type === 'blur' || e.type === 'fullscreen_exit',
            ).length,
            focusLossMs: signalEvents.reduce(
              (sum, e) =>
                sum + (e.type === 'delta' ? 0 : (payloadOf(e).durationMs ?? 0)),
              0,
            ),
            similarity:
              strongestPair && otherSubmission
                ? {
                    student:
                      sessionName.get(otherSubmission.sessionId) ??
                      'inny uczeń',
                    problemNumber:
                      slotOf.get(strongestPair.problemId)?.number ?? 1,
                    score: strongestPair.score,
                  }
                : null,
          };
          return {
            row: session,
            name: sessionName.get(session.id)!,
            scores,
            autoScores,
            scoringSubmissions,
            slotReviews,
            submissions: own,
            signalEvents,
            signals,
            risk: riskScore(signals),
            total: scores.reduce((sum, s) => sum + s, 0),
            activeProblem: slotOf.get(activeProblemOf.get(session.id) ?? '')
              ?.number,
          };
        });

      return {
        exam,
        status: examStatus(exam),
        group: exam.groupId
          ? { id: exam.groupId, name: groupName.get(exam.groupId) ?? '' }
          : null,
        roster: rosterRows.filter((s) => s.groupId === exam.groupId),
        slots,
        maxPoints,
        sessions: sessionFacts,
        actions: actionRows.filter((a) => a.examId === exam.id),
      };
    });
  }
}

export const startedSessions = (facts: ExamFacts) =>
  facts.sessions.filter((s) => s.row.startedAt);

export function summarize(facts: ExamFacts): ExamSummary {
  const { exam, status } = facts;
  const started = startedSessions(facts);
  const graded = isGraded(status);
  return {
    id: exam.id,
    title: exam.title,
    groupId: facts.group?.id ?? null,
    group: facts.group?.name ?? null,
    mode: exam.mode,
    status,
    startsAt: (exam.startsAt ?? exam.createdAt).toISOString(),
    durationMin: exam.durationMin ?? 0,
    problems: facts.slots.length,
    participants: {
      joined: started.length,
      total: facts.group ? facts.roster.length : started.length,
    },
    ...(graded && {
      average: average(started.map((s) => percentOf(s.total, facts.maxPoints))),
      toReview: started.filter((s) => s.row.reviewStatus === 'pending').length,
      flagged: started.filter((s) => s.risk >= HIGH_RISK).length,
    }),
    ...(exam.publishedAt && exam.slug && { code: exam.slug }),
  };
}

export function problemsOf(facts: ExamFacts): ExamProblem[] {
  const started = startedSessions(facts);
  return facts.slots.map((slot, i) => ({
    number: slot.number,
    problemId: slot.problemIds[0]!,
    title: slot.titles.join(' / '),
    max: slot.max,
    poolSize: slot.problemIds.length,
    passRate:
      started.length && slot.max
        ? (average(started.map((s) => percentOf(s.scores[i]!, slot.max))) ??
          null)
        : null,
  }));
}

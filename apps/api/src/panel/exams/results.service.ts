import type {
  ExamResults,
  ReplayFrame,
  ReplayMarker,
  ResultRow,
  ReviewInput,
  SimilarSolution,
  StudentReport,
} from '@codeportal/contracts';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, inArray, isNotNull, or } from 'drizzle-orm';
import type { Db } from '../../db/index.js';
import {
  codeSnapshots,
  exams,
  reviews,
  sessions,
  similarityPairs,
} from '../../db/schema.js';
import {
  ExamFactsService,
  problemsOf,
  startedSessions,
  summarize,
  type ExamFacts,
  type SessionFacts,
} from './exam-facts.service.js';
import { examEnd, hasStarted, MINUTE_MS, settingsOf } from './exam-rules.js';
import { joinFiles } from './code-files.js';
import { signalsFrom } from './risk.js';

const PAUSE_MIN_MS = 2 * MINUTE_MS;
const SECOND_MS = 1000;

const toRow = (s: SessionFacts): ResultRow => ({
  sessionId: s.row.id,
  name: s.name,
  scores: s.scores,
  risk: s.risk,
  review: s.row.reviewStatus,
});

const rankedSessions = (facts: ExamFacts) =>
  [...startedSessions(facts)].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name, 'pl'),
  );

function assertResults(facts: ExamFacts) {
  if (!hasStarted(facts.status))
    throw new ConflictException('Test jeszcze się nie rozpoczął.');
}

@Injectable()
export class ResultsService {
  constructor(
    @InjectDrizzle() private readonly db: Db,
    private readonly examFacts: ExamFactsService,
  ) {}

  async results(ownerId: string, examId: string): Promise<ExamResults> {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    assertResults(facts);
    return {
      exam: summarize(facts),
      problems: problemsOf(facts),
      rows: rankedSessions(facts).map(toRow),
      thresholds: settingsOf(facts.exam).thresholds,
      approved: facts.status === 'finished',
    };
  }

  async approve(ownerId: string, examId: string) {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    if (facts.status !== 'review')
      throw new ConflictException(
        'Wyniki można zatwierdzić po zakończeniu testu.',
      );
    await this.db.transaction(async (tx) => {
      await tx
        .update(exams)
        .set({ resultsApprovedAt: new Date() })
        .where(eq(exams.id, examId));
      await tx
        .update(sessions)
        .set({ reviewStatus: 'approved' })
        .where(
          and(
            eq(sessions.examId, examId),
            eq(sessions.reviewStatus, 'pending'),
            isNotNull(sessions.startedAt),
          ),
        );
    });
  }

  async report(
    ownerId: string,
    examId: string,
    sessionId: string,
  ): Promise<StudentReport> {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    assertResults(facts);
    const ranked = rankedSessions(facts);
    const index = ranked.findIndex((s) => s.row.id === sessionId);
    if (index === -1) throw new NotFoundException('Nie ma takiej pracy.');
    const session = ranked[index]!;
    return {
      exam: summarize(facts),
      problems: problemsOf(facts),
      thresholds: settingsOf(facts.exam).thresholds,
      row: toRow(session),
      previousId: ranked[index - 1]?.row.id ?? null,
      nextId: ranked[index + 1]?.row.id ?? null,
      finishedAt: session.row.finishedAt?.toISOString() ?? null,
      submissions: session.submissions.length,
      signals: signalsFrom(session.signals),
      similar: await this.similar(facts, session),
      reviews: facts.slots.map((slot, i) => ({
        problemNumber: slot.number,
        autoScore: session.autoScores[i]!,
        max: slot.max,
        score: session.slotReviews[i]?.manualScore ?? null,
        rubric: session.slotReviews[i]?.rubric ?? {},
        comment: session.slotReviews[i]?.comment ?? '',
      })),
      replay: await this.replay(facts, session),
    };
  }

  async review(
    reviewerId: string,
    examId: string,
    sessionId: string,
    input: ReviewInput,
  ) {
    const facts = await this.examFacts.loadOne(reviewerId, examId);
    assertResults(facts);
    const session = facts.sessions.find((s) => s.row.id === sessionId);
    if (!session) throw new NotFoundException('Nie ma takiej pracy.');
    const slotIndex = facts.slots.findIndex(
      (s) => s.number === input.problemNumber,
    );
    const slot = facts.slots[slotIndex];
    if (!slot)
      throw new BadRequestException('Nie ma takiego zadania w teście.');
    if (input.score > slot.max)
      throw new BadRequestException(`Maksymalnie ${slot.max} pkt.`);
    if (input.score !== session.autoScores[slotIndex] && !input.comment)
      throw new BadRequestException('Przy zmianie punktów podaj uzasadnienie.');
    const submission =
      session.scoringSubmissions[slotIndex] ??
      session.submissions
        .filter((s) => slot.problemIds.includes(s.problemId))
        .at(-1);
    if (!submission)
      throw new ConflictException(
        'Uczeń nie zgłosił rozwiązania tego zadania.',
      );
    await this.db.transaction(async (tx) => {
      await tx.insert(reviews).values({
        submissionId: submission.id,
        reviewerId,
        manualScore: input.score,
        rubric: input.rubric,
        comment: input.comment,
      });
      await tx
        .update(sessions)
        .set({ reviewStatus: 'approved' })
        .where(eq(sessions.id, sessionId));
    });
  }

  async flag(ownerId: string, examId: string, sessionId: string) {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    assertResults(facts);
    if (!facts.sessions.some((s) => s.row.id === sessionId))
      throw new NotFoundException('Nie ma takiej pracy.');
    await this.db
      .update(sessions)
      .set({ reviewStatus: 'flagged' })
      .where(eq(sessions.id, sessionId));
  }

  private async similar(
    facts: ExamFacts,
    session: SessionFacts,
  ): Promise<SimilarSolution[]> {
    const ownIds = session.submissions.map((s) => s.id);
    if (ownIds.length === 0) return [];
    const pairs = await this.db
      .select()
      .from(similarityPairs)
      .where(
        and(
          eq(similarityPairs.examId, facts.exam.id),
          or(
            inArray(similarityPairs.submissionA, ownIds),
            inArray(similarityPairs.submissionB, ownIds),
          ),
        ),
      );
    const own = new Set(ownIds);
    const sessionOfSubmission = new Map(
      facts.sessions.flatMap((s) =>
        s.submissions.map((sub) => [sub.id, s] as const),
      ),
    );
    return pairs
      .map((pair) => {
        const other = sessionOfSubmission.get(
          own.has(pair.submissionA) ? pair.submissionB : pair.submissionA,
        );
        const slot = facts.slots.find((s) =>
          s.problemIds.includes(pair.problemId),
        );
        return other && slot
          ? {
              sessionId: other.row.id,
              student: other.name,
              problem: `Z${slot.number}`,
              percent: Math.round(pair.score * 100),
            }
          : null;
      })
      .filter((s): s is SimilarSolution => s !== null)
      .sort((a, b) => b.percent - a.percent);
  }

  private async replay(
    facts: ExamFacts,
    session: SessionFacts,
  ): Promise<StudentReport['replay']> {
    const startedAt = session.row.startedAt!;
    const endedAt =
      session.row.finishedAt ??
      (facts.status === 'live' ? new Date() : examEnd(facts.exam));
    const secondsFrom = (d: Date) =>
      Math.max(0, Math.round((d.getTime() - startedAt.getTime()) / SECOND_MS));
    const snapshots = await this.db
      .select()
      .from(codeSnapshots)
      .where(eq(codeSnapshots.sessionId, session.row.id))
      .orderBy(asc(codeSnapshots.createdAt));

    const frames: Record<number, ReplayFrame[]> = {};
    for (const snap of snapshots) {
      const slot = facts.slots.find((s) =>
        s.problemIds.includes(snap.problemId),
      );
      if (!slot) continue;
      (frames[slot.number] ??= []).push({
        at: secondsFrom(snap.createdAt),
        code: joinFiles(snap.files),
      });
    }

    const markers: ReplayMarker[] = [
      ...session.signalEvents.map((e): ReplayMarker => ({
        at: secondsFrom(e.ts),
        kind:
          e.type === 'paste_blocked'
            ? 'paste'
            : e.type === 'delta'
              ? 'jump'
              : 'fullscreen',
      })),
      ...session.submissions.map((s): ReplayMarker => ({
        at: secondsFrom(s.submittedAt),
        kind: 'submit',
      })),
      ...snapshots
        .slice(1)
        .flatMap((snap, i): ReplayMarker[] =>
          snap.createdAt.getTime() - snapshots[i]!.createdAt.getTime() >=
          PAUSE_MIN_MS
            ? [{ at: secondsFrom(snapshots[i]!.createdAt), kind: 'pause' }]
            : [],
        ),
    ].sort((a, b) => a.at - b.at);

    return { durationSec: Math.max(1, secondsFrom(endedAt)), markers, frames };
  }
}

import type { AddTimeInput, ExamDetail, LiveCode } from '@codeportal/contracts';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq, inArray, isNotNull, ne } from 'drizzle-orm';
import type { Db } from '../../db/index.js';
import {
  codeSnapshots,
  exams,
  sessions,
  teacherActions,
} from '../../db/schema.js';
import {
  ExamFactsService,
  problemsOf,
  summarize,
  type ExamFacts,
} from './exam-facts.service.js';
import { examEnd, examTiming, MINUTE_MS, settingsOf } from './exam-rules.js';
import { joinFiles } from './code-files.js';
import { liveEvents, liveParticipants } from './live.js';
import { submitLatestDrafts } from './submit-drafts.js';

const ACTIVE_STATUSES = ['pending', 'active'] as const;

function assertLive(facts: ExamFacts) {
  if (facts.status !== 'live') throw new ConflictException('Test nie trwa.');
}

function sessionOf(facts: ExamFacts, sessionId: string) {
  const session = facts.sessions.find((s) => s.row.id === sessionId);
  if (!session) throw new NotFoundException('Nie ma takiego uczestnika.');
  return session;
}

@Injectable()
export class LiveService {
  constructor(
    @InjectDrizzle() private readonly db: Db,
    private readonly examFacts: ExamFactsService,
  ) {}

  async detail(ownerId: string, examId: string): Promise<ExamDetail> {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    return {
      exam: summarize(facts),
      problems: problemsOf(facts),
      settings: settingsOf(facts.exam),
      timing: examTiming(facts.exam),
      participants: liveParticipants(facts),
      events: liveEvents(facts),
      submissions: facts.sessions.reduce(
        (sum, s) => sum + s.submissions.length,
        0,
      ),
    };
  }

  async addTime(ownerId: string, examId: string, input: AddTimeInput) {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    assertLive(facts);
    const extraMs = input.minutes * MINUTE_MS;
    const payload = { minutes: input.minutes, reason: input.reason };
    await this.db.transaction(async (tx) => {
      if (input.sessionIds === 'all') {
        await tx
          .update(exams)
          .set({ endsAt: new Date(examEnd(facts.exam).getTime() + extraMs) })
          .where(eq(exams.id, examId));
        const extended = facts.sessions.filter((s) => s.row.deadlineAt);
        for (const s of extended)
          await tx
            .update(sessions)
            .set({
              deadlineAt: new Date(s.row.deadlineAt!.getTime() + extraMs),
            })
            .where(eq(sessions.id, s.row.id));
        await tx
          .insert(teacherActions)
          .values({ examId, kind: 'add_time', payload });
        return;
      }
      for (const sessionId of input.sessionIds) {
        const session = sessionOf(facts, sessionId);
        const deadline = session.row.deadlineAt ?? examEnd(facts.exam);
        await tx
          .update(sessions)
          .set({ deadlineAt: new Date(deadline.getTime() + extraMs) })
          .where(eq(sessions.id, sessionId));
        await tx
          .insert(teacherActions)
          .values({ examId, sessionId, kind: 'add_time', payload });
      }
    });
  }

  async endExam(ownerId: string, examId: string) {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    assertLive(facts);
    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx.update(exams).set({ endedAt: now }).where(eq(exams.id, examId));
      await submitLatestDrafts(
        tx,
        facts.sessions
          .filter((s) => s.row.startedAt && s.row.status === 'active')
          .map((s) => s.row.id),
      );
      await tx
        .update(sessions)
        .set({ status: 'finished', finishedAt: now, waitingSince: null })
        .where(
          and(
            eq(sessions.examId, examId),
            inArray(sessions.status, [...ACTIVE_STATUSES]),
            isNotNull(sessions.startedAt),
          ),
        );
      await tx
        .insert(teacherActions)
        .values({ examId, kind: 'end_exam', createdAt: now });
    });
  }

  async readmit(ownerId: string, examId: string, sessionId: string) {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    assertLive(facts);
    sessionOf(facts, sessionId);
    await this.db.transaction(async (tx) => {
      await tx
        .update(sessions)
        .set({ waitingSince: null })
        .where(eq(sessions.id, sessionId));
      await tx
        .insert(teacherActions)
        .values({ examId, sessionId, kind: 'readmit' });
    });
  }

  async endSession(ownerId: string, examId: string, sessionId: string) {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    assertLive(facts);
    const session = sessionOf(facts, sessionId);
    const now = new Date();
    await this.db.transaction(async (tx) => {
      if (session.row.status === 'active')
        await submitLatestDrafts(tx, [sessionId]);
      await tx
        .update(sessions)
        .set({ status: 'finished', finishedAt: now, waitingSince: null })
        .where(
          and(eq(sessions.id, sessionId), ne(sessions.status, 'finished')),
        );
      await tx
        .insert(teacherActions)
        .values({ examId, sessionId, kind: 'end_session', createdAt: now });
    });
  }

  async message(
    ownerId: string,
    examId: string,
    sessionId: string,
    text: string,
  ) {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    assertLive(facts);
    sessionOf(facts, sessionId);
    await this.db
      .insert(teacherActions)
      .values({ examId, sessionId, kind: 'message', payload: { text } });
  }

  async code(
    ownerId: string,
    examId: string,
    sessionId: string,
  ): Promise<LiveCode> {
    const facts = await this.examFacts.loadOne(ownerId, examId);
    sessionOf(facts, sessionId);
    const [snapshot] = await this.db
      .select()
      .from(codeSnapshots)
      .where(eq(codeSnapshots.sessionId, sessionId))
      .orderBy(desc(codeSnapshots.createdAt))
      .limit(1);
    if (!snapshot)
      return { problemNumber: null, language: null, code: '', savedAt: null };
    const slot = facts.slots.find((s) =>
      s.problemIds.includes(snapshot.problemId),
    );
    return {
      problemNumber: slot?.number ?? null,
      language: snapshot.language,
      code: joinFiles(snapshot.files),
      savedAt: snapshot.createdAt.toISOString(),
    };
  }
}

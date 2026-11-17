import type {
  ActivityItem,
  ActivityTone,
  Dashboard,
  LiveEvent,
  ReviewItem,
} from '@codeportal/contracts';
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { count, eq } from 'drizzle-orm';
import type { Db } from '../../db/index.js';
import { groupStudents, groups, problems } from '../../db/schema.js';
import {
  ExamFactsService,
  startedSessions,
  summarize,
  type ExamFacts,
} from '../exams/exam-facts.service.js';
import {
  average,
  examTiming,
  isGraded,
  MINUTE_MS,
  percentOf,
} from '../exams/exam-rules.js';
import { liveEvents } from '../exams/live.js';
import { mainReason, signalsFrom } from '../exams/risk.js';

const DAY_MS = 24 * 60 * MINUTE_MS;
const AVERAGE_WINDOW_MS = 30 * DAY_MS;
const UPCOMING_LIMIT = 5;
const ACTIVITY_LIMIT = 6;

const EVENT_TONE: Record<LiveEvent['kind'], ActivityTone> = {
  submit: 'accent',
  paste: 'warning',
  jump: 'warning',
  fullscreen: 'warning',
  similarity: 'warning',
  idle: 'warning',
  finish: 'success',
  time: 'accent',
  question: 'neutral',
};

function reviewQueue(facts: ExamFacts[]): ReviewItem[] {
  return facts
    .filter((f) => f.status === 'review')
    .flatMap((f) =>
      startedSessions(f)
        .filter((s) => s.row.reviewStatus === 'pending')
        .map((s) => ({
          sessionId: s.row.id,
          student: s.name,
          examId: f.exam.id,
          exam: f.exam.title,
          group: f.group?.name ?? null,
          score: s.total,
          max: f.maxPoints,
          risk: s.risk,
          reason: mainReason(signalsFrom(s.signals)),
        })),
    )
    .sort((a, b) => b.risk - a.risk);
}

function activity(facts: ExamFacts[]): ActivityItem[] {
  const fromLive = facts
    .filter((f) => f.status === 'live')
    .flatMap((f) =>
      liveEvents(f).map((e) => ({
        id: e.id,
        at: e.at,
        text: `${e.student}: ${e.text}`,
        tone: EVENT_TONE[e.kind],
      })),
    );
  const fromExams = facts.flatMap((f): ActivityItem[] =>
    f.exam.publishedAt
      ? [
          {
            id: `pub-${f.exam.id}`,
            at: f.exam.publishedAt.toISOString(),
            text: `Opublikowano „${f.exam.title}”`,
            tone: 'success',
          },
        ]
      : [
          {
            id: `draft-${f.exam.id}`,
            at: f.exam.updatedAt.toISOString(),
            text: `Zapisano szkic „${f.exam.title || 'Bez nazwy'}”`,
            tone: 'neutral',
          },
        ],
  );
  return [...fromLive, ...fromExams]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, ACTIVITY_LIMIT);
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectDrizzle() private readonly db: Db,
    private readonly examFacts: ExamFactsService,
  ) {}

  async dashboard(ownerId: string): Promise<Dashboard> {
    const [facts, [problemCount], [groupCount], [studentCount]] =
      await Promise.all([
        this.examFacts.load(ownerId),
        this.db
          .select({ n: count() })
          .from(problems)
          .where(eq(problems.ownerId, ownerId)),
        this.db
          .select({ n: count() })
          .from(groups)
          .where(eq(groups.ownerId, ownerId)),
        this.db
          .select({ n: count() })
          .from(groupStudents)
          .innerJoin(groups, eq(groups.id, groupStudents.groupId))
          .where(eq(groups.ownerId, ownerId)),
      ]);
    const summaries = facts.map(summarize);
    const liveFacts = facts.find((f) => f.status === 'live');
    const scheduled = summaries
      .filter((e) => e.status === 'scheduled')
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const queue = reviewQueue(facts);
    const since = Date.now() - AVERAGE_WINDOW_MS;
    const recentPercents = facts
      .filter(
        (f) => isGraded(f.status) && (f.exam.startsAt?.getTime() ?? 0) >= since,
      )
      .flatMap((f) =>
        startedSessions(f).map((s) => percentOf(s.total, f.maxPoints)),
      );

    return {
      live: liveFacts
        ? {
            ...summarize(liveFacts),
            endsAt: examTiming(liveFacts.exam).endsAt,
            events: liveFacts.sessions.reduce(
              (sum, s) => sum + s.signalEvents.length,
              0,
            ),
          }
        : null,
      upcoming: [
        ...scheduled,
        ...summaries.filter((e) => e.status === 'draft'),
      ].slice(0, UPCOMING_LIMIT),
      toReview: queue,
      stats: {
        activeAndScheduled: summaries.filter(
          (e) => e.status === 'live' || e.status === 'scheduled',
        ).length,
        nextStartsAt: scheduled[0]?.startsAt ?? null,
        toReview: queue.length,
        toReviewExams: new Set(queue.map((r) => r.examId)).size,
        average30d: average(recentPercents) ?? null,
        students: studentCount?.n ?? 0,
        groups: groupCount?.n ?? 0,
      },
      activity: activity(facts),
      checklist: {
        hasProblem: (problemCount?.n ?? 0) > 0,
        hasGroup: (groupCount?.n ?? 0) > 0,
        hasPublished: facts.some((f) => f.exam.publishedAt),
        hasSession: facts.some((f) => f.sessions.length > 0),
      },
    };
  }
}

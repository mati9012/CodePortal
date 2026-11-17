import type {
  ExamSettings,
  ExamStatus,
  ExamTiming,
  GradeThresholds,
} from '@codeportal/contracts';
import type { exams } from '../../db/schema.js';

export type ExamRow = typeof exams.$inferSelect;

export const MINUTE_MS = 60_000;
export const DEFAULT_DURATION_MIN = 45;
const DEFAULT_THRESHOLDS: GradeThresholds = [30, 50, 70, 85, 95];

const DEFAULT_SETTINGS: ExamSettings = {
  instructions: '',
  access: 'code',
  lateJoinMin: 10,
  attempts: 1,
  protection: 'standard',
  blockPaste: true,
  fullscreen: true,
  fullscreenExits: 3,
  shuffle: false,
  results: 'after_approval',
  scoring: 'best',
  thresholds: DEFAULT_THRESHOLDS,
};

export const settingsOf = (exam: ExamRow): ExamSettings => ({
  ...DEFAULT_SETTINGS,
  ...exam.settings,
});

const startOf = (exam: ExamRow) => exam.startsAt ?? exam.createdAt;

const durationOf = (exam: ExamRow) => exam.durationMin ?? DEFAULT_DURATION_MIN;

function plannedEnd(exam: ExamRow) {
  return (
    exam.endsAt ??
    new Date(startOf(exam).getTime() + durationOf(exam) * MINUTE_MS)
  );
}

export function examEnd(exam: ExamRow) {
  return exam.endedAt ?? plannedEnd(exam);
}

export function examStatus(exam: ExamRow, now = new Date()): ExamStatus {
  if (!exam.publishedAt) return 'draft';
  if (exam.resultsApprovedAt) return 'finished';
  if (now < startOf(exam)) return 'scheduled';
  if (now < examEnd(exam)) return 'live';
  return 'review';
}

export function examTiming(exam: ExamRow): ExamTiming {
  const startsAt = startOf(exam);
  const scheduledMin = Math.round(
    (plannedEnd(exam).getTime() - startsAt.getTime()) / MINUTE_MS,
  );
  return {
    startsAt: startsAt.toISOString(),
    endsAt: examEnd(exam).toISOString(),
    durationMin: durationOf(exam),
    extraMin: Math.max(0, scheduledMin - durationOf(exam)),
    endedAt: exam.endedAt?.toISOString() ?? null,
  };
}

export const hasStarted = (status: ExamStatus) =>
  status === 'live' || status === 'review' || status === 'finished';

export const isGraded = (status: ExamStatus) =>
  status === 'review' || status === 'finished';

export function gradeFor(percent: number, thresholds: GradeThresholds) {
  return 1 + thresholds.filter((t) => percent >= t).length;
}

export const percentOf = (points: number, max: number) =>
  max ? Math.round((points / max) * 100) : 0;

export const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
    : undefined;

// Model danych CodePortal — zob. docs/SPEC.md, sekcja „Model danych”.
// Klucze w TS są camelCase; kolumny w bazie snake_case (opcja `casing: 'snake_case'`).
import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const id = () => uuid().primaryKey().defaultRandom();
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const ts = () => timestamp({ withTimezone: true });

// ── Enumy ────────────────────────────────────────────────────────────────────
export const role = pgEnum('role', ['organizer', 'participant', 'admin']);
export const orgType = pgEnum('org_type', ['school', 'company']);
export const problemType = pgEnum('problem_type', ['io', 'unit']);
export const checkerType = pgEnum('checker_type', [
  'exact',
  'ignore_whitespace',
  'float_tolerance',
  'custom',
]);
export const examMode = pgEnum('exam_mode', ['test', 'contest']);
export const protectionLevel = pgEnum('protection_level', ['loose', 'standard', 'exam']);
export const resultsVisibility = pgEnum('results_visibility', [
  'immediate',
  'after_end',
  'after_approval',
]);
export const scoringRule = pgEnum('scoring_rule', ['best', 'last', 'icpc', 'ioi']);
export const accessType = pgEnum('access_type', ['link', 'password', 'list', 'sso']);
export const sessionStatus = pgEnum('session_status', [
  'pending',
  'active',
  'finished',
  'terminated',
]);
export const submissionStatus = pgEnum('submission_status', ['queued', 'running', 'done', 'error']);
export const verdict = pgEnum('verdict', ['OK', 'WA', 'TLE', 'MLE', 'RE', 'CE']);

// ── Tabele ───────────────────────────────────────────────────────────────────
export const organizations = pgTable('organizations', {
  id: id(),
  name: text().notNull(),
  type: orgType().notNull(),
  plan: text().notNull().default('free'),
  gradingScale: jsonb(),
  createdAt: createdAt(),
});

export const users = pgTable('users', {
  id: id(),
  email: text().notNull().unique(),
  name: text().notNull(),
  passwordHash: text(),
  role: role().notNull().default('organizer'),
  orgId: uuid().references(() => organizations.id),
  createdAt: createdAt(),
});

export const problems = pgTable('problems', {
  id: id(),
  ownerId: uuid()
    .notNull()
    .references(() => users.id),
  title: text().notNull(),
  statementMd: text().notNull(),
  languages: text().array().notNull().default([]),
  starterCode: jsonb(),
  timeLimitMs: integer().notNull().default(1000),
  memoryLimitMb: integer().notNull().default(256),
  type: problemType().notNull().default('io'),
  checkerType: checkerType().notNull().default('ignore_whitespace'),
  checkerCode: text(),
  variants: jsonb(),
  createdAt: createdAt(),
});

export const testCases = pgTable('test_cases', {
  id: id(),
  problemId: uuid()
    .notNull()
    .references(() => problems.id, { onDelete: 'cascade' }),
  groupNo: integer().notNull().default(0),
  input: text().notNull(),
  expectedOutput: text().notNull(),
  points: integer().notNull().default(1),
  isSample: boolean().notNull().default(false),
});

export const exams = pgTable('exams', {
  id: id(),
  ownerId: uuid()
    .notNull()
    .references(() => users.id),
  title: text().notNull(),
  mode: examMode().notNull().default('test'),
  slug: text().notNull().unique(),
  startsAt: ts(),
  endsAt: ts(),
  durationMin: integer(),
  attempts: integer().notNull().default(1),
  protectionLevel: protectionLevel().notNull().default('standard'),
  resultsVisibility: resultsVisibility().notNull().default('after_end'),
  scoringRule: scoringRule().notNull().default('best'),
  settings: jsonb(),
  createdAt: createdAt(),
});

export const examProblems = pgTable(
  'exam_problems',
  {
    examId: uuid()
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    problemId: uuid()
      .notNull()
      .references(() => problems.id),
    order: integer().notNull(),
    pointsOverride: integer(),
    poolTag: text(),
  },
  (t) => [primaryKey({ columns: [t.examId, t.problemId] })],
);

export const examAccess = pgTable('exam_access', {
  id: id(),
  examId: uuid()
    .notNull()
    .references(() => exams.id, { onDelete: 'cascade' }),
  type: accessType().notNull(),
  secretHash: text(),
  allowedEmails: text().array().notNull().default([]),
});

export const sessions = pgTable(
  'sessions',
  {
    id: id(),
    examId: uuid()
      .notNull()
      .references(() => exams.id),
    userId: uuid().references(() => users.id),
    guestName: text(),
    startedAt: ts(),
    deadlineAt: ts(),
    finishedAt: ts(),
    ip: text(),
    userAgent: text(),
    riskScore: integer(),
    status: sessionStatus().notNull().default('pending'),
  },
  (t) => [index().on(t.examId)],
);

export const codeSnapshots = pgTable(
  'code_snapshots',
  {
    id: id(),
    sessionId: uuid()
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    problemId: uuid().notNull(),
    language: text().notNull(),
    code: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.sessionId, t.problemId, t.createdAt)],
);

// editor_events: najwięcej zapisów w systemie. W bazie tabela ma być
// partycjonowana po dniu (PARTITION BY RANGE (ts)) — drizzle-kit tego nie generuje,
// więc po `db:generate` dopisz partycjonowanie ręcznie w pliku migracji
// (dlatego PK zawiera `ts`, a brak FK do sessions).
export const editorEvents = pgTable(
  'editor_events',
  {
    id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity(),
    sessionId: uuid().notNull(),
    ts: timestamp({ withTimezone: true }).notNull(),
    type: text().notNull(), // delta | paste_blocked | blur | fullscreen_exit | run | ...
    payload: jsonb(),
  },
  (t) => [primaryKey({ columns: [t.id, t.ts] }), index().on(t.sessionId, t.ts)],
);

export const submissions = pgTable(
  'submissions',
  {
    id: id(),
    sessionId: uuid()
      .notNull()
      .references(() => sessions.id),
    problemId: uuid()
      .notNull()
      .references(() => problems.id),
    language: text().notNull(),
    code: text().notNull(),
    status: submissionStatus().notNull().default('queued'),
    verdict: verdict(),
    score: real(),
    timeMs: integer(),
    memoryKb: integer(),
    submittedAt: createdAt(),
  },
  (t) => [index().on(t.sessionId, t.problemId)],
);

export const submissionResults = pgTable(
  'submission_results',
  {
    submissionId: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    testCaseId: uuid()
      .notNull()
      .references(() => testCases.id),
    verdict: verdict().notNull(),
    timeMs: integer(),
    memoryKb: integer(),
    outputExcerpt: text(),
  },
  (t) => [primaryKey({ columns: [t.submissionId, t.testCaseId] })],
);

export const reviews = pgTable('reviews', {
  id: id(),
  submissionId: uuid()
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  reviewerId: uuid()
    .notNull()
    .references(() => users.id),
  manualScore: real(),
  rubric: jsonb(),
  flaggedDishonest: boolean().notNull().default(false),
  comment: text(),
  createdAt: createdAt(),
});

export const similarityPairs = pgTable(
  'similarity_pairs',
  {
    id: id(),
    examId: uuid()
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    problemId: uuid()
      .notNull()
      .references(() => problems.id),
    submissionA: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    submissionB: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    score: real().notNull(),
    method: text().notNull(), // tokens | ast | ai_reference
  },
  (t) => [index().on(t.examId, t.problemId)],
);

// ── Relacje (dla db.query.*) ─────────────────────────────────────────────────
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  org: one(organizations, { fields: [users.orgId], references: [organizations.id] }),
  problems: many(problems),
  exams: many(exams),
}));

export const problemsRelations = relations(problems, ({ one, many }) => ({
  owner: one(users, { fields: [problems.ownerId], references: [users.id] }),
  testCases: many(testCases),
  examProblems: many(examProblems),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  problem: one(problems, { fields: [testCases.problemId], references: [problems.id] }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  owner: one(users, { fields: [exams.ownerId], references: [users.id] }),
  problems: many(examProblems),
  access: many(examAccess),
  sessions: many(sessions),
}));

export const examProblemsRelations = relations(examProblems, ({ one }) => ({
  exam: one(exams, { fields: [examProblems.examId], references: [exams.id] }),
  problem: one(problems, { fields: [examProblems.problemId], references: [problems.id] }),
}));

export const examAccessRelations = relations(examAccess, ({ one }) => ({
  exam: one(exams, { fields: [examAccess.examId], references: [exams.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  exam: one(exams, { fields: [sessions.examId], references: [exams.id] }),
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
  snapshots: many(codeSnapshots),
  submissions: many(submissions),
}));

export const codeSnapshotsRelations = relations(codeSnapshots, ({ one }) => ({
  session: one(sessions, { fields: [codeSnapshots.sessionId], references: [sessions.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  session: one(sessions, { fields: [submissions.sessionId], references: [sessions.id] }),
  problem: one(problems, { fields: [submissions.problemId], references: [problems.id] }),
  results: many(submissionResults),
  reviews: many(reviews),
}));

export const submissionResultsRelations = relations(submissionResults, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionResults.submissionId],
    references: [submissions.id],
  }),
  testCase: one(testCases, { fields: [submissionResults.testCaseId], references: [testCases.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  submission: one(submissions, { fields: [reviews.submissionId], references: [submissions.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id] }),
}));

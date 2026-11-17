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
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { ExamSettings, Language, ProblemVariant } from '@codeportal/contracts';

const id = () => uuid().primaryKey().defaultRandom();
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const ts = () => timestamp({ withTimezone: true });
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export type CodeFile = { path: string; content: string };
export type StarterCode = Record<string, CodeFile[]>;
export type EditorEventType = 'delta' | 'paste_blocked' | 'blur' | 'fullscreen_exit' | 'run';
export type SimilarityMethod = 'tokens' | 'ast' | 'ai_reference';
export type TeacherActionKind = 'message' | 'add_time' | 'readmit' | 'end_session' | 'end_exam';

export const role = pgEnum('role', ['organizer', 'participant', 'admin']);
export const orgType = pgEnum('org_type', ['school', 'company']);
export const problemType = pgEnum('problem_type', ['io', 'unit', 'web']);
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
export const groupKind = pgEnum('group_kind', ['class', 'group']);
export const reviewStatus = pgEnum('review_status', ['pending', 'approved', 'flagged']);

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
  emailVerified: boolean().notNull().default(false),
  name: text().notNull(),
  image: text(),
  role: role().notNull().default('organizer'),
  orgId: uuid().references(() => organizations.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const accounts = pgTable(
  'accounts',
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    password: text(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: ts(),
    refreshTokenExpiresAt: ts(),
    scope: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const verifications = pgTable(
  'verifications',
  {
    id: id(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.identifier)],
);

export const groups = pgTable(
  'groups',
  {
    id: id(),
    ownerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    kind: groupKind().notNull().default('class'),
    schoolYear: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.ownerId, t.schoolYear, t.name)],
);

export const groupStudents = pgTable(
  'group_students',
  {
    id: id(),
    groupId: uuid()
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text(),
    userId: uuid().references(() => users.id, { onDelete: 'set null' }),
    invitedAt: ts(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.groupId)],
);

export const problems = pgTable('problems', {
  id: id(),
  ownerId: uuid()
    .notNull()
    .references(() => users.id),
  title: text().notNull(),
  statementMd: text().notNull(),
  inputSpec: text().notNull().default(''),
  outputSpec: text().notNull().default(''),
  languages: jsonb().$type<Language[][]>().notNull().default([]),
  tags: text().array().notNull().default([]),
  difficulty: integer().notNull().default(1),
  points: integer().notNull().default(10),
  starterCode: jsonb().$type<StarterCode>(),
  timeLimitMs: integer().notNull().default(1000),
  memoryLimitMb: integer().notNull().default(256),
  type: problemType().notNull().default('io'),
  checkerType: checkerType().notNull().default('ignore_whitespace'),
  checkerCode: text(),
  referenceLanguage: text().$type<Language>(),
  referenceSolution: text().notNull().default(''),
  variants: jsonb().$type<ProblemVariant[]>().notNull().default([]),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const testCases = pgTable(
  'test_cases',
  {
    id: id(),
    problemId: uuid()
      .notNull()
      .references(() => problems.id, { onDelete: 'cascade' }),
    position: integer().notNull().default(0),
    name: text().notNull().default(''),
    groupName: text().notNull().default(''),
    input: text().notNull().default(''),
    expectedOutput: text().notNull().default(''),
    script: text(),
    points: integer().notNull().default(1),
    isSample: boolean().notNull().default(false),
    referenceMs: integer(),
  },
  (t) => [index().on(t.problemId, t.position)],
);

export const exams = pgTable('exams', {
  id: id(),
  ownerId: uuid()
    .notNull()
    .references(() => users.id),
  groupId: uuid().references(() => groups.id, { onDelete: 'set null' }),
  title: text().notNull(),
  mode: examMode().notNull().default('test'),
  slug: text().unique(),
  startsAt: ts(),
  endsAt: ts(),
  durationMin: integer(),
  attempts: integer().notNull().default(1),
  protectionLevel: protectionLevel().notNull().default('standard'),
  resultsVisibility: resultsVisibility().notNull().default('after_end'),
  scoringRule: scoringRule().notNull().default('best'),
  settings: jsonb().$type<ExamSettings>(),
  publishedAt: ts(),
  endedAt: ts(),
  resultsApprovedAt: ts(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
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
    studentId: uuid().references(() => groupStudents.id, { onDelete: 'set null' }),
    guestName: text(),
    startedAt: ts(),
    deadlineAt: ts(),
    finishedAt: ts(),
    lastSeenAt: ts(),
    waitingSince: ts(),
    ip: text(),
    userAgent: text(),
    riskScore: integer(),
    status: sessionStatus().notNull().default('pending'),
    reviewStatus: reviewStatus().notNull().default('pending'),
  },
  (t) => [index().on(t.examId)],
);

export const teacherActions = pgTable(
  'teacher_actions',
  {
    id: id(),
    examId: uuid()
      .notNull()
      .references(() => exams.id, { onDelete: 'cascade' }),
    sessionId: uuid().references(() => sessions.id, { onDelete: 'cascade' }),
    kind: text().$type<TeacherActionKind>().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.examId, t.createdAt)],
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
    files: jsonb().$type<CodeFile[]>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.sessionId, t.problemId, t.createdAt)],
);

export const editorEvents = pgTable(
  'editor_events',
  {
    id: bigint({ mode: 'number' }).generatedAlwaysAsIdentity(),
    sessionId: uuid().notNull(),
    ts: timestamp({ withTimezone: true }).notNull(),
    type: text().$type<EditorEventType>().notNull(),
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
    files: jsonb().$type<CodeFile[]>().notNull(),
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
  rubric: jsonb().$type<Record<string, boolean>>(),
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
    method: text().$type<SimilarityMethod>().notNull(),
  },
  (t) => [index().on(t.examId, t.problemId)],
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  org: one(organizations, { fields: [users.orgId], references: [organizations.id] }),
  authSessions: many(authSessions),
  accounts: many(accounts),
  problems: many(problems),
  exams: many(exams),
  groups: many(groups),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, { fields: [groups.ownerId], references: [users.id] }),
  students: many(groupStudents),
  exams: many(exams),
}));

export const groupStudentsRelations = relations(groupStudents, ({ one }) => ({
  group: one(groups, { fields: [groupStudents.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupStudents.userId], references: [users.id] }),
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
  group: one(groups, { fields: [exams.groupId], references: [groups.id] }),
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
  student: one(groupStudents, { fields: [sessions.studentId], references: [groupStudents.id] }),
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

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, { fields: [authSessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

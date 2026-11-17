import type {
  AddTimeInput,
  ExamDraft,
  GroupInput,
  ProblemInput,
  ReviewInput,
  StudentInput,
} from '@codeportal/contracts';
import { z } from 'zod';

const NAME_MAX = 120;
const TEXT_MAX = 20_000;
const CODE_MAX = 200_000;
const MESSAGE_MAX = 280;
const MAX_IMPORT = 500;
const MAX_EXTRA_MIN = 240;
const MAX_TESTS = 200;

const name = z.string().trim().min(1).max(NAME_MAX);
const language = z.enum([
  'html',
  'css',
  'javascript',
  'python',
  'java',
  'csharp',
  'cpp',
  'php',
]);

export const uuid = z.uuid();

export const groupInput = z.object({
  name,
  kind: z.enum(['class', 'group']),
  year: z.string().regex(/^\d{4}\/\d{2}$/),
}) satisfies z.ZodType<GroupInput>;

export const studentInput = z.object({
  firstName: name,
  lastName: name,
  email: z.email().optional(),
}) satisfies z.ZodType<StudentInput>;

export const studentImport = z.object({
  students: z.array(studentInput).min(1).max(MAX_IMPORT),
});

export const problemInput = z.object({
  title: z.string().trim().min(1).max(NAME_MAX),
  type: z.enum(['io', 'unit', 'web']),
  languages: z.array(z.array(language).min(1)).min(1),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  points: z.int().min(1).max(1000),
  statement: z.string().trim().min(1).max(TEXT_MAX),
  inputSpec: z.string().max(TEXT_MAX),
  outputSpec: z.string().max(TEXT_MAX),
  tests: z
    .array(
      z.object({
        id: z.string().max(64),
        name: z.string().max(NAME_MAX),
        group: z.string().max(NAME_MAX),
        visible: z.boolean(),
        input: z.string().max(CODE_MAX),
        output: z.string().max(CODE_MAX),
        weight: z.int().min(0).max(100),
        referenceMs: z.int().min(0).optional(),
      }),
    )
    .max(MAX_TESTS),
  timeLimitMs: z.int().min(100).max(20_000),
  memoryLimitMb: z.int().min(16).max(2048),
  checker: z.enum(['exact', 'tokens', 'float']),
  referenceLanguage: language,
  referenceSolution: z.string().max(CODE_MAX),
  variants: z
    .array(
      z.object({
        id: z.string().max(64),
        name: z.string().max(NAME_MAX),
        note: z.string().max(500),
      }),
    )
    .max(20),
}) satisfies z.ZodType<ProblemInput>;

const percent = z.int().min(0).max(100);

export const examDraft = z.object({
  title: z.string().max(NAME_MAX),
  mode: z.enum(['test', 'contest']),
  groupId: z.union([uuid, z.literal('')]),
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.int().min(0).max(600),
  instructions: z.string().max(TEXT_MAX),
  items: z
    .array(
      z.discriminatedUnion('kind', [
        z.object({
          key: z.string(),
          kind: z.literal('problem'),
          id: uuid,
          points: z.int().min(0).max(1000),
        }),
        z.object({
          key: z.string(),
          kind: z.literal('pool'),
          ids: z.array(uuid).min(2),
          points: z.int().min(0).max(1000),
        }),
      ]),
    )
    .max(50),
  access: z.enum(['code', 'list', 'password', 'sso']),
  password: z.string().max(NAME_MAX),
  lateJoinMin: z.int().min(0).max(600),
  attempts: z.int().min(1).max(100),
  protection: z.enum(['loose', 'standard', 'exam']),
  blockPaste: z.boolean(),
  fullscreen: z.boolean(),
  fullscreenExits: z.int().min(0).max(100),
  shuffle: z.boolean(),
  results: z.enum(['immediate', 'after_end', 'after_approval']),
  scoring: z.enum(['best', 'last']),
  thresholds: z.tuple([percent, percent, percent, percent, percent]),
}) satisfies z.ZodType<ExamDraft>;

export const addTimeInput = z.object({
  sessionIds: z.union([z.array(uuid).min(1), z.literal('all')]),
  minutes: z.int().min(1).max(MAX_EXTRA_MIN),
  reason: z.string().trim().max(200),
}) satisfies z.ZodType<AddTimeInput>;

export const messageInput = z.object({
  text: z.string().trim().min(1).max(MESSAGE_MAX),
});

export const reviewInput = z.object({
  problemNumber: z.int().min(1),
  score: z.number().min(0),
  rubric: z.record(z.string().max(NAME_MAX), z.boolean()),
  comment: z.string().trim().max(500),
}) satisfies z.ZodType<ReviewInput>;

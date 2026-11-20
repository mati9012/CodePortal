import type {
  ExamEventInput,
  JoinInput,
  SaveCodeInput,
} from '@codeportal/contracts';
import { z } from 'zod';
import { uuid } from '../panel/schemas.js';

const NAME_MAX = 120;
const CLASS_MAX = 20;
const CODE_MAX = 200_000;
const MAX_FILES = 10;
const MAX_EVENTS = 100;
const PAYLOAD_TEXT_MAX = 64;

export const joinCodeParam = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);

export const joinInput = z.object({
  name: z.string().trim().min(3).max(NAME_MAX),
  className: z.string().trim().max(CLASS_MAX).optional(),
  password: z.string().max(NAME_MAX).optional(),
}) satisfies z.ZodType<JoinInput>;

const codeFile = z.object({
  path: z.string().regex(/^[\w.-]{1,64}$/),
  content: z.string().max(CODE_MAX),
});

export const saveCodeInput = z.object({
  problemId: uuid,
  language: z.string().max(64),
  files: z.array(codeFile).min(1).max(MAX_FILES),
}) satisfies z.ZodType<SaveCodeInput>;

export const eventsInput = z.object({
  events: z
    .array(
      z.object({
        type: z.enum(['delta', 'paste_blocked', 'blur', 'fullscreen_exit']),
        at: z.iso.datetime(),
        payload: z.record(
          z.string().max(32),
          z.union([z.number(), z.string().max(PAYLOAD_TEXT_MAX)]),
        ),
      }) satisfies z.ZodType<ExamEventInput>,
    )
    .min(1)
    .max(MAX_EVENTS),
});

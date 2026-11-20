import type { Access, ExamMode, Language, ProblemType, Protection } from "./panel.js";

export type CodeFile = { path: string; content: string };

export type IntroStatus = "scheduled" | "live" | "closed";

export type ExamIntro = {
  code: string;
  title: string;
  mode: ExamMode;
  teacher: string;
  group: string | null;
  status: IntroStatus;
  startsAt: string;
  endsAt: string;
  joinUntil: string;
  durationMin: number;
  problems: number;
  maxPoints: number;
  languages: Language[];
  attempts: number;
  access: Access;
  protection: Protection;
  blockPaste: boolean;
  fullscreen: boolean;
  fullscreenExits: number;
  serverNow: string;
};

export type JoinInput = { name: string; className?: string; password?: string };

export type JoinResult = { token: string };

export type CodeDraft = { language: string; files: CodeFile[]; savedAt: string };

export type SubmissionState = "grading" | "graded" | "error";

export type StudentSubmission = {
  id: string;
  submittedAt: string;
  state: SubmissionState;
  points: number | null;
};

export type StudentProblem = {
  number: number;
  id: string;
  title: string;
  type: ProblemType;
  max: number;
  tags: string[];
  statement: string;
  inputSpec: string;
  outputSpec: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  tests: number;
  examples: { input: string; output: string }[];
  languages: Language[][];
  starter: Record<string, CodeFile[]>;
  draft: CodeDraft | null;
  submissions: StudentSubmission[];
};

export type TeacherNotice =
  | { id: string; at: string; kind: "message"; text: string }
  | { id: string; at: string; kind: "time"; minutes: number };

export type ProblemResult = { number: number; title: string; points: number; max: number };

export type StudentResult =
  | { visible: false; submitted: number; problems: number; workSec: number; receipt: string }
  | {
      visible: true;
      submitted: number;
      problems: number;
      workSec: number;
      receipt: string;
      points: number;
      max: number;
      percent: number;
      grade: number;
      grading: number;
      approved: boolean;
      breakdown: ProblemResult[];
    };

export type SessionPhase = "ready" | "active" | "finished";

export type FinishReason = "student" | "time" | "teacher";

export type StudentSession = {
  name: string;
  phase: SessionPhase;
  exam: ExamIntro;
  startedAt: string | null;
  deadlineAt: string | null;
  finishedAt: string | null;
  finishReason: FinishReason | null;
  waitingForDecision: boolean;
  fullscreenExitsUsed: number;
  notices: TeacherNotice[];
  problems: StudentProblem[];
  result: StudentResult | null;
};

export type SaveCodeInput = { problemId: string; language: string; files: CodeFile[] };

export type ExamEventType = "delta" | "paste_blocked" | "blur" | "fullscreen_exit";

export type ExamEventInput = { type: ExamEventType; at: string; payload: Record<string, number | string> };

export type EventsResult = { waitingForDecision: boolean; fullscreenExitsUsed: number };

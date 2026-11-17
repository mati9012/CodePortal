export type ExamStatus = "draft" | "scheduled" | "live" | "review" | "finished";
export type ExamMode = "test" | "contest";
export type Language = "html" | "css" | "javascript" | "python" | "java" | "csharp" | "cpp" | "php";
export type ProblemType = "io" | "unit" | "web";
export type Checker = "exact" | "tokens" | "float";
export type Difficulty = 1 | 2 | 3;
export type GroupKind = "class" | "group";
export type AccountState = "linked" | "invited" | "none";
export type ReviewStatus = "approved" | "flagged" | "pending";
export type ParticipantStatus = "online" | "offline" | "idle" | "finished" | "not_started";
export type SignalKind =
  | "paste"
  | "jump"
  | "fullscreen"
  | "similarity"
  | "idle"
  | "submit"
  | "finish"
  | "time"
  | "question";

export type Protection = "loose" | "standard" | "exam";
export type Access = "code" | "list" | "password" | "sso";
export type ResultsVisibility = "immediate" | "after_end" | "after_approval";
export type Scoring = "best" | "last";
export type GradeThresholds = [number, number, number, number, number];

export type ExamSummary = {
  id: string;
  title: string;
  groupId: string | null;
  group: string | null;
  mode: ExamMode;
  status: ExamStatus;
  startsAt: string;
  durationMin: number;
  problems: number;
  participants: { joined: number; total: number };
  average?: number;
  toReview?: number;
  flagged?: number;
  code?: string;
};

export type ProblemSummary = {
  id: string;
  title: string;
  type: ProblemType;
  languages: Language[][];
  tags: string[];
  difficulty: Difficulty;
  tests: number;
  points: number;
  usedIn: number;
  updatedAt: string;
};

export type TestCase = {
  id: string;
  name: string;
  group: string;
  visible: boolean;
  input: string;
  output: string;
  weight: number;
  referenceMs?: number;
};

export type ProblemVariant = { id: string; name: string; note: string };

export type ProblemInput = {
  title: string;
  type: ProblemType;
  languages: Language[][];
  tags: string[];
  difficulty: Difficulty;
  points: number;
  statement: string;
  inputSpec: string;
  outputSpec: string;
  tests: TestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
  checker: Checker;
  referenceLanguage: Language;
  referenceSolution: string;
  variants: ProblemVariant[];
};

export type ProblemDetail = Omit<ProblemInput, "title" | "type" | "languages" | "tags" | "difficulty" | "points"> & {
  problem: ProblemSummary;
};

export type GroupSummary = {
  id: string;
  name: string;
  kind: GroupKind;
  year: string;
  students: number;
  lastExam?: string;
  average?: number;
};

export type GroupInput = { name: string; kind: GroupKind; year: string };

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  account: AccountState;
  average: number | null;
  exams: number;
};

export type StudentInput = { firstName: string; lastName: string; email?: string };

export type GroupDetail = { group: GroupSummary; students: Student[]; exams: ExamSummary[] };

export type ImportResult = { imported: number; invited: number; skipped: number };

export type ExamItem =
  | { key: string; kind: "problem"; id: string; points: number }
  | { key: string; kind: "pool"; ids: string[]; points: number };

export type ExamSettings = {
  instructions: string;
  access: Access;
  lateJoinMin: number;
  attempts: number;
  protection: Protection;
  blockPaste: boolean;
  fullscreen: boolean;
  fullscreenExits: number;
  shuffle: boolean;
  results: ResultsVisibility;
  scoring: Scoring;
  thresholds: GradeThresholds;
};

export type ExamDraft = ExamSettings & {
  title: string;
  mode: ExamMode;
  groupId: string;
  date: string;
  time: string;
  duration: number;
  items: ExamItem[];
  password: string;
};

export type ExamProblem = {
  number: number;
  problemId: string;
  title: string;
  max: number;
  poolSize: number;
  passRate: number | null;
};

export type ExamTiming = {
  startsAt: string;
  endsAt: string;
  durationMin: number;
  extraMin: number;
  endedAt: string | null;
};

export type LiveParticipant = {
  id: string;
  sessionId: string | null;
  name: string;
  status: ParticipantStatus;
  scores: (number | null)[];
  activeProblem?: number;
  events: number;
  lastActivityAt: string | null;
  waitingForDecision: boolean;
};

export type LiveEvent = { id: string; at: string; student: string; kind: SignalKind; text: string };

export type ExamDetail = {
  exam: ExamSummary;
  problems: ExamProblem[];
  settings: ExamSettings;
  timing: ExamTiming;
  participants: LiveParticipant[];
  events: LiveEvent[];
  submissions: number;
};

export type AddTimeInput = { sessionIds: string[] | "all"; minutes: number; reason: string };

export type LiveCode = { problemNumber: number | null; language: string | null; code: string; savedAt: string | null };

export type ResultRow = {
  sessionId: string;
  name: string;
  scores: number[];
  risk: number;
  review: ReviewStatus;
};

export type ExamResults = {
  exam: ExamSummary;
  problems: ExamProblem[];
  rows: ResultRow[];
  thresholds: GradeThresholds;
  approved: boolean;
};

export type Signal = { kind: SignalKind; title: string; detail: string; weight: number };

export type SimilarSolution = { sessionId: string; student: string; problem: string; percent: number };

export type ProblemReview = {
  problemNumber: number;
  autoScore: number;
  max: number;
  score: number | null;
  rubric: Record<string, boolean>;
  comment: string;
};

export type ReplayMarker = { at: number; kind: SignalKind | "pause" };

export type ReplayFrame = { at: number; code: string };

export type Replay = {
  durationSec: number;
  markers: ReplayMarker[];
  frames: Record<number, ReplayFrame[]>;
};

export type StudentReport = {
  exam: ExamSummary;
  problems: ExamProblem[];
  thresholds: GradeThresholds;
  row: ResultRow;
  previousId: string | null;
  nextId: string | null;
  finishedAt: string | null;
  submissions: number;
  signals: Signal[];
  similar: SimilarSolution[];
  reviews: ProblemReview[];
  replay: Replay;
};

export type ReviewInput = {
  problemNumber: number;
  score: number;
  rubric: Record<string, boolean>;
  comment: string;
};

export type ReviewItem = {
  sessionId: string;
  student: string;
  examId: string;
  exam: string;
  group: string | null;
  score: number;
  max: number;
  risk: number;
  reason: string;
};

export type ActivityTone = "accent" | "warning" | "success" | "neutral";

export type ActivityItem = { id: string; at: string; text: string; tone: ActivityTone };

export type Dashboard = {
  live: (ExamSummary & { endsAt: string; events: number }) | null;
  upcoming: ExamSummary[];
  toReview: ReviewItem[];
  stats: {
    activeAndScheduled: number;
    nextStartsAt: string | null;
    toReview: number;
    toReviewExams: number;
    average30d: number | null;
    students: number;
    groups: number;
  };
  activity: ActivityItem[];
  checklist: { hasProblem: boolean; hasGroup: boolean; hasPublished: boolean; hasSession: boolean };
};

export type Created = { id: string };

export type Published = { code: string };

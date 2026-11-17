import type { ParticipantStatus } from "@/components/exam/score";
import { EXAMS, type Exam } from "./panel";

export type ExamProblem = { number: number; problemId: string; title: string; max: number; passRate: number };

export const examById = (id: string): Exam | undefined => EXAMS.find((e) => e.id === id);

const PROBLEM_SET: Omit<ExamProblem, "number">[] = [
  { problemId: "p2", title: "Suma cyfr liczby", max: 20, passRate: 88 },
  { problemId: "p1", title: "Najdłuższy rosnący fragment", max: 30, passRate: 54 },
  { problemId: "p5", title: "Wieże Hanoi – liczba ruchów", max: 25, passRate: 47 },
  { problemId: "p8", title: "Najkrótsza ścieżka w labiryncie", max: 25, passRate: 22 },
  { problemId: "p6", title: "Klasa Ułamek z testami", max: 20, passRate: 35 },
];

export function examProblems(exam: Exam): ExamProblem[] {
  return PROBLEM_SET.slice(0, exam.problems).map((p, i) => ({ ...p, number: i + 1 }));
}

export const hasResults = (exam: Exam) => exam.status === "live" || exam.status === "review" || exam.status === "finished";

export const examMaxPoints = (exam: Exam) => examProblems(exam).reduce((n, p) => n + p.max, 0);

export type SignalKind = "paste" | "jump" | "fullscreen" | "similarity" | "idle" | "submit" | "finish" | "time" | "question";

export type LiveParticipant = {
  id: string;
  name: string;
  status: ParticipantStatus;
  scores: (number | undefined)[];
  activeProblem?: number;
  events: number;
  lastActivity: string;
  waitingForDecision?: boolean;
};

export const LIVE_PARTICIPANTS: LiveParticipant[] = [
  { id: "s1", name: "Kacper Wiśniewski", status: "online", scores: [20, 30, 25], activeProblem: 4, events: 0, lastActivity: "przed chwilą" },
  { id: "s2", name: "Zofia Kamińska", status: "finished", scores: [20, 30, 25], events: 0, lastActivity: "10:51" },
  { id: "s3", name: "Jakub Lewandowski", status: "online", scores: [20, 21], activeProblem: 3, events: 3, lastActivity: "12 s temu" },
  { id: "s4", name: "Maja Zielińska", status: "online", scores: [20, 30], activeProblem: 3, events: 0, lastActivity: "przed chwilą" },
  { id: "s5", name: "Antoni Szymański", status: "idle", scores: [20], activeProblem: 2, events: 1, lastActivity: "4 min temu" },
  { id: "s6", name: "Lena Woźniak", status: "online", scores: [20, 15], activeProblem: 3, events: 0, lastActivity: "30 s temu" },
  { id: "s7", name: "Szymon Dąbrowski", status: "online", scores: [20, 30, 0], activeProblem: 3, events: 2, lastActivity: "przed chwilą" },
  { id: "s8", name: "Hanna Kozłowska", status: "online", scores: [14], activeProblem: 2, events: 0, lastActivity: "1 min temu" },
  { id: "s9", name: "Filip Jankowski", status: "idle", scores: [], activeProblem: 1, events: 1, lastActivity: "7 min temu", waitingForDecision: true },
  { id: "s10", name: "Julia Mazur", status: "online", scores: [20], activeProblem: 2, events: 2, lastActivity: "przed chwilą" },
  { id: "s11", name: "Wiktor Krawczyk", status: "not_started", scores: [], events: 0, lastActivity: "—" },
  { id: "s12", name: "Oliwia Piotrowska", status: "online", scores: [20, 27], activeProblem: 3, events: 0, lastActivity: "20 s temu" },
];

export type LiveEvent = { id: string; time: string; student: string; kind: SignalKind; text: string };

export const LIVE_EVENTS: LiveEvent[] = [
  { id: "ev1", time: "10:54", student: "Kacper Wiśniewski", kind: "submit", text: "Zgłoszenie Z3 · 25/25 pkt" },
  { id: "ev2", time: "10:53", student: "Jakub Lewandowski", kind: "fullscreen", text: "Wyjście z pełnego ekranu (3. raz)" },
  { id: "ev3", time: "10:53", student: "Julia Mazur", kind: "paste", text: "Próba wklejenia · 214 znaków" },
  { id: "ev4", time: "10:52", student: "Szymon Dąbrowski", kind: "jump", text: "Skok kodu: +40 linii w 3 s" },
  { id: "ev5", time: "10:51", student: "Zofia Kamińska", kind: "finish", text: "Zakończyła test · 75/75" },
  { id: "ev6", time: "10:47", student: "Filip Jankowski", kind: "idle", text: "Brak aktywności od 7 min" },
  { id: "ev7", time: "10:46", student: "Antoni Szymański", kind: "fullscreen", text: "Wyjście z pełnego ekranu" },
  { id: "ev8", time: "10:45", student: "Lena Woźniak", kind: "submit", text: "Zgłoszenie Z2 · 15/30 pkt" },
  { id: "ev9", time: "10:44", student: "Jakub Lewandowski", kind: "paste", text: "Próba wklejenia · 38 znaków" },
];

export type ReviewStatus = "approved" | "flagged" | "pending";

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  approved: "Zatwierdzony",
  flagged: "Oznaczony",
  pending: "Do przejrzenia",
};

export type ResultRow = { id: string; name: string; scores: number[]; risk: number; review: ReviewStatus };

const RESULT_ROWS: ResultRow[] = [
  { id: "s2", name: "Zofia Kamińska", scores: [20, 30, 18, 25], risk: 8, review: "approved" },
  { id: "s1", name: "Kacper Wiśniewski", scores: [20, 30, 25, 18], risk: 12, review: "approved" },
  { id: "s10", name: "Julia Mazur", scores: [18, 30, 25, 0], risk: 74, review: "flagged" },
  { id: "s4", name: "Maja Zielińska", scores: [20, 27, 8, 15], risk: 22, review: "approved" },
  { id: "s3", name: "Jakub Lewandowski", scores: [20, 21, 10, 10], risk: 68, review: "flagged" },
  { id: "s7", name: "Szymon Dąbrowski", scores: [20, 15, 0, 20], risk: 61, review: "pending" },
  { id: "s6", name: "Lena Woźniak", scores: [20, 15, 6, 12], risk: 18, review: "approved" },
  { id: "s5", name: "Antoni Szymański", scores: [14, 9, 0, 5], risk: 35, review: "pending" },
  { id: "s8", name: "Hanna Kozłowska", scores: [14, 6, 0, 0], risk: 9, review: "approved" },
  { id: "s9", name: "Filip Jankowski", scores: [10, 0, 0, 0], risk: 63, review: "flagged" },
];

export function examResults(exam: Exam): ResultRow[] {
  const problems = examProblems(exam);
  return RESULT_ROWS.map((r) => ({
    ...r,
    scores: problems.map((p, i) => Math.min(p.max, r.scores[i] ?? 0)),
  }));
}

export const GRADE_THRESHOLDS = [30, 50, 70, 85, 95] as const;

export const GRADE_NAME: Record<number, string> = {
  1: "niedostateczny",
  2: "dopuszczający",
  3: "dostateczny",
  4: "dobry",
  5: "bardzo dobry",
  6: "celujący",
};

export function gradeFor(percent: number) {
  return 1 + GRADE_THRESHOLDS.filter((t) => percent >= t).length;
}

export type Signal = { kind: SignalKind; title: string; detail: string; weight: number };

export const STUDENT_SIGNALS: Signal[] = [
  { kind: "paste", title: "Próby wklejenia · 2", detail: "38 i 214 znaków, obie zablokowane (10:44, 10:53)", weight: 22 },
  { kind: "jump", title: "Skok kodu w Z2", detail: "+40 linii w 3 s po długiej pauzie, bez wcześniejszych wersji", weight: 20 },
  { kind: "fullscreen", title: "Wyjścia z pełnego ekranu · 3", detail: "łącznie 2 min 40 s poza oknem testu", weight: 14 },
  { kind: "similarity", title: "Podobieństwo do innego rozwiązania", detail: "87% z rozwiązaniem J. Mazur (Z2)", weight: 9 },
  { kind: "question", title: "Pytanie kontrolne", detail: "odpowiedź częściowa: „sprawdza czy rośnie”", weight: 3 },
];

export function signalsForRisk(risk: number) {
  let budget = risk;
  return STUDENT_SIGNALS.filter((s) => {
    if (s.weight > budget) return false;
    budget -= s.weight;
    return true;
  });
}

export const SIMILAR_SOLUTIONS = [
  { studentId: "s10", student: "Julia Mazur", problem: "Z2", percent: 87, note: "ta sama struktura pętli, nazwy zmiennych" },
  { studentId: "s7", student: "Szymon Dąbrowski", problem: "Z2", percent: 54, note: "podobny warunek, inna kolejność" },
];

export const RUBRIC = [
  { label: "Poprawna idea algorytmu", checked: true },
  { label: "Złożoność O(n)", checked: true },
  { label: "Czytelny kod i nazwy", checked: false },
  { label: "Poprawna odpowiedź na pytanie kontrolne", checked: false },
];

export type ReplayMarker = { at: number; kind: SignalKind | "pause" };

export const REPLAY = {
  durationSec: 45 * 60,
  positionSec: 29 * 60 + 42,
  markers: [
    { at: 210, kind: "submit" },
    { at: 420, kind: "fullscreen" },
    { at: 780, kind: "paste" },
    { at: 1020, kind: "pause" },
    { at: 1080, kind: "fullscreen" },
    { at: 1330, kind: "submit" },
    { at: 1782, kind: "jump" },
    { at: 1890, kind: "paste" },
    { at: 2350, kind: "submit" },
  ] satisfies ReplayMarker[],
  highlight: { from: 7, to: 12 },
  code: `int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    int best = 1, cur = 1;
    for (int i = 1; i < n; i++) {
        if (a[i] > a[i - 1]) cur++;
        else cur = 1;
        best = max(best, cur);
    }
    cout << best << "\\n";
}`,
};

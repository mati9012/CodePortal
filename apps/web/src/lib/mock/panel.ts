export type ExamStatus = "draft" | "scheduled" | "live" | "review" | "finished";
export type ExamMode = "test" | "contest";

export type Exam = {
  id: string;
  title: string;
  group: string;
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

export const EXAMS: Exam[] = [
  {
    id: "e1",
    title: "Sprawdzian – pętle i tablice",
    group: "3B",
    mode: "test",
    status: "live",
    startsAt: "2026-11-16T10:40:00+01:00",
    durationMin: 45,
    problems: 3,
    participants: { joined: 24, total: 26 },
    code: "7K2-9QX",
  },
  {
    id: "e2",
    title: "Kartkówka – funkcje w Pythonie",
    group: "2A",
    mode: "test",
    status: "scheduled",
    startsAt: "2026-11-18T08:55:00+01:00",
    durationMin: 20,
    problems: 2,
    participants: { joined: 0, total: 28 },
    code: "M4P-2LD",
  },
  {
    id: "e3",
    title: "Szkolna Liga Algorytmiczna – runda 2",
    group: "Kółko algorytmiczne",
    mode: "contest",
    status: "scheduled",
    startsAt: "2026-11-21T15:00:00+01:00",
    durationMin: 120,
    problems: 5,
    participants: { joined: 0, total: 14 },
    code: "LGA-R02",
  },
  {
    id: "e4",
    title: "Strona wizytówka – HTML + CSS",
    group: "1C",
    mode: "test",
    status: "review",
    startsAt: "2026-11-13T11:45:00+01:00",
    durationMin: 45,
    problems: 1,
    participants: { joined: 27, total: 27 },
    average: 74,
    toReview: 9,
    flagged: 2,
  },
  {
    id: "e5",
    title: "Sprawdzian – instrukcje warunkowe",
    group: "3B",
    mode: "test",
    status: "review",
    startsAt: "2026-11-12T10:40:00+01:00",
    durationMin: 45,
    problems: 3,
    participants: { joined: 25, total: 26 },
    average: 61,
    toReview: 4,
    flagged: 1,
  },
  {
    id: "e6",
    title: "Formularz kontaktowy – HTML + CSS + PHP",
    group: "4A",
    mode: "test",
    status: "finished",
    startsAt: "2026-11-06T12:35:00+01:00",
    durationMin: 90,
    problems: 1,
    participants: { joined: 22, total: 23 },
    average: 68,
  },
  {
    id: "e7",
    title: "Szkolna Liga Algorytmiczna – runda 1",
    group: "Kółko algorytmiczne",
    mode: "contest",
    status: "finished",
    startsAt: "2026-10-24T15:00:00+02:00",
    durationMin: 120,
    problems: 5,
    participants: { joined: 13, total: 14 },
    average: 47,
  },
  {
    id: "e8",
    title: "Rekurencja – zadania powtórkowe",
    group: "3B",
    mode: "test",
    status: "draft",
    startsAt: "2026-11-15T19:12:00+01:00",
    durationMin: 45,
    problems: 2,
    participants: { joined: 0, total: 26 },
  },
];

export const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  live: "Trwa",
  scheduled: "Zaplanowany",
  review: "Do sprawdzenia",
  finished: "Zakończony",
  draft: "Szkic",
};

export type Language = "html" | "css" | "javascript" | "python" | "java" | "csharp" | "cpp" | "php";

export const LANGUAGE_LABEL: Record<Language, string> = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
  php: "PHP",
};

export type Problem = {
  id: string;
  title: string;
  type: "io" | "unit" | "web";
  languages: Language[][];
  tags: string[];
  difficulty: 1 | 2 | 3;
  tests: number;
  points: number;
  usedIn: number;
  updatedAt: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "p1",
    title: "Najdłuższy rosnący fragment",
    type: "io",
    languages: [["cpp"], ["python"], ["java"]],
    tags: ["pętle", "tablice"],
    difficulty: 2,
    tests: 10,
    points: 30,
    usedIn: 3,
    updatedAt: "2026-11-14T18:20:00+01:00",
  },
  {
    id: "p2",
    title: "Suma cyfr liczby",
    type: "io",
    languages: [["python"], ["cpp"], ["csharp"]],
    tags: ["pętle", "na rozgrzewkę"],
    difficulty: 1,
    tests: 6,
    points: 10,
    usedIn: 5,
    updatedAt: "2026-11-02T09:00:00+01:00",
  },
  {
    id: "p3",
    title: "Strona wizytówka",
    type: "web",
    languages: [["html", "css"]],
    tags: ["layout", "flexbox"],
    difficulty: 1,
    tests: 0,
    points: 20,
    usedIn: 1,
    updatedAt: "2026-11-10T20:45:00+01:00",
  },
  {
    id: "p4",
    title: "Formularz kontaktowy z walidacją",
    type: "web",
    languages: [["html", "css", "php"]],
    tags: ["formularze", "PHP"],
    difficulty: 2,
    tests: 4,
    points: 40,
    usedIn: 1,
    updatedAt: "2026-11-05T16:30:00+01:00",
  },
  {
    id: "p5",
    title: "Wieże Hanoi – liczba ruchów",
    type: "io",
    languages: [["cpp"], ["python"]],
    tags: ["rekurencja"],
    difficulty: 2,
    tests: 8,
    points: 20,
    usedIn: 0,
    updatedAt: "2026-11-15T19:10:00+01:00",
  },
  {
    id: "p6",
    title: "Klasa Ułamek z testami",
    type: "unit",
    languages: [["java"], ["csharp"]],
    tags: ["obiektowość"],
    difficulty: 3,
    tests: 14,
    points: 40,
    usedIn: 0,
    updatedAt: "2026-10-30T12:00:00+01:00",
  },
  {
    id: "p7",
    title: "Lista zakupów w JavaScript",
    type: "web",
    languages: [["html", "css", "javascript"]],
    tags: ["DOM", "zdarzenia"],
    difficulty: 2,
    tests: 5,
    points: 30,
    usedIn: 2,
    updatedAt: "2026-10-28T10:15:00+01:00",
  },
  {
    id: "p8",
    title: "Najkrótsza ścieżka w labiryncie",
    type: "io",
    languages: [["cpp"], ["python"], ["java"]],
    tags: ["grafy", "BFS", "konkurs"],
    difficulty: 3,
    tests: 20,
    points: 100,
    usedIn: 1,
    updatedAt: "2026-10-20T21:40:00+02:00",
  },
];

export const PROBLEM_TYPE_LABEL: Record<Problem["type"], string> = {
  io: "Wejście / wyjście",
  unit: "Testy jednostkowe",
  web: "Strona WWW",
};

export type Group = {
  id: string;
  name: string;
  kind: "class" | "group";
  students: number;
  year: string;
  lastExam?: string;
  average?: number;
};

export const GROUPS: Group[] = [
  { id: "g1", name: "3B", kind: "class", students: 26, year: "2026/27", lastExam: "Sprawdzian – pętle i tablice", average: 63 },
  { id: "g2", name: "2A", kind: "class", students: 28, year: "2026/27", lastExam: "Kartkówka – zmienne", average: 71 },
  { id: "g3", name: "1C", kind: "class", students: 27, year: "2026/27", lastExam: "Strona wizytówka – HTML + CSS", average: 74 },
  { id: "g4", name: "4A", kind: "class", students: 23, year: "2026/27", lastExam: "Formularz kontaktowy", average: 68 },
  { id: "g5", name: "Kółko algorytmiczne", kind: "group", students: 14, year: "2026/27", lastExam: "Liga – runda 1", average: 47 },
];

export type ReviewItem = {
  studentId: string;
  student: string;
  examId: string;
  exam: string;
  group: string;
  score: number;
  max: number;
  risk: number;
  reason: string;
};

export const TO_REVIEW: ReviewItem[] = [
  { studentId: "s10", student: "Julia Mazur", examId: "e5", exam: "Instrukcje warunkowe", group: "3B", score: 73, max: 75, risk: 74, reason: "Próba wklejenia 214 znaków" },
  { studentId: "s3", student: "Jakub Lewandowski", examId: "e5", exam: "Instrukcje warunkowe", group: "3B", score: 51, max: 75, risk: 68, reason: "Skok kodu +40 linii w 3 s" },
  { studentId: "s7", student: "Szymon Dąbrowski", examId: "e4", exam: "Strona wizytówka", group: "1C", score: 20, max: 20, risk: 61, reason: "3 wyjścia z pełnego ekranu" },
  { studentId: "s5", student: "Antoni Szymański", examId: "e4", exam: "Strona wizytówka", group: "1C", score: 14, max: 20, risk: 35, reason: "Ocena ręczna: wygląd strony" },
];

export const ACTIVITY = [
  { when: "10:52", text: "Julia N. zgłosiła zadanie 2 w „Sprawdzian – pętle i tablice”", tone: "accent" as const },
  { when: "10:46", text: "Kacper W. wyszedł z pełnego ekranu (4 s)", tone: "warning" as const },
  { when: "10:41", text: "24 z 26 uczniów 3B dołączyło do testu", tone: "success" as const },
  { when: "wczoraj", text: "Zapisano szkic „Rekurencja – zadania powtórkowe”", tone: "neutral" as const },
];

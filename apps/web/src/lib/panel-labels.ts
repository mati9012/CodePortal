import type {
  Access,
  AccountState,
  Checker,
  ExamStatus,
  GradeThresholds,
  Language,
  ProblemType,
  Protection,
  ResultsVisibility,
  ReviewStatus,
} from "@codeportal/contracts";

export const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  live: "Trwa",
  scheduled: "Zaplanowany",
  review: "Do sprawdzenia",
  finished: "Zakończony",
  draft: "Szkic",
};

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

export const PROBLEM_TYPE_LABEL: Record<ProblemType, string> = {
  io: "Wejście / wyjście",
  unit: "Testy jednostkowe",
  web: "Strona WWW",
};

export const CHECKER_LABEL: Record<Checker, string> = {
  exact: "Dokładne porównanie",
  tokens: "Porównanie słów (ignoruje białe znaki)",
  float: "Liczby z tolerancją 10⁻⁶",
};

export const ACCOUNT_LABEL: Record<AccountState, string> = {
  linked: "powiązane",
  invited: "zaproszony",
  none: "brak",
};

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  approved: "Zatwierdzony",
  flagged: "Oznaczony",
  pending: "Do przejrzenia",
};

export const GRADE_NAME: Record<number, string> = {
  1: "niedostateczny",
  2: "dopuszczający",
  3: "dostateczny",
  4: "dobry",
  5: "bardzo dobry",
  6: "celujący",
};

export const RUBRIC_CRITERIA = [
  "Poprawna idea algorytmu",
  "Właściwa złożoność",
  "Czytelny kod i nazwy",
  "Poprawna odpowiedź na pytanie kontrolne",
];

export function gradeFor(percent: number, thresholds: GradeThresholds) {
  return 1 + thresholds.filter((t) => percent >= t).length;
}

export const groupLabel = (group: string | null) => group ?? "Każdy z kodem";

export const ACCESS_LABEL: Record<Access, string> = {
  code: "Kod lub link",
  list: "Lista uczniów klasy",
  password: "Link + hasło",
  sso: "Konto szkolne",
};

export const PROTECTION_LABEL: Record<Protection, string> = {
  loose: "Luźny",
  standard: "Standard",
  exam: "Egzamin",
};

export const RESULTS_VISIBILITY_LABEL: Record<ResultsVisibility, string> = {
  immediate: "Od razu po zgłoszeniu",
  after_end: "Po zakończeniu testu",
  after_approval: "Po zatwierdzeniu przez nauczyciela",
};

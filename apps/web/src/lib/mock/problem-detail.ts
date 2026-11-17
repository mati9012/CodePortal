import { PROBLEMS, type Language, type Problem } from "./panel";

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

export type Checker = "exact" | "tokens" | "float";

export type ProblemDetail = {
  problem: Problem;
  statement: string;
  inputSpec: string;
  outputSpec: string;
  tests: TestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
  checker: Checker;
  referenceLanguage: Language;
  referenceSolution: string;
  variants: { id: string; name: string; note: string }[];
};

export const CHECKER_LABEL: Record<Checker, string> = {
  exact: "Dokładne porównanie",
  tokens: "Porównanie słów (ignoruje białe znaki)",
  float: "Liczby z tolerancją 10⁻⁶",
};

const LIS_TESTS: TestCase[] = [
  { id: "t1", name: "Test 1", group: "przykłady", visible: true, input: "8\n3 1 4 5 2 6 7 8", output: "4", weight: 5, referenceMs: 2 },
  { id: "t2", name: "Test 2", group: "przykłady", visible: true, input: "5\n5 4 3 2 1", output: "1", weight: 5, referenceMs: 2 },
  { id: "t3", name: "Test 3", group: "małe", visible: false, input: "1\n7", output: "1", weight: 10, referenceMs: 2 },
  { id: "t4", name: "Test 4", group: "małe", visible: false, input: "6\n1 2 3 3 4 5", output: "3", weight: 10, referenceMs: 2 },
  { id: "t5", name: "Test 5", group: "małe", visible: false, input: "10\n-5 -4 -3 0 2 1 3 4 5 6", output: "5", weight: 10, referenceMs: 3 },
  { id: "t6", name: "Test 6", group: "średnie", visible: false, input: "1000 losowych", output: "17", weight: 10, referenceMs: 4 },
  { id: "t7", name: "Test 7", group: "średnie", visible: false, input: "10⁴ rosnących", output: "10000", weight: 10, referenceMs: 6 },
  { id: "t8", name: "Test 8", group: "duże", visible: false, input: "10⁶ losowych", output: "21", weight: 15, referenceMs: 38 },
  { id: "t9", name: "Test 9", group: "duże", visible: false, input: "10⁶ stałych", output: "1", weight: 10, referenceMs: 35 },
  { id: "t10", name: "Test 10", group: "duże", visible: false, input: "10⁶ rosnących", output: "1000000", weight: 15, referenceMs: 41 },
];

const LIS_SOLUTION = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;

    int best = 1, current = 1;
    for (int i = 1; i < n; i++) {
        current = a[i] > a[i - 1] ? current + 1 : 1;
        best = max(best, current);
    }
    cout << best << "\\n";
}`;

function generatedTests(count: number): TestCase[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Test ${i + 1}`,
    group: i < 2 ? "przykłady" : "podstawowe",
    visible: i < 2,
    input: i < 2 ? `przykład ${i + 1}` : `zestaw ${i - 1}`,
    output: "—",
    weight: Math.round(100 / count),
    referenceMs: 2 + i,
  }));
}

export function problemDetail(id: string): ProblemDetail | undefined {
  const problem = PROBLEMS.find((p) => p.id === id);
  if (!problem) return undefined;
  const isLis = problem.id === "p1";
  return {
    problem,
    statement: isLis
      ? "Dany jest ciąg n liczb całkowitych. Znajdź długość najdłuższego fragmentu, w którym każda kolejna liczba jest większa od poprzedniej."
      : `Treść zadania „${problem.title}”.`,
    inputSpec: isLis
      ? "W pierwszym wierszu liczba n (1 ≤ n ≤ 10⁶). W drugim n liczb całkowitych z przedziału [−10⁹, 10⁹]."
      : "Opis danych wejściowych.",
    outputSpec: isLis ? "Jedna liczba – długość najdłuższego rosnącego fragmentu." : "Opis oczekiwanego wyniku.",
    tests: isLis ? LIS_TESTS : generatedTests(problem.tests),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    checker: "tokens",
    referenceLanguage: problem.languages[0]![0]!,
    referenceSolution: isLis ? LIS_SOLUTION : "",
    variants: isLis
      ? [
          { id: "v1", name: "Wariant A – rosnący fragment", note: "oryginalna treść" },
          { id: "v2", name: "Wariant B – malejący fragment", note: "zmieniony warunek, te same limity" },
        ]
      : [],
  };
}

export function emptyProblemDetail(): ProblemDetail {
  return {
    problem: {
      id: "nowe",
      title: "",
      type: "io",
      languages: [["python"], ["cpp"]],
      tags: [],
      difficulty: 1,
      tests: 0,
      points: 10,
      usedIn: 0,
      updatedAt: "",
    },
    statement: "",
    inputSpec: "",
    outputSpec: "",
    tests: [],
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    checker: "tokens",
    referenceLanguage: "python",
    referenceSolution: "",
    variants: [],
  };
}

import type { ProblemDetail } from "@codeportal/contracts";

export function emptyProblemDetail(): ProblemDetail {
  return {
    problem: {
      id: "",
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

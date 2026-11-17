import type {
  Checker,
  Difficulty,
  ProblemDetail,
  ProblemInput,
  ProblemSummary,
  TestCase,
} from '@codeportal/contracts';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  notInArray,
} from 'drizzle-orm';
import { FOREIGN_KEY_VIOLATION, postgresCode } from '../../db/errors.js';
import type { Db } from '../../db/index.js';
import { examProblems, problems, testCases } from '../../db/schema.js';

type ProblemRow = typeof problems.$inferSelect;
type TestRow = typeof testCases.$inferSelect;
type CheckerType = ProblemRow['checkerType'];

const CHECKER_TO_DB: Record<Checker, CheckerType> = {
  exact: 'exact',
  tokens: 'ignore_whitespace',
  float: 'float_tolerance',
};

const CHECKER_FROM_DB: Record<CheckerType, Checker> = {
  exact: 'exact',
  ignore_whitespace: 'tokens',
  float_tolerance: 'float',
  custom: 'tokens',
};

function toSummary(
  row: ProblemRow,
  tests: number,
  usedIn: number,
): ProblemSummary {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    languages: row.languages,
    tags: row.tags,
    difficulty: row.difficulty as Difficulty,
    tests,
    points: row.points,
    usedIn,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toTestCase(row: TestRow): TestCase {
  return {
    id: row.id,
    name: row.name,
    group: row.groupName,
    visible: row.isSample,
    input: row.input,
    output: row.expectedOutput,
    weight: row.points,
    ...(row.referenceMs !== null && { referenceMs: row.referenceMs }),
  };
}

function problemValues(input: ProblemInput) {
  return {
    title: input.title,
    type: input.type,
    languages: input.languages,
    tags: input.tags,
    difficulty: input.difficulty,
    points: input.points,
    statementMd: input.statement,
    inputSpec: input.inputSpec,
    outputSpec: input.outputSpec,
    timeLimitMs: input.timeLimitMs,
    memoryLimitMb: input.memoryLimitMb,
    checkerType: CHECKER_TO_DB[input.checker],
    referenceLanguage: input.referenceLanguage,
    referenceSolution: input.referenceSolution,
    variants: input.variants,
  };
}

function testValues(problemId: string, test: TestCase, position: number) {
  return {
    problemId,
    position,
    name: test.name,
    groupName: test.group,
    isSample: test.visible,
    input: test.input,
    expectedOutput: test.output,
    points: test.weight,
    referenceMs: test.referenceMs ?? null,
  };
}

@Injectable()
export class ProblemsService {
  constructor(@InjectDrizzle() private readonly db: Db) {}

  async list(ownerId: string): Promise<ProblemSummary[]> {
    const rows = await this.db
      .select()
      .from(problems)
      .where(eq(problems.ownerId, ownerId))
      .orderBy(desc(problems.updatedAt));
    if (rows.length === 0) return [];
    const ids = rows.map((p) => p.id);
    const [testCounts, usage] = await Promise.all([
      this.db
        .select({ problemId: testCases.problemId, tests: count() })
        .from(testCases)
        .where(inArray(testCases.problemId, ids))
        .groupBy(testCases.problemId),
      this.db
        .select({
          problemId: examProblems.problemId,
          exams: countDistinct(examProblems.examId),
        })
        .from(examProblems)
        .where(inArray(examProblems.problemId, ids))
        .groupBy(examProblems.problemId),
    ]);
    const testsOf = new Map(testCounts.map((t) => [t.problemId, t.tests]));
    const usedIn = new Map(usage.map((u) => [u.problemId, u.exams]));
    return rows.map((p) =>
      toSummary(p, testsOf.get(p.id) ?? 0, usedIn.get(p.id) ?? 0),
    );
  }

  async detail(ownerId: string, problemId: string): Promise<ProblemDetail> {
    const row = await this.owned(ownerId, problemId);
    const [tests, [usage]] = await Promise.all([
      this.db
        .select()
        .from(testCases)
        .where(eq(testCases.problemId, problemId))
        .orderBy(asc(testCases.position)),
      this.db
        .select({ exams: countDistinct(examProblems.examId) })
        .from(examProblems)
        .where(eq(examProblems.problemId, problemId)),
    ]);
    return {
      problem: toSummary(row, tests.length, usage?.exams ?? 0),
      statement: row.statementMd,
      inputSpec: row.inputSpec,
      outputSpec: row.outputSpec,
      tests: tests.map(toTestCase),
      timeLimitMs: row.timeLimitMs,
      memoryLimitMb: row.memoryLimitMb,
      checker: CHECKER_FROM_DB[row.checkerType],
      referenceLanguage:
        row.referenceLanguage ?? row.languages[0]?.[0] ?? 'python',
      referenceSolution: row.referenceSolution,
      variants: row.variants,
    };
  }

  async create(ownerId: string, input: ProblemInput): Promise<ProblemDetail> {
    const id = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(problems)
        .values({ ownerId, ...problemValues(input) })
        .returning({ id: problems.id });
      if (input.tests.length)
        await tx
          .insert(testCases)
          .values(input.tests.map((t, i) => testValues(row!.id, t, i)));
      return row!.id;
    });
    return this.detail(ownerId, id);
  }

  async update(
    ownerId: string,
    problemId: string,
    input: ProblemInput,
  ): Promise<ProblemDetail> {
    await this.owned(ownerId, problemId);
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .update(problems)
          .set(problemValues(input))
          .where(eq(problems.id, problemId));
        const existing = new Set(
          (
            await tx
              .select({ id: testCases.id })
              .from(testCases)
              .where(eq(testCases.problemId, problemId))
          ).map((t) => t.id),
        );
        const kept = input.tests
          .filter((t) => existing.has(t.id))
          .map((t) => t.id);
        await tx
          .delete(testCases)
          .where(
            and(
              eq(testCases.problemId, problemId),
              kept.length ? notInArray(testCases.id, kept) : undefined,
            ),
          );
        for (const [position, test] of input.tests.entries()) {
          const values = testValues(problemId, test, position);
          if (existing.has(test.id))
            await tx
              .update(testCases)
              .set(values)
              .where(eq(testCases.id, test.id));
          else await tx.insert(testCases).values(values);
        }
      });
    } catch (err) {
      if (postgresCode(err) === FOREIGN_KEY_VIOLATION)
        throw new ConflictException(
          'Nie można usunąć testu, który ma już wyniki uczniów.',
        );
      throw err;
    }
    return this.detail(ownerId, problemId);
  }

  async owned(ownerId: string, problemId: string) {
    const [row] = await this.db
      .select()
      .from(problems)
      .where(and(eq(problems.id, problemId), eq(problems.ownerId, ownerId)));
    if (!row) throw new NotFoundException('Nie ma takiego zadania.');
    return row;
  }
}

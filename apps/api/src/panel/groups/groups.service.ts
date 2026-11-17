import type {
  AccountState,
  GroupDetail,
  GroupInput,
  GroupSummary,
  ImportResult,
  Student,
  StudentInput,
} from '@codeportal/contracts';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import { sendMail } from '../../auth/mailer.js';
import { postgresCode, UNIQUE_VIOLATION } from '../../db/errors.js';
import type { Db } from '../../db/index.js';
import { groupStudents, groups } from '../../db/schema.js';
import { emails } from '../../emails/index.js';
import {
  ExamFactsService,
  startedSessions,
  summarize,
  type ExamFacts,
} from '../exams/exam-facts.service.js';
import { average, isGraded, percentOf } from '../exams/exam-rules.js';

type GroupRow = typeof groups.$inferSelect;
type StudentRow = typeof groupStudents.$inferSelect;
type Teacher = { id: string; name: string };

const studentKey = (s: { firstName: string; lastName: string }) =>
  `${s.lastName} ${s.firstName}`.trim().toLowerCase();

const accountOf = (s: StudentRow): AccountState =>
  s.userId ? 'linked' : s.invitedAt ? 'invited' : 'none';

function studentResults(facts: ExamFacts[]) {
  const percents = new Map<string, number[]>();
  for (const f of facts.filter((x) => isGraded(x.status))) {
    for (const s of startedSessions(f)) {
      if (!s.row.studentId) continue;
      percents.set(s.row.studentId, [
        ...(percents.get(s.row.studentId) ?? []),
        percentOf(s.total, f.maxPoints),
      ]);
    }
  }
  return percents;
}

function toStudent(row: StudentRow, results: Map<string, number[]>): Student {
  const own = results.get(row.id) ?? [];
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    account: accountOf(row),
    average: average(own) ?? null,
    exams: own.length,
  };
}

function toSummary(
  group: GroupRow,
  students: number,
  facts: ExamFacts[],
): GroupSummary {
  const own = facts.filter((f) => f.exam.groupId === group.id);
  const graded = own.map(summarize).filter((e) => e.average !== undefined);
  const latest = own.filter(
    (f) => f.status !== 'draft' && f.status !== 'scheduled',
  )[0];
  return {
    id: group.id,
    name: group.name,
    kind: group.kind,
    year: group.schoolYear,
    students,
    ...(latest && { lastExam: latest.exam.title }),
    ...(graded.length && { average: average(graded.map((e) => e.average!)) }),
  };
}

@Injectable()
export class GroupsService {
  private readonly log = new Logger(GroupsService.name);

  constructor(
    @InjectDrizzle() private readonly db: Db,
    private readonly examFacts: ExamFactsService,
  ) {}

  async list(ownerId: string): Promise<GroupSummary[]> {
    const [rows, counts, facts] = await Promise.all([
      this.db
        .select()
        .from(groups)
        .where(eq(groups.ownerId, ownerId))
        .orderBy(asc(groups.name)),
      this.db
        .select({ groupId: groupStudents.groupId, students: count() })
        .from(groupStudents)
        .innerJoin(groups, eq(groups.id, groupStudents.groupId))
        .where(eq(groups.ownerId, ownerId))
        .groupBy(groupStudents.groupId),
      this.examFacts.load(ownerId),
    ]);
    const studentsIn = new Map(counts.map((c) => [c.groupId, c.students]));
    return rows.map((g) => toSummary(g, studentsIn.get(g.id) ?? 0, facts));
  }

  async create(ownerId: string, input: GroupInput): Promise<GroupSummary> {
    try {
      const [row] = await this.db
        .insert(groups)
        .values({
          ownerId,
          name: input.name,
          kind: input.kind,
          schoolYear: input.year,
        })
        .returning();
      return toSummary(row!, 0, []);
    } catch (err) {
      if (postgresCode(err) === UNIQUE_VIOLATION)
        throw new ConflictException(
          'Masz już klasę o tej nazwie w tym roku szkolnym.',
        );
      throw err;
    }
  }

  async detail(ownerId: string, groupId: string): Promise<GroupDetail> {
    const group = await this.owned(ownerId, groupId);
    const [students, facts] = await Promise.all([
      this.roster(groupId),
      this.examFacts.load(ownerId),
    ]);
    const results = studentResults(facts);
    return {
      group: toSummary(group, students.length, facts),
      students: students.map((s) => toStudent(s, results)),
      exams: facts.filter((f) => f.exam.groupId === groupId).map(summarize),
    };
  }

  async addStudent(
    teacher: Teacher,
    groupId: string,
    input: StudentInput,
  ): Promise<Student> {
    const group = await this.owned(teacher.id, groupId);
    const existing = new Set((await this.roster(groupId)).map(studentKey));
    if (existing.has(studentKey(input)))
      throw new ConflictException('Ten uczeń jest już w klasie.');
    const [row] = await this.db
      .insert(groupStudents)
      .values({
        groupId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
      })
      .returning();
    const [invited] = await this.sendInvites(teacher, group, [row!]);
    return toStudent(invited ?? row!, new Map());
  }

  async importStudents(
    teacher: Teacher,
    groupId: string,
    students: StudentInput[],
  ): Promise<ImportResult> {
    const group = await this.owned(teacher.id, groupId);
    const seen = new Set((await this.roster(groupId)).map(studentKey));
    const fresh = students.filter((s) => {
      const key = studentKey(s);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const rows = fresh.length
      ? await this.db
          .insert(groupStudents)
          .values(
            fresh.map((s) => ({
              groupId,
              firstName: s.firstName,
              lastName: s.lastName,
              email: s.email ?? null,
            })),
          )
          .returning()
      : [];
    const invited = await this.sendInvites(teacher, group, rows);
    return {
      imported: rows.length,
      invited: invited.length,
      skipped: students.length - rows.length,
    };
  }

  async invite(
    teacher: Teacher,
    groupId: string,
    studentId: string,
  ): Promise<Student> {
    const group = await this.owned(teacher.id, groupId);
    const student = await this.student(groupId, studentId);
    const [invited] = await this.sendInvites(teacher, group, [student]);
    if (!invited)
      throw new ConflictException('Nie udało się wysłać zaproszenia.');
    return toStudent(invited, new Map());
  }

  async removeStudent(ownerId: string, groupId: string, studentId: string) {
    await this.owned(ownerId, groupId);
    await this.student(groupId, studentId);
    await this.db.delete(groupStudents).where(eq(groupStudents.id, studentId));
  }

  async owned(ownerId: string, groupId: string) {
    const [group] = await this.db
      .select()
      .from(groups)
      .where(and(eq(groups.id, groupId), eq(groups.ownerId, ownerId)));
    if (!group) throw new NotFoundException('Nie ma takiej klasy.');
    return group;
  }

  private roster(groupId: string) {
    return this.db
      .select()
      .from(groupStudents)
      .where(eq(groupStudents.groupId, groupId))
      .orderBy(asc(groupStudents.lastName), asc(groupStudents.firstName));
  }

  private async student(groupId: string, studentId: string) {
    const [student] = await this.db
      .select()
      .from(groupStudents)
      .where(
        and(
          eq(groupStudents.id, studentId),
          eq(groupStudents.groupId, groupId),
        ),
      );
    if (!student)
      throw new NotFoundException('Nie ma takiego ucznia w klasie.');
    return student;
  }

  private async sendInvites(
    teacher: Teacher,
    group: GroupRow,
    students: StudentRow[],
  ) {
    const withEmail = students.filter((s) => s.email && !s.userId);
    const results = await Promise.allSettled(
      withEmail.map((s) =>
        sendMail(
          s.email!,
          emails.classInvite(s.firstName, teacher.name, group.name),
        ),
      ),
    );
    const sentIds = withEmail
      .filter((_, i) => results[i]!.status === 'fulfilled')
      .map((s) => s.id);
    results
      .filter((r) => r.status === 'rejected')
      .forEach((r) =>
        this.log.warn(
          `Zaproszenie nie wyszło: ${String((r as PromiseRejectedResult).reason)}`,
        ),
      );
    if (sentIds.length === 0) return [];
    return this.db
      .update(groupStudents)
      .set({ invitedAt: new Date() })
      .where(inArray(groupStudents.id, sentIds))
      .returning();
  }
}

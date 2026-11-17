import type { Language } from '@codeportal/contracts';
import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { joinCode } from '../panel/exams/join-code.js';
import * as schema from './schema.js';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const SCHOOL_YEAR = '2026/27';
const EMAIL_DOMAIN = 'szkola.example';
const RESET_FLAG = '--reset';

const {
  codeSnapshots,
  editorEvents,
  examAccess,
  examProblems,
  exams,
  groupStudents,
  groups,
  problems,
  sessions,
  similarityPairs,
  submissions,
  testCases,
  users,
} = schema;

const url = process.env.DATABASE_URL;
const email = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!url) throw new Error('DATABASE_URL is not set');
if (!email)
  throw new Error(`Użycie: pnpm db:seed <e-mail nauczyciela> [${RESET_FLAG}]`);

const db = drizzle(url, { schema, casing: 'snake_case' });
const now = Date.now();
const at = (offsetMs: number) => new Date(now + offsetMs);

const NAMES = [
  ['Szymon', 'Dąbrowski'],
  ['Filip', 'Jankowski'],
  ['Zofia', 'Kamińska'],
  ['Hanna', 'Kozłowska'],
  ['Wiktor', 'Krawczyk'],
  ['Jakub', 'Lewandowski'],
  ['Julia', 'Mazur'],
  ['Oliwia', 'Piotrowska'],
  ['Antoni', 'Szymański'],
  ['Kacper', 'Wiśniewski'],
  ['Lena', 'Woźniak'],
  ['Maja', 'Zielińska'],
  ['Natalia', 'Adamczyk'],
  ['Igor', 'Bąk'],
  ['Amelia', 'Chmielewska'],
  ['Franciszek', 'Czarnecki'],
  ['Pola', 'Dudek'],
  ['Tymon', 'Górski'],
  ['Alicja', 'Jasińska'],
  ['Leon', 'Kaczmarek'],
  ['Laura', 'Kowalczyk'],
  ['Stanisław', 'Michalski'],
  ['Nadia', 'Nowicka'],
  ['Ignacy', 'Ostrowski'],
  ['Michalina', 'Pawlak'],
  ['Aleksander', 'Sikora'],
  ['Gabriela', 'Wójcik'],
  ['Bartosz', 'Zając'],
] as const;

const plainAscii = (s: string) =>
  s
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const GROUPS = [
  { key: '3B', kind: 'class', students: 26 },
  { key: '2A', kind: 'class', students: 28 },
  { key: '1C', kind: 'class', students: 27 },
  { key: '4A', kind: 'class', students: 23 },
  { key: 'Kółko algorytmiczne', kind: 'group', students: 14 },
] as const;

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

type ProblemSeed = {
  key: string;
  title: string;
  type: 'io' | 'unit' | 'web';
  languages: Language[][];
  tags: string[];
  difficulty: number;
  points: number;
  tests: number;
  daysAgo: number;
};

const PROBLEMS: ProblemSeed[] = [
  {
    key: 'lis',
    title: 'Najdłuższy rosnący fragment',
    type: 'io',
    languages: [['cpp'], ['python'], ['java']],
    tags: ['pętle', 'tablice'],
    difficulty: 2,
    points: 30,
    tests: 10,
    daysAgo: 3,
  },
  {
    key: 'digits',
    title: 'Suma cyfr liczby',
    type: 'io',
    languages: [['python'], ['cpp'], ['csharp']],
    tags: ['pętle', 'na rozgrzewkę'],
    difficulty: 1,
    points: 20,
    tests: 6,
    daysAgo: 15,
  },
  {
    key: 'card',
    title: 'Strona wizytówka',
    type: 'web',
    languages: [['html', 'css']],
    tags: ['layout', 'flexbox'],
    difficulty: 1,
    points: 20,
    tests: 0,
    daysAgo: 7,
  },
  {
    key: 'form',
    title: 'Formularz kontaktowy z walidacją',
    type: 'web',
    languages: [['html', 'css', 'php']],
    tags: ['formularze', 'PHP'],
    difficulty: 2,
    points: 40,
    tests: 4,
    daysAgo: 12,
  },
  {
    key: 'hanoi',
    title: 'Wieże Hanoi – liczba ruchów',
    type: 'io',
    languages: [['cpp'], ['python']],
    tags: ['rekurencja'],
    difficulty: 2,
    points: 25,
    tests: 8,
    daysAgo: 2,
  },
  {
    key: 'fraction',
    title: 'Klasa Ułamek z testami',
    type: 'unit',
    languages: [['java'], ['csharp']],
    tags: ['obiektowość'],
    difficulty: 3,
    points: 20,
    tests: 14,
    daysAgo: 18,
  },
  {
    key: 'shopping',
    title: 'Lista zakupów w JavaScript',
    type: 'web',
    languages: [['html', 'css', 'javascript']],
    tags: ['DOM', 'zdarzenia'],
    difficulty: 2,
    points: 30,
    tests: 5,
    daysAgo: 20,
  },
  {
    key: 'maze',
    title: 'Najkrótsza ścieżka w labiryncie',
    type: 'io',
    languages: [['cpp'], ['python'], ['java']],
    tags: ['grafy', 'BFS', 'konkurs'],
    difficulty: 3,
    points: 25,
    tests: 20,
    daysAgo: 28,
  },
];

const LIS_TESTS = [
  ['przykłady', true, '8\n3 1 4 5 2 6 7 8', '4', 5],
  ['przykłady', true, '5\n5 4 3 2 1', '1', 5],
  ['małe', false, '1\n7', '1', 10],
  ['małe', false, '6\n1 2 3 3 4 5', '3', 10],
  ['małe', false, '10\n-5 -4 -3 0 2 1 3 4 5 6', '5', 10],
  ['średnie', false, '12\n1 2 3 4 5 6 7 8 9 10 11 12', '12', 10],
  ['średnie', false, '8\n9 8 7 1 2 3 4 0', '4', 10],
  ['duże', false, '6\n1 1 1 1 1 1', '1', 15],
  ['duże', false, '7\n1 3 2 4 3 5 4', '2', 10],
  ['duże', false, '9\n2 4 6 8 10 1 3 5 7', '5', 15],
] as const;

type ExamSeed = {
  key: string;
  title: string;
  group: (typeof GROUPS)[number]['key'];
  mode: 'test' | 'contest';
  startOffsetMs: number;
  durationMin: number;
  problems: string[];
  published: boolean;
  approved?: boolean;
  scores?: number[][];
};

const EXAMS: ExamSeed[] = [
  {
    key: 'live',
    title: 'Sprawdzian – pętle i tablice',
    group: '3B',
    mode: 'test',
    startOffsetMs: -12 * MINUTE_MS,
    durationMin: 45,
    problems: ['digits', 'lis', 'hanoi'],
    published: true,
  },
  {
    key: 'quiz',
    title: 'Kartkówka – funkcje w Pythonie',
    group: '2A',
    mode: 'test',
    startOffsetMs: DAY_MS,
    durationMin: 20,
    problems: ['digits', 'hanoi'],
    published: true,
  },
  {
    key: 'league2',
    title: 'Szkolna Liga Algorytmiczna – runda 2',
    group: 'Kółko algorytmiczne',
    mode: 'contest',
    startOffsetMs: 4 * DAY_MS,
    durationMin: 120,
    problems: ['digits', 'lis', 'hanoi', 'maze', 'fraction'],
    published: true,
  },
  {
    key: 'card',
    title: 'Strona wizytówka – HTML + CSS',
    group: '1C',
    mode: 'test',
    startOffsetMs: -4 * DAY_MS,
    durationMin: 45,
    problems: ['card'],
    published: true,
    scores: [
      [20],
      [18],
      [20],
      [14],
      [16],
      [20],
      [12],
      [19],
      [15],
      [20],
      [9],
      [17],
      [20],
      [13],
      [18],
      [16],
      [20],
      [11],
      [19],
      [14],
      [17],
      [20],
      [8],
      [15],
      [18],
      [16],
    ],
  },
  {
    key: 'conditions',
    title: 'Sprawdzian – instrukcje warunkowe',
    group: '3B',
    mode: 'test',
    startOffsetMs: -5 * DAY_MS,
    durationMin: 45,
    problems: ['digits', 'lis', 'hanoi', 'maze'],
    published: true,
    scores: [
      [20, 15, 0, 20],
      [10, 0, 0, 0],
      [20, 30, 18, 25],
      [14, 6, 0, 0],
      [20, 30, 25, 18],
      [20, 21, 10, 10],
      [18, 30, 25, 0],
      [20, 27, 8, 15],
      [14, 9, 0, 5],
      [20, 15, 6, 12],
    ],
  },
  {
    key: 'formExam',
    title: 'Formularz kontaktowy – HTML + CSS + PHP',
    group: '4A',
    mode: 'test',
    startOffsetMs: -11 * DAY_MS,
    durationMin: 90,
    problems: ['form'],
    published: true,
    approved: true,
    scores: [
      [32],
      [28],
      [40],
      [24],
      [36],
      [18],
      [30],
      [26],
      [38],
      [22],
      [34],
      [20],
      [29],
      [31],
      [27],
      [40],
      [16],
      [33],
      [25],
      [35],
      [21],
      [30],
    ],
  },
  {
    key: 'league1',
    title: 'Szkolna Liga Algorytmiczna – runda 1',
    group: 'Kółko algorytmiczne',
    mode: 'contest',
    startOffsetMs: -24 * DAY_MS,
    durationMin: 120,
    problems: ['digits', 'lis', 'hanoi', 'maze', 'fraction'],
    published: true,
    approved: true,
    scores: [
      [20, 30, 25, 10, 0],
      [20, 15, 0, 0, 0],
      [20, 30, 25, 25, 20],
      [10, 0, 0, 0, 0],
      [20, 21, 10, 0, 5],
      [20, 30, 0, 0, 0],
      [15, 9, 0, 0, 0],
      [20, 30, 25, 5, 10],
      [20, 6, 0, 0, 0],
      [20, 30, 12, 0, 0],
      [5, 0, 0, 0, 0],
      [20, 27, 25, 15, 0],
      [20, 12, 0, 0, 0],
    ],
  },
  {
    key: 'draft',
    title: 'Rekurencja – zadania powtórkowe',
    group: '3B',
    mode: 'test',
    startOffsetMs: 6 * DAY_MS,
    durationMin: 45,
    problems: ['hanoi', 'fraction'],
    published: false,
  },
];

type LiveSeed = {
  student: number;
  scores: (number | null)[];
  active?: number;
  state: 'online' | 'idle' | 'finished' | 'waiting';
  lastSeenAgoSec: number;
  pastes?: number[];
  exits?: number;
  jump?: boolean;
};

const LIVE: LiveSeed[] = [
  {
    student: 9,
    scores: [20, 30, 25],
    active: 2,
    state: 'online',
    lastSeenAgoSec: 4,
  },
  { student: 2, scores: [20, 30, 25], state: 'finished', lastSeenAgoSec: 180 },
  {
    student: 5,
    scores: [20, 21, null],
    active: 2,
    state: 'online',
    lastSeenAgoSec: 12,
    pastes: [38],
    exits: 3,
  },
  {
    student: 11,
    scores: [20, 30, null],
    active: 2,
    state: 'online',
    lastSeenAgoSec: 6,
  },
  {
    student: 8,
    scores: [20, null, null],
    active: 1,
    state: 'idle',
    lastSeenAgoSec: 240,
    exits: 1,
  },
  {
    student: 10,
    scores: [20, 15, null],
    active: 2,
    state: 'online',
    lastSeenAgoSec: 30,
  },
  {
    student: 0,
    scores: [20, 30, 0],
    active: 2,
    state: 'online',
    lastSeenAgoSec: 3,
    jump: true,
    exits: 1,
  },
  {
    student: 3,
    scores: [14, null, null],
    active: 1,
    state: 'online',
    lastSeenAgoSec: 60,
  },
  {
    student: 1,
    scores: [null, null, null],
    active: 0,
    state: 'waiting',
    lastSeenAgoSec: 420,
    exits: 3,
  },
  {
    student: 6,
    scores: [20, null, null],
    active: 1,
    state: 'online',
    lastSeenAgoSec: 5,
    pastes: [214],
    jump: true,
  },
  {
    student: 7,
    scores: [20, 27, null],
    active: 2,
    state: 'online',
    lastSeenAgoSec: 20,
  },
];

const problemIdByKey = new Map<string, string>();
const idOf = (problem: ProblemSeed) => problemIdByKey.get(problem.key)!;

async function wipe(ownerId: string) {
  const examIds = (
    await db
      .select({ id: exams.id })
      .from(exams)
      .where(eq(exams.ownerId, ownerId))
  ).map((e) => e.id);
  if (examIds.length) {
    const sessionIds = (
      await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(inArray(sessions.examId, examIds))
    ).map((s) => s.id);
    if (sessionIds.length) {
      await db
        .delete(editorEvents)
        .where(inArray(editorEvents.sessionId, sessionIds));
      await db
        .delete(similarityPairs)
        .where(inArray(similarityPairs.examId, examIds));
      await db
        .delete(submissions)
        .where(inArray(submissions.sessionId, sessionIds));
      await db.delete(sessions).where(inArray(sessions.id, sessionIds));
    }
    await db.delete(exams).where(inArray(exams.id, examIds));
  }
  await db.delete(problems).where(eq(problems.ownerId, ownerId));
  await db.delete(groups).where(eq(groups.ownerId, ownerId));
}

function snapshotsFor(
  lines: string[],
  startedAt: Date,
  jumpAtLine: number | null,
) {
  const frames: { createdAt: Date; code: string }[] = [];
  let t = startedAt.getTime() + 2 * MINUTE_MS;
  for (let i = 1; i <= lines.length; i++) {
    if (jumpAtLine !== null && i > jumpAtLine && i < lines.length) continue;
    frames.push({ createdAt: new Date(t), code: lines.slice(0, i).join('\n') });
    t += jumpAtLine !== null && i === jumpAtLine ? 4 * MINUTE_MS : 20_000;
  }
  return frames;
}

async function seed() {
  const [teacher] = await db
    .select()
    .from(users)
    .where(eq(users.email, email!));
  if (!teacher)
    throw new Error(
      'Nie ma konta o tym adresie — najpierw zarejestruj się w aplikacji.',
    );
  const reset = process.argv.includes(RESET_FLAG);
  const [existing] = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.ownerId, teacher.id))
    .limit(1);
  const [existingProblem] = await db
    .select({ id: problems.id })
    .from(problems)
    .where(eq(problems.ownerId, teacher.id))
    .limit(1);
  if ((existing || existingProblem) && !reset)
    throw new Error(
      `To konto ma już dane w panelu. Uruchom z ${RESET_FLAG}, żeby je usunąć i wgrać dane demo.`,
    );
  if (reset) await wipe(teacher.id);

  const groupIds = new Map<string, string>();
  const rosters = new Map<string, (typeof groupStudents.$inferSelect)[]>();
  for (const g of GROUPS) {
    const [row] = await db
      .insert(groups)
      .values({
        ownerId: teacher.id,
        name: g.key,
        kind: g.kind,
        schoolYear: SCHOOL_YEAR,
      })
      .returning();
    groupIds.set(g.key, row!.id);
    const students = await db
      .insert(groupStudents)
      .values(
        NAMES.slice(0, g.students).map(([firstName, lastName], i) => ({
          groupId: row!.id,
          firstName,
          lastName,
          email:
            i % 9 === 1
              ? null
              : `${plainAscii(firstName[0]!)}.${plainAscii(lastName)}@${EMAIL_DOMAIN}`,
          invitedAt: i % 9 === 1 ? null : at(-30 * DAY_MS),
        })),
      )
      .returning();
    rosters.set(g.key, students);
  }

  for (const p of PROBLEMS) {
    const isLis = p.key === 'lis';
    const [row] = await db
      .insert(problems)
      .values({
        ownerId: teacher.id,
        title: p.title,
        type: p.type,
        languages: p.languages,
        tags: p.tags,
        difficulty: p.difficulty,
        points: p.points,
        statementMd: isLis
          ? 'Dany jest ciąg n liczb całkowitych. Znajdź długość najdłuższego fragmentu, w którym każda kolejna liczba jest większa od poprzedniej.'
          : `Treść zadania „${p.title}”.`,
        inputSpec: isLis
          ? 'W pierwszym wierszu liczba n (1 ≤ n ≤ 10⁶). W drugim n liczb całkowitych z przedziału [−10⁹, 10⁹].'
          : 'Opis danych wejściowych.',
        outputSpec: isLis
          ? 'Jedna liczba – długość najdłuższego rosnącego fragmentu.'
          : 'Opis oczekiwanego wyniku.',
        referenceLanguage: p.languages[0]![0]!,
        referenceSolution: isLis ? LIS_SOLUTION : '',
        variants: isLis
          ? [
              {
                id: 'v1',
                name: 'Wariant A – rosnący fragment',
                note: 'oryginalna treść',
              },
              {
                id: 'v2',
                name: 'Wariant B – malejący fragment',
                note: 'zmieniony warunek, te same limity',
              },
            ]
          : [],
        updatedAt: at(-p.daysAgo * DAY_MS),
      })
      .returning();
    problemIdByKey.set(p.key, row!.id);
    const tests = isLis
      ? LIS_TESTS.map(([group, visible, input, output, weight], i) => ({
          name: `Test ${i + 1}`,
          groupName: group,
          isSample: visible,
          input,
          expectedOutput: output,
          points: weight,
          referenceMs: 2 + i,
        }))
      : Array.from({ length: p.tests }, (_, i) => ({
          name: `Test ${i + 1}`,
          groupName: i < 2 ? 'przykłady' : 'podstawowe',
          isSample: i < 2,
          input: `zestaw ${i + 1}`,
          expectedOutput: `wynik ${i + 1}`,
          points: Math.floor(100 / p.tests) + (i < 100 % p.tests ? 1 : 0),
          referenceMs: 2 + i,
        }));
    if (tests.length)
      await db
        .insert(testCases)
        .values(
          tests.map((t, position) => ({ ...t, problemId: row!.id, position })),
        );
  }

  for (const e of EXAMS) {
    const startsAt = at(e.startOffsetMs);
    const endsAt = new Date(startsAt.getTime() + e.durationMin * MINUTE_MS);
    const [exam] = await db
      .insert(exams)
      .values({
        ownerId: teacher.id,
        groupId: groupIds.get(e.group)!,
        title: e.title,
        mode: e.mode,
        slug: e.published ? joinCode() : null,
        startsAt,
        endsAt,
        durationMin: e.durationMin,
        publishedAt: e.published
          ? new Date(Math.min(now, startsAt.getTime()) - 2 * DAY_MS)
          : null,
        resultsApprovedAt: e.approved
          ? new Date(endsAt.getTime() + DAY_MS)
          : null,
        updatedAt: at(-DAY_MS),
      })
      .returning();
    await db.insert(examAccess).values({ examId: exam!.id, type: 'link' });
    const slotProblems = e.problems.map((key) =>
      PROBLEMS.find((p) => p.key === key)!,
    );
    await db
      .insert(examProblems)
      .values(
        slotProblems.map((p, order) => ({
          examId: exam!.id,
          problemId: idOf(p),
          order,
          pointsOverride: p.points,
        })),
      );
    const roster = rosters.get(e.group)!;

    if (e.scores)
      await seedGradedExam(exam!.id, e, roster, slotProblems, startsAt);
    if (e.key === 'live')
      await seedLiveExam(exam!.id, roster, slotProblems, startsAt);
  }

  console.log(`Wgrano dane demo dla ${email}.`);
}

async function addSubmission(
  sessionId: string,
  problem: ProblemSeed,
  points: number,
  submittedAt: Date,
  code: string,
) {
  const [row] = await db
    .insert(submissions)
    .values({
      sessionId,
      problemId: idOf(problem),
      language: problem.languages[0]![0]!,
      files: [{ path: 'main', content: code }],
      status: 'done',
      verdict: points === problem.points ? 'OK' : 'WA',
      score: points / problem.points,
      submittedAt,
    })
    .returning();
  return row!;
}

async function seedGradedExam(
  examId: string,
  e: ExamSeed,
  roster: (typeof groupStudents.$inferSelect)[],
  slots: ProblemSeed[],
  startsAt: Date,
) {
  const submissionsByStudent: Record<number, string[]> = {};
  for (const [i, scores] of e.scores!.entries()) {
    const student = roster[i]!;
    const finishedAt = new Date(
      startsAt.getTime() + (30 + (i % 12)) * MINUTE_MS,
    );
    const [session] = await db
      .insert(sessions)
      .values({
        examId,
        studentId: student.id,
        startedAt: new Date(startsAt.getTime() + MINUTE_MS),
        finishedAt,
        lastSeenAt: finishedAt,
        status: 'finished',
        reviewStatus: e.approved
          ? 'approved'
          : i % 3 === 0
            ? 'approved'
            : 'pending',
      })
      .returning();
    submissionsByStudent[i] = [];
    for (const [slot, points] of scores.entries()) {
      const sub = await addSubmission(
        session!.id,
        slots[slot]!,
        points,
        new Date(startsAt.getTime() + (8 + slot * 9) * MINUTE_MS),
        slots[slot]!.key === 'lis'
          ? LIS_SOLUTION
          : `// rozwiązanie Z${slot + 1}`,
      );
      submissionsByStudent[i]!.push(sub.id);
    }
    if (e.key === 'conditions' && (i === 6 || i === 5)) {
      await db.insert(editorEvents).values([
        {
          sessionId: session!.id,
          ts: new Date(startsAt.getTime() + 13 * MINUTE_MS),
          type: 'paste_blocked',
          payload: { chars: 38 },
        },
        {
          sessionId: session!.id,
          ts: new Date(startsAt.getTime() + 31 * MINUTE_MS),
          type: 'paste_blocked',
          payload: { chars: 214 },
        },
        {
          sessionId: session!.id,
          ts: new Date(startsAt.getTime() + 29 * MINUTE_MS),
          type: 'delta',
          payload: {
            problemId: idOf(slots[1]!),
            insertedLines: 40,
            durationMs: 3000,
          },
        },
        {
          sessionId: session!.id,
          ts: new Date(startsAt.getTime() + 7 * MINUTE_MS),
          type: 'fullscreen_exit',
          payload: { durationMs: 70_000 },
        },
      ]);
      await seedReplay(
        session!.id,
        idOf(slots[1]!),
        new Date(startsAt.getTime() + MINUTE_MS),
        10,
      );
    }
    if (e.key === 'conditions' && i === 1) {
      await db
        .insert(editorEvents)
        .values(
          [5, 11, 19].map((m) => ({
            sessionId: session!.id,
            ts: new Date(startsAt.getTime() + m * MINUTE_MS),
            type: 'fullscreen_exit' as const,
            payload: { durationMs: 50_000 },
          })),
        );
    }
    if (e.key === 'card' && i === 0) {
      await db
        .insert(editorEvents)
        .values(
          [6, 14, 22].map((m) => ({
            sessionId: session!.id,
            ts: new Date(startsAt.getTime() + m * MINUTE_MS),
            type: 'fullscreen_exit' as const,
            payload: { durationMs: 40_000 },
          })),
        );
    }
  }
  if (e.key === 'conditions') {
    await db.insert(similarityPairs).values({
      examId,
      problemId: idOf(slots[1]!),
      submissionA: submissionsByStudent[6]![1]!,
      submissionB: submissionsByStudent[5]![1]!,
      score: 0.87,
      method: 'tokens',
    });
  }
}

async function seedReplay(
  sessionId: string,
  problemId: string,
  startedAt: Date,
  jumpAtLine: number | null,
) {
  const frames = snapshotsFor(LIS_SOLUTION.split('\n'), startedAt, jumpAtLine);
  await db
    .insert(codeSnapshots)
    .values(
      frames.map((f) => ({
        sessionId,
        problemId,
        language: 'cpp',
        files: [{ path: 'main.cpp', content: f.code }],
        createdAt: f.createdAt,
      })),
    );
}

async function seedLiveExam(
  examId: string,
  roster: (typeof groupStudents.$inferSelect)[],
  slots: ProblemSeed[],
  startsAt: Date,
) {
  for (const p of LIVE) {
    const student = roster[p.student]!;
    const startedAt = new Date(startsAt.getTime() + MINUTE_MS);
    const finished = p.state === 'finished';
    const [session] = await db
      .insert(sessions)
      .values({
        examId,
        studentId: student.id,
        startedAt,
        lastSeenAt: at(-p.lastSeenAgoSec * 1000),
        finishedAt: finished ? at(-p.lastSeenAgoSec * 1000) : null,
        waitingSince: p.state === 'waiting' ? at(-7 * MINUTE_MS) : null,
        status: finished ? 'finished' : 'active',
      })
      .returning();
    for (const [slot, points] of p.scores.entries()) {
      if (points === null) continue;
      await addSubmission(
        session!.id,
        slots[slot]!,
        points,
        at(-(10 - slot * 3) * MINUTE_MS),
        slots[slot]!.key === 'lis'
          ? LIS_SOLUTION
          : `// rozwiązanie Z${slot + 1}`,
      );
    }
    if (p.active !== undefined && slots[p.active]!.key === 'lis')
      await seedReplay(
        session!.id,
        idOf(slots[p.active]!),
        startedAt,
        p.jump ? 9 : null,
      );
    else if (p.active !== undefined)
      await db
        .insert(codeSnapshots)
        .values({
          sessionId: session!.id,
          problemId: idOf(slots[p.active]!),
          language: 'python',
          files: [
            {
              path: 'main.py',
              content: 'n = int(input())\nprint(sum(int(c) for c in str(n)))',
            },
          ],
          createdAt: at(-p.lastSeenAgoSec * 1000),
        });
    const events: (typeof editorEvents.$inferInsert)[] = [
      ...(p.pastes ?? []).map((chars, i) => ({
        sessionId: session!.id,
        ts: at(-(8 - i * 6) * MINUTE_MS),
        type: 'paste_blocked' as const,
        payload: { chars },
      })),
      ...Array.from({ length: p.exits ?? 0 }, (_, i) => ({
        sessionId: session!.id,
        ts: at(-(9 - i * 3) * MINUTE_MS),
        type: 'fullscreen_exit' as const,
        payload: { durationMs: 4000 },
      })),
      ...(p.jump
        ? [
            {
              sessionId: session!.id,
              ts: at(-2 * MINUTE_MS),
              type: 'delta' as const,
              payload: {
                problemId: idOf(slots[1]!),
                insertedLines: 40,
                durationMs: 3000,
              },
            },
          ]
        : []),
    ];
    if (events.length) await db.insert(editorEvents).values(events);
  }
}

try {
  await seed();
} finally {
  await db.$client.end();
}

import type {
  LiveEvent,
  LiveParticipant,
  ParticipantStatus,
} from '@codeportal/contracts';
import {
  fullName,
  type ExamFacts,
  type SessionFacts,
} from './exam-facts.service.js';
import { MINUTE_MS } from './exam-rules.js';

const IDLE_AFTER_MS = 3 * MINUTE_MS;
const OFFLINE_AFTER_MS = 10 * MINUTE_MS;
const EVENT_FEED_LIMIT = 60;
const ALL_STUDENTS = 'Wszyscy uczniowie';

function statusOf(session: SessionFacts, now: Date): ParticipantStatus {
  const { row } = session;
  if (row.status === 'finished' || row.status === 'terminated')
    return 'finished';
  if (!row.startedAt) return 'not_started';
  const lastSeen = row.lastSeenAt ?? row.startedAt;
  const silentMs = now.getTime() - lastSeen.getTime();
  if (silentMs > OFFLINE_AFTER_MS) return 'offline';
  if (silentMs > IDLE_AFTER_MS) return 'idle';
  return 'online';
}

const signalCount = (session: SessionFacts) => session.signalEvents.length;

export function liveParticipants(
  facts: ExamFacts,
  now = new Date(),
): LiveParticipant[] {
  const joinedStudentIds = new Set(facts.sessions.map((s) => s.row.studentId));
  const fromSessions = facts.sessions.map((s): LiveParticipant => {
    const status = statusOf(s, now);
    return {
      id: s.row.id,
      sessionId: s.row.id,
      name: s.name,
      status,
      scores: facts.slots.map((_, i) =>
        s.scoringSubmissions[i] || s.slotReviews[i] ? s.scores[i]! : null,
      ),
      activeProblem: s.activeProblem,
      events: signalCount(s),
      lastActivityAt:
        (s.row.lastSeenAt ?? s.row.startedAt)?.toISOString() ?? null,
      waitingForDecision: Boolean(s.row.waitingSince) && status !== 'finished',
    };
  });
  const absent = facts.roster
    .filter((student) => !joinedStudentIds.has(student.id))
    .map((student): LiveParticipant => ({
      id: student.id,
      sessionId: null,
      name: fullName(student),
      status: 'not_started',
      scores: facts.slots.map(() => null),
      events: 0,
      lastActivityAt: null,
      waitingForDecision: false,
    }));
  return [...fromSessions, ...absent].sort((a, b) =>
    a.name.localeCompare(b.name, 'pl'),
  );
}

type Payload = {
  chars?: number;
  insertedLines?: number;
  durationMs?: number;
  minutes?: number;
  reason?: string;
};

function signalEvent(
  session: SessionFacts,
  event: SessionFacts['signalEvents'][number],
): LiveEvent {
  const payload = (event.payload ?? {}) as Payload;
  const base = {
    id: `ev-${event.id}`,
    at: event.ts.toISOString(),
    student: session.name,
  };
  if (event.type === 'paste_blocked')
    return {
      ...base,
      kind: 'paste',
      text: `Próba wklejenia · ${payload.chars ?? 0} znaków`,
    };
  if (event.type === 'delta')
    return {
      ...base,
      kind: 'jump',
      text: `Skok kodu: +${payload.insertedLines ?? 0} linii w ${Math.max(1, Math.round((payload.durationMs ?? 0) / 1000))} s`,
    };
  if (event.type === 'blur')
    return { ...base, kind: 'fullscreen', text: 'Opuszczenie okna testu' };
  return { ...base, kind: 'fullscreen', text: 'Wyjście z pełnego ekranu' };
}

export function liveEvents(facts: ExamFacts): LiveEvent[] {
  const slotOf = new Map(
    facts.slots.flatMap((slot) =>
      slot.problemIds.map((id) => [id, slot] as const),
    ),
  );
  const sessionById = new Map(facts.sessions.map((s) => [s.row.id, s]));
  const events: LiveEvent[] = [];

  for (const session of facts.sessions) {
    events.push(...session.signalEvents.map((e) => signalEvent(session, e)));
    for (const sub of session.submissions) {
      const slot = slotOf.get(sub.problemId);
      if (!slot) continue;
      events.push({
        id: `sub-${sub.id}`,
        at: sub.submittedAt.toISOString(),
        student: session.name,
        kind: 'submit',
        text: `Zgłoszenie Z${slot.number} · ${Math.round((sub.score ?? 0) * slot.max)}/${slot.max} pkt`,
      });
    }
    if (session.row.finishedAt && session.row.status === 'finished') {
      events.push({
        id: `fin-${session.row.id}`,
        at: session.row.finishedAt.toISOString(),
        student: session.name,
        kind: 'finish',
        text: `Zakończono test · ${session.total}/${facts.maxPoints}`,
      });
    }
  }

  for (const action of facts.actions) {
    const payload = action.payload as Payload;
    const student = action.sessionId
      ? (sessionById.get(action.sessionId)?.name ?? 'Uczeń')
      : ALL_STUDENTS;
    const base = {
      id: `act-${action.id}`,
      at: action.createdAt.toISOString(),
      student,
    };
    if (action.kind === 'add_time')
      events.push({
        ...base,
        kind: 'time',
        text: `Dodano ${payload.minutes} min${payload.reason ? ` · ${payload.reason}` : ''}`,
      });
    if (action.kind === 'readmit')
      events.push({
        ...base,
        kind: 'submit',
        text: 'Wpuszczony ponownie przez nauczyciela',
      });
    if (action.kind === 'end_session')
      events.push({
        ...base,
        kind: 'finish',
        text: 'Sesja zakończona przez nauczyciela',
      });
    if (action.kind === 'end_exam')
      events.push({
        ...base,
        kind: 'finish',
        text: 'Test zakończony przez nauczyciela',
      });
  }

  return events
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, EVENT_FEED_LIMIT);
}

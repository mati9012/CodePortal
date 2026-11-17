import type { Signal } from '@codeportal/contracts';

export const HIGH_RISK = 60;
export const JUMP_MIN_LINES = 15;
export const JUMP_MAX_MS = 5000;

const PASTE_WEIGHT = 11;
const PASTE_CAP = 22;
const JUMP_WEIGHT = 20;
const JUMP_CAP = 30;
const FOCUS_LOSS_WEIGHT = 5;
const FOCUS_LOSS_CAP = 20;
const STRONG_SIMILARITY = 0.75;
const NOTABLE_SIMILARITY = 0.6;
const STRONG_SIMILARITY_WEIGHT = 15;
const NOTABLE_SIMILARITY_WEIGHT = 8;
const MAX_RISK = 100;

type Paste = { at: Date; chars: number };
type Jump = { problemNumber: number | null; lines: number; durationMs: number };
type Similarity = { student: string; problemNumber: number; score: number };

export type SignalFacts = {
  pastes: Paste[];
  jumps: Jump[];
  focusLosses: number;
  focusLossMs: number;
  similarity: Similarity | null;
};

const timeFmt = new Intl.DateTimeFormat('pl-PL', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Warsaw',
});

function formatDuration(ms: number) {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min ? `${min} min ${sec} s` : `${sec} s`;
}

function similarityWeight(score: number) {
  if (score >= STRONG_SIMILARITY) return STRONG_SIMILARITY_WEIGHT;
  if (score >= NOTABLE_SIMILARITY) return NOTABLE_SIMILARITY_WEIGHT;
  return 0;
}

export function signalsFrom(facts: SignalFacts): Signal[] {
  const signals: Signal[] = [];
  if (facts.pastes.length) {
    signals.push({
      kind: 'paste',
      title: `Próby wklejenia · ${facts.pastes.length}`,
      detail: facts.pastes
        .map((p) => `${p.chars} znaków (${timeFmt.format(p.at)})`)
        .join(', '),
      weight: Math.min(PASTE_CAP, facts.pastes.length * PASTE_WEIGHT),
    });
  }
  facts.jumps.forEach((jump, i) => {
    signals.push({
      kind: 'jump',
      title: jump.problemNumber
        ? `Skok kodu w Z${jump.problemNumber}`
        : 'Skok kodu',
      detail: `+${jump.lines} linii w ${formatDuration(jump.durationMs)}`,
      weight: Math.max(0, Math.min(JUMP_WEIGHT, JUMP_CAP - i * JUMP_WEIGHT)),
    });
  });
  if (facts.focusLosses) {
    signals.push({
      kind: 'fullscreen',
      title: `Wyjścia z okna testu · ${facts.focusLosses}`,
      detail: facts.focusLossMs
        ? `łącznie ${formatDuration(facts.focusLossMs)} poza oknem testu`
        : 'opuszczenie pełnego ekranu lub karty',
      weight: Math.min(FOCUS_LOSS_CAP, facts.focusLosses * FOCUS_LOSS_WEIGHT),
    });
  }
  if (facts.similarity && similarityWeight(facts.similarity.score) > 0) {
    signals.push({
      kind: 'similarity',
      title: 'Podobieństwo do innego rozwiązania',
      detail: `${Math.round(facts.similarity.score * 100)}% z rozwiązaniem: ${facts.similarity.student} (Z${facts.similarity.problemNumber})`,
      weight: similarityWeight(facts.similarity.score),
    });
  }
  return signals.filter((s) => s.weight > 0);
}

export function riskScore(facts: SignalFacts) {
  return Math.min(
    MAX_RISK,
    signalsFrom(facts).reduce((sum, s) => sum + s.weight, 0),
  );
}

export function mainReason(signals: Signal[]) {
  const strongest = [...signals].sort((a, b) => b.weight - a.weight)[0];
  return strongest ? `${strongest.title}: ${strongest.detail}` : 'Ocena ręczna';
}

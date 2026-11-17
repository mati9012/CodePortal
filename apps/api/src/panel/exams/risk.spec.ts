import {
  HIGH_RISK,
  mainReason,
  riskScore,
  signalsFrom,
  type SignalFacts,
} from './risk.js';

const clean: SignalFacts = {
  pastes: [],
  jumps: [],
  focusLosses: 0,
  focusLossMs: 0,
  similarity: null,
};
const at = new Date('2026-11-12T09:44:00Z');

describe('risk', () => {
  it('scores a clean session as zero with no signals', () => {
    expect(riskScore(clean)).toBe(0);
    expect(signalsFrom(clean)).toEqual([]);
    expect(mainReason([])).toBe('Ocena ręczna');
  });

  it('caps repeated paste attempts', () => {
    const pastes = [1, 2, 3, 4].map((chars) => ({ at, chars }));
    expect(riskScore({ ...clean, pastes })).toBe(22);
  });

  it('flags a session with pastes, a code jump and strong similarity as high risk', () => {
    const facts: SignalFacts = {
      ...clean,
      pastes: [{ at, chars: 214 }],
      jumps: [{ problemNumber: 2, lines: 40, durationMs: 3000 }],
      focusLosses: 2,
      focusLossMs: 90_000,
      similarity: { student: 'Julia Mazur', problemNumber: 2, score: 0.87 },
    };
    const signals = signalsFrom(facts);
    expect(signals.map((s) => s.kind)).toEqual([
      'paste',
      'jump',
      'fullscreen',
      'similarity',
    ]);
    expect(riskScore(facts)).toBe(11 + 20 + 10 + 15);
    expect(
      riskScore({ ...facts, pastes: [...facts.pastes, { at, chars: 38 }] }),
    ).toBeGreaterThanOrEqual(HIGH_RISK);
    expect(mainReason(signals)).toContain('Skok kodu w Z2');
  });

  it('ignores weak similarity', () => {
    expect(
      riskScore({
        ...clean,
        similarity: { student: 'X', problemNumber: 1, score: 0.4 },
      }),
    ).toBe(0);
  });
});

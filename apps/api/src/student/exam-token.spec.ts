import { describe, expect, it } from 'vitest';
import { examToken, sessionIdFromToken } from './exam-token.js';

const SECRET = 'test-secret';
const SESSION_ID = '0b6a3c1e-8a52-4a3e-9d1f-4c2b7e9a1d20';

describe('exam token', () => {
  it('returns the session id for a token it signed', () => {
    expect(sessionIdFromToken(examToken(SESSION_ID, SECRET), SECRET)).toBe(
      SESSION_ID,
    );
  });

  it('rejects a token for another session or secret', () => {
    const token = examToken(SESSION_ID, SECRET);
    const forged = token.replace(
      SESSION_ID,
      '11111111-1111-4111-8111-111111111111',
    );
    expect(sessionIdFromToken(forged, SECRET)).toBeNull();
    expect(sessionIdFromToken(token, 'other-secret')).toBeNull();
    expect(sessionIdFromToken('garbage', SECRET)).toBeNull();
  });
});

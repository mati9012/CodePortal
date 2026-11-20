import { createHmac, timingSafeEqual } from 'node:crypto';

const SEPARATOR = '.';

const signatureOf = (sessionId: string, secret: string) =>
  createHmac('sha256', secret).update(`exam-session:${sessionId}`).digest();

export const examToken = (sessionId: string, secret: string) =>
  `${sessionId}${SEPARATOR}${signatureOf(sessionId, secret).toString('base64url')}`;

export function sessionIdFromToken(token: string, secret: string) {
  const [sessionId, signature] = token.split(SEPARATOR);
  if (!sessionId || !signature) return null;
  const expected = signatureOf(sessionId, secret);
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  return sessionId;
}

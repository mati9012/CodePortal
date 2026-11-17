import { DatabaseError } from 'pg';

export const UNIQUE_VIOLATION = '23505';
export const FOREIGN_KEY_VIOLATION = '23503';

export function postgresCode(err: unknown) {
  const source =
    err instanceof DatabaseError
      ? err
      : (err as { cause?: unknown } | null)?.cause;
  return source instanceof DatabaseError ? source.code : undefined;
}

import { desc, inArray } from 'drizzle-orm';
import type { Db } from '../../db/index.js';
import { codeSnapshots, submissions } from '../../db/schema.js';

type Executor = Pick<Db, 'selectDistinctOn' | 'insert'>;

const keyOf = (row: { sessionId: string; problemId: string }) =>
  `${row.sessionId}:${row.problemId}`;

export async function submitLatestDrafts(db: Executor, sessionIds: string[]) {
  if (sessionIds.length === 0) return;
  const [drafts, lastSubmissions] = await Promise.all([
    db
      .selectDistinctOn([codeSnapshots.sessionId, codeSnapshots.problemId])
      .from(codeSnapshots)
      .where(inArray(codeSnapshots.sessionId, sessionIds))
      .orderBy(
        codeSnapshots.sessionId,
        codeSnapshots.problemId,
        desc(codeSnapshots.createdAt),
      ),
    db
      .selectDistinctOn([submissions.sessionId, submissions.problemId], {
        sessionId: submissions.sessionId,
        problemId: submissions.problemId,
        submittedAt: submissions.submittedAt,
      })
      .from(submissions)
      .where(inArray(submissions.sessionId, sessionIds))
      .orderBy(
        submissions.sessionId,
        submissions.problemId,
        desc(submissions.submittedAt),
      ),
  ]);
  const submittedAt = new Map(
    lastSubmissions.map((s) => [keyOf(s), s.submittedAt]),
  );
  const unsubmitted = drafts.filter((draft) => {
    const last = submittedAt.get(keyOf(draft));
    return !last || draft.createdAt > last;
  });
  if (unsubmitted.length === 0) return;
  await db.insert(submissions).values(
    unsubmitted.map(({ sessionId, problemId, language, files }) => ({
      sessionId,
      problemId,
      language,
      files,
    })),
  );
}

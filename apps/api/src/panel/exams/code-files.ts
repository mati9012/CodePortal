import type { CodeFile } from '../../db/schema.js';

export function joinFiles(files: CodeFile[]) {
  if (files.length === 1) return files[0]!.content;
  return files.map((f) => `── ${f.path} ──\n${f.content}`).join('\n\n');
}

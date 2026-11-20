import type { CodeFile, Language } from '@codeportal/contracts';
import type { StarterCode } from '../db/schema.js';

const STARTER: Record<Language, CodeFile> = {
  python: { path: 'main.py', content: '' },
  cpp: {
    path: 'main.cpp',
    content:
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
  },
  java: {
    path: 'Main.java',
    content:
      'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n',
  },
  csharp: {
    path: 'Program.cs',
    content:
      'using System;\n\nclass Program {\n    static void Main() {\n        \n    }\n}\n',
  },
  javascript: { path: 'script.js', content: '' },
  php: { path: 'index.php', content: '<?php\n\n' },
  html: {
    path: 'index.html',
    content:
      '<!doctype html>\n<html lang="pl">\n<head>\n  <meta charset="utf-8">\n  <title>Zadanie</title>\n</head>\n<body>\n  \n</body>\n</html>\n',
  },
  css: { path: 'style.css', content: '' },
};

export const languageKey = (set: Language[]) => set.join('+');

export function starterFiles(
  languages: Language[][],
  custom: StarterCode | null,
) {
  return Object.fromEntries(
    languages.map((set) => {
      const key = languageKey(set);
      return [key, custom?.[key] ?? set.map((language) => STARTER[language])];
    }),
  );
}

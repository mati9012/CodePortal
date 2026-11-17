# Zasady projektu CodePortal

## Czysty kod

- Kod ma się tłumaczyć sam: precyzyjne nazwy zmiennych, funkcji i komponentów, małe funkcje robiące jedną rzecz, stałe zamiast magicznych liczb (`SESSION_TTL_SECONDS`, nie `60 * 60 * 24 * 30` z dopiskiem).
- Bez martwego kodu: żadnych nieużywanych importów, eksportów, plików, zmiennych ani zakomentowanych fragmentów.
- Bez duplikacji: wspólne rzeczy trafiają do `components/ui`, `lib` albo modułu w API, zanim powstanie druga kopia.
- Spójność z resztą repo ważniejsza niż własne preferencje: te same wzorce, nazewnictwo i struktura katalogów co w istniejącym kodzie.
- Przed oddaniem pracy: `pnpm lint` i `pnpm build` muszą przechodzić bez błędów i ostrzeżeń.

## Bez komentarzy

- Nie piszemy komentarzy w kodzie: TS/TSX/JS, CSS, Dockerfile, docker-compose, konfiguracje. Dotyczy też komentarzy JSX `{/* … */}` i JSDoc.
- Gdy coś wymaga wyjaśnienia, poprawiamy nazwę albo wydzielamy funkcję lub stałą o mówiącej nazwie. Wiedza o projekcie, uruchamianiu i decyzjach trafia do `README.md` i `docs/`.
- Wyjątki, bo nie są komentarzami dla ludzi: dyrektywy narzędzi (`eslint-disable…`, `@ts-expect-error`, `/// <reference …>`), pliki generowane (`apps/api/drizzle/*.sql`, `next-env.d.ts`, `AGENTS.md`) i szablon `.env.example`.

## Git

- Commit i push tylko na wyraźną prośbę.
- Autor commitów: `89378942+mati9012@users.noreply.github.com`. Prywatny e-mail ani żadne sekrety (`.env`, klucze SMTP, `BETTER_AUTH_SECRET`) nie trafiają do repo.
- W repo nie ma plików IDE, systemowych ani buildów (`.idea/`, `.DS_Store`, `dist/`, `.next/`, `*.tsbuildinfo`) — pilnuje tego `.gitignore`.
- Ten Mac to środowisko dev; produkcja (Mac mini) pobiera zmiany przez `git pull` z `origin/main`.

## Frameworki

@apps/web/AGENTS.md
@apps/api/AGENTS.md

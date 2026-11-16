# CodePortal

„Testportal dla kodu” — testy i konkursy z programowania w przeglądarce, z automatycznym ocenianiem w sandboxie i wielowarstwową ochroną przed AI.

Pełna specyfikacja: [docs/SPEC.md](docs/SPEC.md).

## Struktura

```
apps/
  web/   Next.js (App Router) + Tailwind + Monaco — panel organizatora i widok testu
  api/   NestJS + Drizzle (PostgreSQL) + BullMQ (Redis) — moduły: auth, problems, exams,
         sessions, submissions, integrity
docs/    specyfikacja projektu
docker-compose.infra.yml   sama infrastruktura + narzędzia (do `pnpm dev`)
docker-compose.yml         cały stack: infra (include) + migracje, API, web
```

## Uruchomienie w Dockerze (dowolny komputer)

Wymagany tylko Docker (Docker Desktop albo Docker Engine z Compose v2). Node ani pnpm nie są potrzebne.

```bash
git clone <repo> codeportal && cd codeportal
docker compose up -d --build
```

Compose sam zbuduje obrazy, poczeka na bazę, wykona migracje, utworzy bucket i uruchomi API oraz web. Działa bez pliku `.env`; żeby zmienić hasła, porty albo adresy, skopiuj sekcję „Docker Compose” z `.env.example` do `.env`.

| Usługa | Adres | Kontener |
| --- | --- | --- |
| Web | http://localhost:3000 | `web` |
| API | http://localhost:4000 | `api` |
| PostgreSQL | localhost:5432 (codeportal / codeportal) | `postgres` |
| Redis | localhost:6379 | `redis` |
| S3 (SeaweedFS) | http://localhost:8333 (codeportal / codeportal-dev) | `s3` |
| Przeglądarka plików S3 | http://localhost:8888 | `s3` |
| Adminer (PostgreSQL) | http://localhost:8080 (serwer `postgres`, codeportal / codeportal) | `adminer` |
| RedisInsight (Redis, BullMQ) | http://localhost:5540 | `redisinsight` |
| — | migracje Drizzle, jednorazowo przy starcie | `migrate` |
| — | tworzenie bucketu, jednorazowo przy starcie | `s3-init` |

Przydatne komendy:

```bash
docker compose ps                 # stan kontenerów
docker compose logs -f api        # logi API
docker compose up -d --build      # po zmianach w kodzie (migracje odpalą się same)
docker compose down               # zatrzymanie (dane zostają w wolumenach)
docker compose down -v            # zatrzymanie i usunięcie danych
```

**Dostęp z innych komputerów w sieci:** przeglądarka łączy się z API bezpośrednio, więc w `.env` ustaw `PUBLIC_WEB_URL=http://<ip-serwera>:3000` i `PUBLIC_API_URL=http://<ip-serwera>:4000`, a potem `docker compose up -d --build` (adres API jest wbudowywany w obraz web).

## Development (hot reload)

Wymagania: Node 24 (`.nvmrc`), pnpm, Docker.

W Dockerze działa tylko infrastruktura i narzędzia z `docker-compose.infra.yml` (nic się nie buduje), a aplikacje chodzą lokalnie z hot reloadem:

```bash
pnpm install
cp .env.example apps/api/.env      # jeśli jeszcze nie istnieje
pnpm db:up                          # Postgres, Redis, S3, Adminer, RedisInsight
pnpm db:migrate                     # migracje Drizzle (apps/api/drizzle)
pnpm dev                            # web :3000, api :4000
pnpm db:down                        # zatrzymanie infrastruktury (dane zostają)
```

Oba pliki compose używają tego samego projektu `codeportal`, więc dzielą kontenery i dane. Jeśli działał pełny stack, przed `pnpm dev` zatrzymaj `docker compose stop api web` — zajmują te same porty.

## Zasady architektury

- Kod uczestnika **nigdy** nie wykonuje się w procesie API — API wrzuca zgłoszenie do kolejki `judge`, worker sandboxa (Judge0 → isolate) ocenia i zapisuje werdykt.
- Testy ukryte nigdy nie trafiają do przeglądarki; czas testu liczony wyłącznie na serwerze.

## Baza danych (Drizzle)

- Schemat: `apps/api/src/db/schema.ts` (klucze camelCase, kolumny snake_case dzięki `casing: 'snake_case'`).
- Zmiana schematu → `pnpm db:generate` (nowy plik SQL w `apps/api/drizzle/`) → przejrzyj SQL → `pnpm db:migrate`.
- W serwisach: `@InjectDrizzle() private readonly db: Db` (typ `Db` z `src/db/index.ts`).
- `editor_events` jest partycjonowana po `ts` — `PARTITION BY RANGE` i partycja domyślna są dopisane ręcznie w `0000_init.sql`, bo drizzle-kit ich nie generuje. Z tego powodu nie używamy `drizzle-kit push`. Partycje dzienne dojdą jako job (albo pg_partman).
- Podgląd bazy: `pnpm db:studio`.

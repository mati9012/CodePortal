// Uruchamia migracje z katalogu drizzle/ (wygenerowane przez `pnpm db:generate`).
// Używane przez usługę `migrate` w docker-compose: node dist/db/migrate.js
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolve } from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const migrationsFolder =
  process.env.MIGRATIONS_DIR ?? resolve(import.meta.dirname, '../../drizzle');

const db = drizzle(url);
await migrate(db, { migrationsFolder });
await db.$client.end();
console.log(`Migrations applied from ${migrationsFolder}`);

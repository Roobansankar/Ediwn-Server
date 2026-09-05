// Plain Node.js script (no TypeORM) that adds the reviewRemarks column to
// daily_workers if it doesn't already exist. Mirrors the formal migration at
// src/migrations/1788500000000-AddDailyWorkerReviewRemarks.ts - use that as
// the record of intent; this is the actual way to apply it, since
// `bun run migration:run` currently fails in this environment with an
// unrelated ESM loader SyntaxError. Safe to run on every restart/deploy -
// ADD COLUMN IF NOT EXISTS is a no-op when the column is already there.
//
// Usage:
//   cd Edwin-Server
//   node scripts/add-daily-worker-review-remarks.mjs

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

const client = new pg.Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'edwin_erp',
});

async function main() {
  await client.connect();

  await client.query(
    `ALTER TABLE "daily_workers" ADD COLUMN IF NOT EXISTS "reviewRemarks" text`,
  );

  const check = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'daily_workers' AND column_name = 'reviewRemarks'`,
  );
  console.log('reviewRemarks column ready:', check.rows.length > 0);

  await client.end();
}

main().catch((err) => {
  console.error('Failed to add reviewRemarks column:', err);
  process.exit(1);
});

// Plain Node.js script (no TypeORM) that adds the projects.estimatedGst and
// projects.estimatedTotal columns if they don't already exist, then backfills
// existing rows as base + 18% GST. Safe to run on every restart/deploy —
// ADD COLUMN IF NOT EXISTS is a no-op when the column is already there.
//
// Usage:
//   cd Edwin-Server
//   node scripts/add-project-budget-gst.mjs

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
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "estimatedGst" numeric(14,2) NOT NULL DEFAULT 0`,
  );
  await client.query(
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "estimatedTotal" numeric(14,2) NOT NULL DEFAULT 0`,
  );
  await client.query(
    `UPDATE "projects"
     SET "estimatedGst" = ROUND("estimatedBudget" * 0.18, 2),
         "estimatedTotal" = ROUND("estimatedBudget" * 1.18, 2)
     WHERE "estimatedTotal" = 0 AND "estimatedBudget" > 0`,
  );

  const check = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name IN ('estimatedGst', 'estimatedTotal')`,
  );
  console.log('projects budget columns ready:', check.rows.map((r) => r.column_name).join(', '));

  await client.end();
}

main().catch((err) => {
  console.error('Failed to add projects budget GST columns:', err);
  process.exit(1);
});

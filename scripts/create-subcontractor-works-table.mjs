// Plain Node.js script (no TypeORM) that creates the subcontractor_works
// table if it doesn't already exist. Safe to run on every restart/deploy —
// CREATE TABLE IF NOT EXISTS is a no-op when the table is already there.
//
// Usage:
//   cd Edwin-Server
//   node scripts/create-subcontractor-works-table.mjs

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

  await client.query(`
    CREATE TABLE IF NOT EXISTS subcontractor_works (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "projectId" uuid NOT NULL,
      "subcontractorId" uuid NOT NULL,
      notes text,
      "photoUrls" text[],
      "photoKeys" text[],
      status varchar NOT NULL DEFAULT 'pending',
      "createdById" uuid NOT NULL,
      "respondedById" uuid,
      "respondedAt" date,
      "isDeleted" boolean NOT NULL DEFAULT false,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )
  `);

  const check = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'subcontractor_works' ORDER BY ordinal_position`,
  );
  console.log('subcontractor_works table ready. Columns:', check.rows.map((r) => r.column_name).join(', '));

  await client.end();
}

main().catch((err) => {
  console.error('Failed to create subcontractor_works table:', err);
  process.exit(1);
});

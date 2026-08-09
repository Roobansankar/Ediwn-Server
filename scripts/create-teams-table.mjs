// Plain Node.js script (no TypeORM) that creates the teams table and adds
// trades.teamId if they don't already exist. Safe to run on every
// restart/deploy — CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS are
// no-ops when already applied.
//
// Usage:
//   cd Edwin-Server
//   node scripts/create-teams-table.mjs

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
    CREATE TABLE IF NOT EXISTS "teams" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar NOT NULL UNIQUE,
      "isDeleted" boolean NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);

  await client.query(
    `ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "teamId" uuid`,
  );

  const teamsCheck = await client.query(
    `SELECT to_regclass('public.teams') AS exists`,
  );
  const tradesCheck = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'teamId'`,
  );
  console.log('teams table ready:', !!teamsCheck.rows[0].exists);
  console.log('trades.teamId ready:', tradesCheck.rows.length > 0);

  await client.end();
}

main().catch((err) => {
  console.error('Failed to create teams table / trades.teamId column:', err);
  process.exit(1);
});

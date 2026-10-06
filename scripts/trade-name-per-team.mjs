// Plain Node.js script (no TypeORM) that lets trade names repeat across teams:
// drops the unique constraint on trades.name and adds a unique index on
// (name, teamId). Mirrors the formal migration at
// src/migrations/1790200000000-TradeNamePerTeam.ts - use that as the record of
// intent; this is the actual way to apply it. Safe to run again: it only drops
// a single-column unique on "name" when one exists and creates the index with
// IF NOT EXISTS.
//
// Usage:
//   cd Edwin-Server
//   node scripts/trade-name-per-team.mjs

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

  // Drop the unique constraint on trades.name (whatever TypeORM named it).
  await client.query(`
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = con.conkey[1]
        WHERE rel.relname = 'trades' AND con.contype = 'u'
          AND array_length(con.conkey, 1) = 1 AND att.attname = 'name'
      LOOP
        EXECUTE format('ALTER TABLE "trades" DROP CONSTRAINT %I', r.conname);
      END LOOP;
    END $$;
  `);

  await client.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_trades_name_teamId" ON "trades" ("name", "teamId")`,
  );

  const check = await client.query(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'trades' AND indexname = 'IDX_trades_name_teamId'`,
  );
  console.log('trades name-per-team index ready:', check.rows.map((r) => r.indexname).join(', ') || 'missing');

  await client.end();
}

main().catch((err) => {
  console.error('Failed to update trades unique index:', err);
  process.exit(1);
});

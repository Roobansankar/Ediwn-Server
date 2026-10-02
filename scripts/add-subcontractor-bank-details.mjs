// Plain Node.js script (no TypeORM) that adds the subcontractors bank
// detail columns (bankName, accountHolderName, accountNumber, ifscCode,
// branch) if they don't already exist - mirrors what vendors already have.
// Mirrors the formal migration at
// src/migrations/1789900000000-AddSubcontractorBankDetails.ts - use that as
// the record of intent; this is the actual way to apply it, since
// `bun run migration:run` currently fails in this environment with an
// unrelated ESM loader SyntaxError. Safe to run on every restart/deploy -
// ADD COLUMN IF NOT EXISTS is a no-op when the column is already there.
//
// Usage:
//   cd Edwin-Server
//   node scripts/add-subcontractor-bank-details.mjs

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

  await client.query(`ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "bankName" character varying`);
  await client.query(`ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "accountHolderName" character varying`);
  await client.query(`ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "accountNumber" character varying`);
  await client.query(`ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "ifscCode" character varying`);
  await client.query(`ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "branch" character varying`);

  const check = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'subcontractors' AND column_name IN ('bankName', 'accountHolderName', 'accountNumber', 'ifscCode', 'branch')`,
  );
  console.log('subcontractors bank columns ready:', check.rows.map((r) => r.column_name).join(', '));

  await client.end();
}

main().catch((err) => {
  console.error('Failed to add subcontractors bank detail columns:', err);
  process.exit(1);
});

// Plain Node.js script (no TypeORM) that creates the labour_payments table
// and adds the labourPaymentId column to daily_workers, if they don't
// already exist. Mirrors the formal migration at
// src/migrations/1788800000000-CreateLabourPayments.ts - use that as the
// record of intent; this is the actual way to apply it, since
// `bun run migration:run` currently fails in this environment with an
// unrelated ESM loader SyntaxError. Safe to run on every restart/deploy -
// every statement is IF NOT EXISTS, a no-op once already applied.
//
// Usage:
//   cd Edwin-Server
//   node scripts/create-labour-payments.mjs

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

  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS "labour_payments" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "userId" uuid NOT NULL,
      "userName" varchar NOT NULL,
      "weekStart" date NOT NULL,
      "weekEnd" date NOT NULL,
      "amount" numeric(12,2) NOT NULL,
      "paymentDate" date NOT NULL,
      "status" varchar NOT NULL DEFAULT 'pending',
      "notes" text,
      "createdById" uuid,
      "isDeleted" boolean NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_labour_payments" PRIMARY KEY ("id")
    )
  `);

  await client.query(
    `ALTER TABLE "daily_workers" ADD COLUMN IF NOT EXISTS "labourPaymentId" uuid`,
  );

  const check = await client.query(`
    SELECT
      (SELECT to_regclass('public.labour_payments') IS NOT NULL) AS table_ready,
      (SELECT count(*) FROM information_schema.columns
       WHERE table_name = 'daily_workers' AND column_name = 'labourPaymentId') AS column_ready
  `);
  console.log('labour_payments table ready:', check.rows[0].table_ready);
  console.log('daily_workers.labourPaymentId column ready:', Number(check.rows[0].column_ready) > 0);

  await client.end();
}

main().catch((err) => {
  console.error('Failed to create labour_payments:', err);
  process.exit(1);
});

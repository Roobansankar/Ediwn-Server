// Plain Node.js script (no TypeORM) that creates the subcontractor_bills
// table and adds payments.subcontractorBillId, if they don't already exist.
// Mirrors the formal migration at
// src/migrations/1789700000000-CreateSubcontractorBills.ts - use that as the
// record of intent; this is the actual way to apply it, since
// `bun run migration:run` currently fails in this environment with an
// unrelated ESM loader SyntaxError. Safe to run on every restart/deploy -
// CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS are no-ops once
// already applied.
//
// Usage:
//   cd Edwin-Server
//   node scripts/create-subcontractor-bills.mjs

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
    CREATE TABLE IF NOT EXISTS "subcontractor_bills" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "billNumber" varchar NOT NULL,
      "subcontractorId" uuid NOT NULL,
      "subcontractWorkOrderId" uuid,
      "projectId" uuid,
      "amount" numeric(12,2) NOT NULL DEFAULT 0,
      "gstPercent" numeric(5,2),
      "gstAmount" numeric(12,2),
      "status" varchar(50) NOT NULL DEFAULT 'pending',
      "paidAmount" numeric(12,2) NOT NULL DEFAULT 0,
      "billDate" date,
      "dueDate" date,
      "billFileUrl" varchar,
      "billFileKey" varchar,
      "notes" text,
      "paidAt" TIMESTAMP,
      "isDeleted" boolean NOT NULL DEFAULT false,
      "createdBy" uuid,
      "updatedBy" uuid,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_subcontractor_bills" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_subcontractor_bills_billNumber" UNIQUE ("billNumber")
    )
  `);
  await client.query(
    `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "subcontractorBillId" uuid`,
  );

  const check = await client.query(
    `SELECT to_regclass('public.subcontractor_bills') IS NOT NULL AS table_ready`,
  );
  const checkCol = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'payments' AND column_name = 'subcontractorBillId'`,
  );
  console.log('subcontractor_bills table ready:', check.rows[0].table_ready);
  console.log('payments.subcontractorBillId column ready:', checkCol.rows.length > 0);

  await client.end();
}

main().catch((err) => {
  console.error('Failed to create subcontractor_bills table:', err);
  process.exit(1);
});

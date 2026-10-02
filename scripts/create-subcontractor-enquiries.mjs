// Plain Node.js script (no TypeORM) that creates the subcontractor_enquiries
// table if it doesn't already exist. Mirrors the formal migration at
// src/migrations/1789800000000-CreateSubcontractorEnquiries.ts - use that as
// the record of intent; this is the actual way to apply it, since
// `bun run migration:run` currently fails in this environment with an
// unrelated ESM loader SyntaxError. Safe to run on every restart/deploy -
// CREATE TABLE IF NOT EXISTS / ADD CONSTRAINT guarded with a DO block is a
// no-op when already there.
//
// Usage:
//   cd Edwin-Server
//   node scripts/create-subcontractor-enquiries.mjs

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
    CREATE TABLE IF NOT EXISTS "subcontractor_enquiries" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "groupId" character varying NOT NULL,
      "scrNo" character varying NOT NULL,
      "projectId" uuid NOT NULL,
      "workCategoryId" uuid NOT NULL,
      "subcontractorId" uuid NOT NULL,
      "scopeOfWork" text,
      "totalAmount" numeric(12,2),
      "gstPercent" numeric(5,2),
      "gstAmount" numeric(12,2),
      "totalWithGst" numeric(12,2),
      "quotationUrl" character varying,
      "quotationKey" character varying,
      "startDate" date,
      "endDate" date,
      "status" character varying(50) NOT NULL DEFAULT 'pending',
      "isDeleted" boolean NOT NULL DEFAULT false,
      "createdBy" character varying,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_subcontractor_enquiries" PRIMARY KEY ("id")
    )
  `);

  // Add FKs guarded so re-running the script after the table already
  // exists (but was created by an earlier, slightly different run) doesn't
  // error out on a duplicate constraint.
  const fks = [
    { name: 'FK_subcontractor_enquiries_project', sql: `ALTER TABLE "subcontractor_enquiries" ADD CONSTRAINT "FK_subcontractor_enquiries_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION` },
    { name: 'FK_subcontractor_enquiries_work_category', sql: `ALTER TABLE "subcontractor_enquiries" ADD CONSTRAINT "FK_subcontractor_enquiries_work_category" FOREIGN KEY ("workCategoryId") REFERENCES "work_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION` },
    { name: 'FK_subcontractor_enquiries_subcontractor', sql: `ALTER TABLE "subcontractor_enquiries" ADD CONSTRAINT "FK_subcontractor_enquiries_subcontractor" FOREIGN KEY ("subcontractorId") REFERENCES "subcontractors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION` },
  ];
  for (const fk of fks) {
    const exists = await client.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = $1`,
      [fk.name],
    );
    if (exists.rows.length === 0) {
      await client.query(fk.sql);
    }
  }

  const check = await client.query(
    `SELECT to_regclass('public.subcontractor_enquiries') AS exists`,
  );
  console.log('subcontractor_enquiries table ready:', !!check.rows[0]?.exists);

  await client.end();
}

main().catch((err) => {
  console.error('Failed to create subcontractor_enquiries table:', err);
  process.exit(1);
});

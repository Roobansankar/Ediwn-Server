// Plain Node.js script (no TypeORM) that adds subcontractor_payment_requests.approvedAmount if it
// doesn't already exist. Mirrors the formal migration at
// src/migrations/1790700000000-AddSubcontractorPaymentRequestApprovedAmount.ts - use that as the
// record of intent; this is the actual way to apply it. Safe to run again.
//
// Usage:
//   cd Edwin-Server
//   node scripts/add-subcontractor-payment-request-approved-amount.mjs

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
  await client.query(`ALTER TABLE "subcontractor_payment_requests" ADD COLUMN IF NOT EXISTS "approvedAmount" numeric(12,2)`);
  const check = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'subcontractor_payment_requests' AND column_name = 'approvedAmount'`,
  );
  console.log('subcontractor_payment_requests.approvedAmount ready:', check.rows.length === 1 ? 'yes' : 'missing');
  await client.end();
}

main().catch((err) => {
  console.error('Failed to add subcontractor_payment_requests.approvedAmount:', err);
  process.exit(1);
});

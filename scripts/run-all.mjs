// Runs every standalone migration script in this folder, one by one, in
// filename order. Each script is idempotent (ADD COLUMN IF NOT EXISTS /
// CREATE TABLE IF NOT EXISTS), so running all of them - even ones already
// applied - is always safe. This is the "just run everything" command for
// whenever new scripts land after a `git pull`.
//
// Usage:
//   cd Edwin-Server
//   node scripts/run-all.mjs
//   (or: bun run migrate:scripts)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith('.mjs') && f !== 'run-all.mjs')
  .sort();

console.log(`Running ${files.length} migration script(s)...\n`);

for (const file of files) {
  console.log(`--- ${file} ---`);
  execFileSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
}

console.log('\nAll migration scripts applied.');

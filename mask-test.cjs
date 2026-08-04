const fs = require('fs');
const envFile = fs.readFileSync(__dirname + '/.env', 'utf8');
const env = {};
for (const line of envFile.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const { Client } = require('pg');
const c = new Client({
  host: env.DATABASE_HOST || 'localhost',
  port: Number(env.DATABASE_PORT || 5432),
  user: env.DATABASE_USERNAME,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME || 'edwin_erp',
});
(async () => {
  await c.connect();
  // find a submitted timesheet + its rows (not deleted)
  const r = await c.query(
    `SELECT t.id, t.status FROM weekly_timesheets t
     WHERE t.status = 'submitted' AND t."isDeleted" = false
     ORDER BY t."updatedAt" DESC LIMIT 1`,
  );
  if (r.rows.length === 0) {
    console.log('no submitted timesheet found');
    process.exit(0);
  }
  const tsId = r.rows[0].id;
  const rows = await c.query('SELECT id, "submittedMask", "monHours" FROM timesheet_rows WHERE "timesheetId" = $1', [tsId]);
  console.log('BEFORE:', rows.rows.map((x) => ({ id: x.id, mask: x.submittedMask })));
  await c.query('UPDATE timesheet_rows SET "submittedMask" = 0 WHERE "timesheetId" = $1', [tsId]);
  const after = await c.query('SELECT "submittedMask" FROM timesheet_rows WHERE "timesheetId" = $1', [tsId]);
  console.log('AFTER plain UPDATE:', after.rows.map((x) => x.submittedMask));
  // restore to original via TypeORM-style: we just demonstrate
  await c.end();
})();

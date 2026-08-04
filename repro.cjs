const fs = require('fs');
const envFile = fs.readFileSync(__dirname + '/.env', 'utf8');
const env = {};
for (const line of envFile.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const engineerId = '1708b5f5-fda9-456d-a5dc-7590d9cc7831';
const adminId = 'a2d7319b-0000-0000-0000-000000000000'; // placeholder
const projectId = '23516e37-61a9-441f-ac0b-0ca355557e57';
const base = 'http://localhost:8000/api/v1';

const adminRow = null;

function tokenFor(email, role, sub) {
  return jwt.sign({ sub, email, role }, env.JWT_SECRET, { expiresIn: '1h' });
}

async function req(token, method, url, body) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const res = await fetch(base + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  console.log(method, url, '->', res.status, text.slice(0, 200));
  return { status: res.status, text };
}

(async () => {
  // get admin id
  const { Client } = require('pg');
  const c = new Client({
    host: env.DATABASE_HOST || 'localhost',
    port: Number(env.DATABASE_PORT || 5432),
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME || 'edwin_erp',
  });
  await c.connect();
  const wk = '2026-08-24';
  await c.query('UPDATE weekly_timesheets SET "isDeleted" = true WHERE "siteEngineerId" = $1 AND "weekStart"::date = $2', [engineerId, wk]);
  const admin = await c.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  const adminIdReal = admin.rows[0].id;
  const engTok = tokenFor('ram@gmail.com', 'site_engineer', engineerId);
  const adminTok = tokenFor('admin@edwinconstructions.com', 'admin', adminIdReal);

  // create + submit timesheet
  const a = await req(engTok, 'POST', '/timesheet-attendance', {
    weekStart: wk,
    rows: [{ projectId, entryType: 'project', monHours: 4, tueHours: 0, wedHours: 0, thuHours: 0, friHours: 0, satHours: 0, sunHours: 0 }],
  });
  const tsId = JSON.parse(a.text).id;
  await req(engTok, 'PATCH', `/timesheet-attendance/${tsId}/submit`);
  // create query
  await req(engTok, 'POST', '/employee-queries', { timesheetId: tsId, reason: 'Entered wrong hours on Monday' });
  // duplicate should 409
  await req(engTok, 'POST', '/employee-queries', { timesheetId: tsId, reason: 'Duplicate request' });
  // list as admin
  const list = await req(adminTok, 'GET', '/employee-queries?status=pending');
  const queries = JSON.parse(list.text);
  console.log('QUERY COUNT:', queries.length, 'first:', queries[0] && queries[0].siteEngineer && queries[0].siteEngineer.name, queries[0] && queries[0].reason);
  // respond approve
  await req(adminTok, 'PATCH', `/employee-queries/${queries[0].id}/respond`, { action: 'approved' });
  const g = await req(engTok, 'GET', `/timesheet-attendance/current?weekStart=${wk}`);
  const ts = JSON.parse(g.text);
  console.log('AFTER APPROVE -> status:', ts.status, 'mask:', ts.rows[0] && ts.rows[0].submittedMask);
  const dbRow = await c.query('SELECT "submittedMask" FROM timesheet_rows WHERE "timesheetId" = $1', [tsId]);
  console.log('DB MASK:', dbRow.rows[0] && dbRow.rows[0].submittedMask);
  // cleanup
  await c.query('UPDATE weekly_timesheets SET "isDeleted" = true WHERE id = $1', [tsId]);
  await c.query('UPDATE employee_queries SET "isDeleted" = true WHERE "timesheetId" = $1', [tsId]);
  await c.end();
  console.log('cleanup done');
})();

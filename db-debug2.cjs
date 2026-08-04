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
const q = `SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE (table_name='weekly_timesheets' AND column_name='id')
     OR (table_name='users' AND column_name='id')
     OR (table_name='timesheet_rows' AND column_name IN ('timesheetId','projectId'))
     OR (table_name='attendance_records' AND column_name IN ('siteEngineerId','projectId'))
  ORDER BY table_name, column_name`;
c.connect()
  .then(() => c.query(q))
  .then((r) => {
    r.rows.forEach((x) => console.log(`${x.table_name}.${x.column_name} = ${x.data_type}`));
    return c.end();
  });

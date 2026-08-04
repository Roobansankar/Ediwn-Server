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
c.connect()
  .then(() => c.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'employee_queries' ORDER BY ordinal_position"))
  .then((r) => {
    r.rows.forEach((x) => console.log(`${x.column_name} | ${x.data_type} | null=${x.is_nullable} | def=${x.column_default}`));
    return c.end();
  })
  .catch((e) => {
    console.error('ERR', e.message);
    process.exit(1);
  });

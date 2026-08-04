import 'dotenv/config';
import { DataSource } from 'typeorm';

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'edwin_erp',
  entities: ['dist/**/*.entity.js'],
  logging: ['query'],
});

await ds.initialize();

const rowRepo = ds.getRepository('TimesheetRow');
const ts = await ds.query(
  `SELECT id FROM weekly_timesheets WHERE status='submitted' AND "isDeleted"=false ORDER BY "updatedAt" DESC LIMIT 1`,
);
if (!ts.length) {
  console.log('no submitted timesheet');
  process.exit(0);
}
const rows = await rowRepo.find({ where: { timesheetId: ts[0].id } });
console.log('ROWS BEFORE:', rows.map((r) => ({ id: r.id, mask: r.submittedMask })));
for (const row of rows) row.submittedMask = 0;
const saved = await rowRepo.save(rows);
console.log('SAVED:', saved.map((r) => ({ id: r.id, mask: r.submittedMask })));
const check = await ds.query(
  `SELECT "submittedMask" FROM timesheet_rows WHERE "timesheetId"=$1`,
  [ts[0].id],
);
console.log('DB AFTER:', check.map((r) => r.submittedMask));
await ds.destroy();

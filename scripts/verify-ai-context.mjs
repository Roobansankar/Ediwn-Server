// Build first, then run: node --env-file=.env scripts/verify-ai-context.mjs
// Reads only. Prints check results without business records or credentials.
import assert from 'node:assert/strict';
import { DataSource } from 'typeorm';
import { ErpContextService } from '../dist/ai-chats/erp-context.service.js';

const database = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'edwin_erp',
  entities: ['dist/**/*.entity.js'],
  extra: { connectionTimeoutMillis: 5000 },
});

try {
  await database.initialize();
  const service = new ErpContextService(database);
  const domains = ['projects', 'expenses', 'cashflow', 'purchases', 'accounts', 'subcontracts'];
  const result = await service.context({ domains });
  assert.equal(result.reports.length, 10);
  for (const report of result.reports) {
    assert.ok(report.recentRecords.length <= 12);
    assert.ok(report.byProject.length <= 20);
  }
  const [expectedCashflow] = await database.query(`
    SELECT COALESCE(SUM(CASE WHEN p."paymentType" = 'revenue' THEN p.amount ELSE -p.amount END), 0)::text AS net
    FROM payments p LEFT JOIN expenses e ON e.id = p."expenseId"
    WHERE p."isDeleted" = false AND (e."isDeleted" = false OR e."isDeleted" IS NULL)
      AND (e.status = 'approved' OR e.status IS NULL)
  `);
  assert.equal(Number(result.reports.find((report) => report.source === 'payments').totals.netCashflow), Number(expectedCashflow.net));
  const zero = await service.context({ domains, dateFrom: '2999-01-01', dateTo: '2999-12-31' });
  assert.ok(zero.reports.every((report) => report.totals.count === 0));
  const escaped = await service.context({ domains, search: "%' OR 1=1 --" });
  assert.ok(escaped.reports.every((report) => report.totals.count === 0));
  const catalog = await service.catalog();
  const pending = await service.context({ domains: ['purchases'], purchaseOrderView: 'pending' });
  assert.equal(pending.reports.length, 1);
  assert.ok(pending.reports[0].byStatus.every((group) => group.status === 'pending'));
  const outstanding = await service.context({ domains: ['purchases'], purchaseOrderView: 'outstanding' });
  assert.equal(outstanding.reports.length, 1);
  assert.ok(outstanding.reports[0].recentRecords.every((row) => Number(row.outstandingAgainstOrdersAllTime) > 0));
  const [outstandingTotal] = await database.query(`
    SELECT COALESCE(SUM(GREATEST(COALESCE(NULLIF(po."totalWithGst", 0), po."totalAmount", 0) -
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p."purchaseOrderId" = po.id AND p."isDeleted" = false), 0)), 0)::text AS total
    FROM purchase_orders po WHERE po."isDeleted" = false
  `);
  assert.equal(Number(outstanding.reports[0].totals.outstandingAgainstOrdersAllTime), Number(outstandingTotal.total));
  if (catalog.projects.length) {
    const scoped = await service.context({ domains, projectId: catalog.projects[0].id });
    assert.equal(scoped.reports.find((report) => report.source === 'projects').totals.count, 1);
  }
  console.log('Passed: 10 datasets, bounded records, ledger aggregate, date filters, escaped search, and project scoping.');
} finally {
  if (database.isInitialized) await database.destroy();
}

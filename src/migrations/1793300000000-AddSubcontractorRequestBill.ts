import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddSubcontractorRequestBill1793300000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "subcontractor_payment_requests" ADD COLUMN IF NOT EXISTS "subcontractorBillId" uuid`,
    );
    await runner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_subcontractor_requests_bill" ON "subcontractor_payment_requests" ("subcontractorBillId")`,
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `DROP INDEX IF EXISTS "IDX_subcontractor_requests_bill"`,
    );
    await runner.query(
      `ALTER TABLE "subcontractor_payment_requests" DROP COLUMN IF EXISTS "subcontractorBillId"`,
    );
  }
}

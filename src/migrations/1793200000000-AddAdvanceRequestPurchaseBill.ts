import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddAdvanceRequestPurchaseBill1793200000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "advance_requests" ADD COLUMN IF NOT EXISTS "purchaseBillId" uuid`,
    );
    await runner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_advance_requests_purchaseBillId" ON "advance_requests" ("purchaseBillId")`,
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `DROP INDEX IF EXISTS "IDX_advance_requests_purchaseBillId"`,
    );
    await runner.query(
      `ALTER TABLE "advance_requests" DROP COLUMN IF EXISTS "purchaseBillId"`,
    );
  }
}

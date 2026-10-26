import { MigrationInterface, QueryRunner } from 'typeorm';
export class LabourPaymentHistory1793000000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "labour_payments" ADD COLUMN IF NOT EXISTS "paymentHistory" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "labour_payments" DROP COLUMN IF EXISTS "paymentHistory"`,
    );
  }
}

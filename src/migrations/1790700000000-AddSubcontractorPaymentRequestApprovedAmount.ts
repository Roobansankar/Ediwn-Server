import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubcontractorPaymentRequestApprovedAmount1790700000000 implements MigrationInterface {
  name = 'AddSubcontractorPaymentRequestApprovedAmount1790700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subcontractor_payment_requests" ADD COLUMN IF NOT EXISTS "approvedAmount" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subcontractor_payment_requests" DROP COLUMN IF EXISTS "approvedAmount"`);
  }
}

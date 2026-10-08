import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorPaymentTerms1790300000000 implements MigrationInterface {
  name = 'AddVendorPaymentTerms1790300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "paymentTerms" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "paymentTerms"`);
  }
}

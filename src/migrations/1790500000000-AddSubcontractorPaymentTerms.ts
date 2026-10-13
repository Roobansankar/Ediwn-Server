import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubcontractorPaymentTerms1790500000000 implements MigrationInterface {
  name = 'AddSubcontractorPaymentTerms1790500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "paymentTerms" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subcontractors" DROP COLUMN IF EXISTS "paymentTerms"`);
  }
}

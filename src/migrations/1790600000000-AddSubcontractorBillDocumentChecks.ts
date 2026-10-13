import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubcontractorBillDocumentChecks1790600000000 implements MigrationInterface {
  name = 'AddSubcontractorBillDocumentChecks1790600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subcontractor_bills" ADD COLUMN IF NOT EXISTS "enquiryChecked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcontractor_bills" ADD COLUMN IF NOT EXISTS "woChecked" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subcontractor_bills" DROP COLUMN IF EXISTS "woChecked"`);
    await queryRunner.query(`ALTER TABLE "subcontractor_bills" DROP COLUMN IF EXISTS "enquiryChecked"`);
  }
}

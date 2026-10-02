import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubcontractorBankDetails1789900000000
  implements MigrationInterface
{
  name = 'AddSubcontractorBankDetails1789900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "bankName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "accountHolderName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "accountNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "ifscCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcontractors" ADD COLUMN IF NOT EXISTS "branch" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subcontractors" DROP COLUMN IF EXISTS "branch"`);
    await queryRunner.query(`ALTER TABLE "subcontractors" DROP COLUMN IF EXISTS "ifscCode"`);
    await queryRunner.query(`ALTER TABLE "subcontractors" DROP COLUMN IF EXISTS "accountNumber"`);
    await queryRunner.query(`ALTER TABLE "subcontractors" DROP COLUMN IF EXISTS "accountHolderName"`);
    await queryRunner.query(`ALTER TABLE "subcontractors" DROP COLUMN IF EXISTS "bankName"`);
  }
}

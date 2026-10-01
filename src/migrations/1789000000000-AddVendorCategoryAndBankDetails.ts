import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorCategoryAndBankDetails1789000000000
  implements MigrationInterface
{
  name = 'AddVendorCategoryAndBankDetails1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "category" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "bankName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "accountHolderName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "accountNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "ifscCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "branch" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendors" DROP COLUMN IF EXISTS "branch"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" DROP COLUMN IF EXISTS "ifscCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" DROP COLUMN IF EXISTS "accountNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" DROP COLUMN IF EXISTS "accountHolderName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" DROP COLUMN IF EXISTS "bankName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendors" DROP COLUMN IF EXISTS "category"`,
    );
  }
}

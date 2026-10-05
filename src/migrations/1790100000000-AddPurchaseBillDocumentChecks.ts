import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurchaseBillDocumentChecks1790100000000
  implements MigrationInterface
{
  name = 'AddPurchaseBillDocumentChecks1790100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_bills" ADD COLUMN IF NOT EXISTS "mrrChecked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_bills" ADD COLUMN IF NOT EXISTS "enquiryChecked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_bills" ADD COLUMN IF NOT EXISTS "poChecked" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "purchase_bills" DROP COLUMN IF EXISTS "poChecked"`);
    await queryRunner.query(`ALTER TABLE "purchase_bills" DROP COLUMN IF EXISTS "enquiryChecked"`);
    await queryRunner.query(`ALTER TABLE "purchase_bills" DROP COLUMN IF EXISTS "mrrChecked"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurchaseBillGst1780000900000 implements MigrationInterface {
  name = 'AddPurchaseBillGst1780000900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_bills" ADD "gstPercent" numeric(5,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_bills" ADD "gstAmount" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_bills" DROP COLUMN "gstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_bills" DROP COLUMN "gstPercent"`,
    );
  }
}

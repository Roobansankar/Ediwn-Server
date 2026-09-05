import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransportAmount1788400000000 implements MigrationInterface {
  name = 'AddTransportAmount1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "transportAmount" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ADD COLUMN IF NOT EXISTS "transportAmount" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" DROP COLUMN IF EXISTS "transportAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "transportAmount"`,
    );
  }
}

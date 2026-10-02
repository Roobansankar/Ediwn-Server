import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurchaseOrderRemarks1789500000000
  implements MigrationInterface
{
  name = 'AddPurchaseOrderRemarks1789500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "remarks" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "remarks"`,
    );
  }
}

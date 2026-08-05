import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPurchaseOrderPaymentTerms1787300000000
  implements MigrationInterface
{
  name = 'DropPurchaseOrderPaymentTerms1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "paymentTerms"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "paymentTerms" text`,
    );
  }
}

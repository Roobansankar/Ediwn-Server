import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentPurchaseOrderId1787400000000
  implements MigrationInterface
{
  name = 'AddPaymentPurchaseOrderId1787400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "purchaseOrderId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "purchaseOrderId"`,
    );
  }
}

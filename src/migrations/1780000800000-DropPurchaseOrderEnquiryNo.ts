import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPurchaseOrderEnquiryNo1780000800000
  implements MigrationInterface
{
  name = 'DropPurchaseOrderEnquiryNo1780000800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "enquiryNo"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "enquiryNo" character varying`,
    );
  }
}

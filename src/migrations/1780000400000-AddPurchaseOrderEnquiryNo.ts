import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurchaseOrderEnquiryNo1780000400000
  implements MigrationInterface
{
  name = 'AddPurchaseOrderEnquiryNo1780000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "enquiryNo" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "enquiryNo"`,
    );
  }
}

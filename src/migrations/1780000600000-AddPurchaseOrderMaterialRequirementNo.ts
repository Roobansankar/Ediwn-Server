import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurchaseOrderMaterialRequirementNo1780000600000
  implements MigrationInterface
{
  name = 'AddPurchaseOrderMaterialRequirementNo1780000600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "materialRequirementNo" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "materialRequirementNo"`,
    );
  }
}

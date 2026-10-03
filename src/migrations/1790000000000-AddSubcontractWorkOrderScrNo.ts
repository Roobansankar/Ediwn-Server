import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubcontractWorkOrderScrNo1790000000000
  implements MigrationInterface
{
  name = 'AddSubcontractWorkOrderScrNo1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subcontract_work_orders" ADD COLUMN IF NOT EXISTS "scrNo" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subcontract_work_orders" DROP COLUMN IF EXISTS "scrNo"`,
    );
  }
}

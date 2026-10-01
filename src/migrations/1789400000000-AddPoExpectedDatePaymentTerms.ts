import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPoExpectedDatePaymentTerms1789400000000
  implements MigrationInterface
{
  name = 'AddPoExpectedDatePaymentTerms1789400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "expectedDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "paymentTerms" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "paymentTerms"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "expectedDate"`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuotationExpectedDatePaymentTerms1789300000000
  implements MigrationInterface
{
  name = 'AddQuotationExpectedDatePaymentTerms1789300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ADD COLUMN IF NOT EXISTS "expectedDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ADD COLUMN IF NOT EXISTS "paymentTerms" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" DROP COLUMN IF EXISTS "paymentTerms"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" DROP COLUMN IF EXISTS "expectedDate"`,
    );
  }
}

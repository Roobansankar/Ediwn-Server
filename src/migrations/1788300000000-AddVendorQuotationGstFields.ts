import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorQuotationGstFields1788300000000
  implements MigrationInterface
{
  name = 'AddVendorQuotationGstFields1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ADD COLUMN IF NOT EXISTS "gstPercent" numeric(5,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ADD COLUMN IF NOT EXISTS "gstAmount" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ADD COLUMN IF NOT EXISTS "totalWithGst" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" DROP COLUMN IF EXISTS "totalWithGst"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" DROP COLUMN IF EXISTS "gstAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" DROP COLUMN IF EXISTS "gstPercent"`,
    );
  }
}

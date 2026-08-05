import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorQuotationTotalAmount1787500000000
  implements MigrationInterface
{
  name = 'AddVendorQuotationTotalAmount1787500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ADD "totalAmount" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" DROP COLUMN "totalAmount"`,
    );
  }
}

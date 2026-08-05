import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdvanceRequestVendorQuotationId1787600000000
  implements MigrationInterface
{
  name = 'AddAdvanceRequestVendorQuotationId1787600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "advance_requests" ADD "vendorQuotationId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "advance_requests" DROP COLUMN "vendorQuotationId"`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameVendorQuotationEnquiryNoToGroupId1780000700000
  implements MigrationInterface
{
  name = 'RenameVendorQuotationEnquiryNoToGroupId1780000700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ADD "groupId" uuid`,
    );
    // Rows that were submitted together previously shared the same enquiryNo —
    // preserve that grouping under a generated groupId instead of a visible number.
    await queryRunner.query(`
      UPDATE "vendor_quotations" vq
      SET "groupId" = sub.gid
      FROM (
        SELECT "enquiryNo", uuid_generate_v4() AS gid
        FROM "vendor_quotations"
        GROUP BY "enquiryNo"
      ) sub
      WHERE vq."enquiryNo" = sub."enquiryNo"
    `);
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ALTER COLUMN "groupId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" DROP COLUMN "enquiryNo"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ADD "enquiryNo" character varying`,
    );
    await queryRunner.query(
      `UPDATE "vendor_quotations" SET "enquiryNo" = "groupId"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" ALTER COLUMN "enquiryNo" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vendor_quotations" DROP COLUMN "groupId"`,
    );
  }
}

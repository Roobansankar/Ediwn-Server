import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnquiryExpectedDatePaymentTerms1789200000000
  implements MigrationInterface
{
  name = 'AddEnquiryExpectedDatePaymentTerms1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material_requirements" ADD COLUMN IF NOT EXISTS "expectedDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_requirements" ADD COLUMN IF NOT EXISTS "paymentTerms" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material_requirements" DROP COLUMN IF EXISTS "paymentTerms"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_requirements" DROP COLUMN IF EXISTS "expectedDate"`,
    );
  }
}

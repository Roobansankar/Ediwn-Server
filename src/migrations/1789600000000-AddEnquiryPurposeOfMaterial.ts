import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnquiryPurposeOfMaterial1789600000000
  implements MigrationInterface
{
  name = 'AddEnquiryPurposeOfMaterial1789600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material_requirements" ADD COLUMN IF NOT EXISTS "purposeOfMaterial" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material_requirements" DROP COLUMN IF EXISTS "purposeOfMaterial"`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterialReceivedDamageRemarks1789700000000
  implements MigrationInterface
{
  name = 'AddMaterialReceivedDamageRemarks1789700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material_received" ADD COLUMN IF NOT EXISTS "damageRemarks" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material_received" DROP COLUMN IF EXISTS "damageRemarks"`,
    );
  }
}

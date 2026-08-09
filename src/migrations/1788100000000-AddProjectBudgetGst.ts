import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectBudgetGst1788100000000 implements MigrationInterface {
  name = 'AddProjectBudgetGst1788100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "estimatedGst" numeric(14,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "estimatedTotal" numeric(14,2) NOT NULL DEFAULT 0`,
    );
    // Backfill existing rows: total = base + 18% GST, unless already set.
    await queryRunner.query(
      `UPDATE "projects"
       SET "estimatedGst" = ROUND("estimatedBudget" * 0.18, 2),
           "estimatedTotal" = ROUND("estimatedBudget" * 1.18, 2)
       WHERE "estimatedTotal" = 0 AND "estimatedBudget" > 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "estimatedTotal"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "estimatedGst"`);
  }
}

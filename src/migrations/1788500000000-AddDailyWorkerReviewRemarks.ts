import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDailyWorkerReviewRemarks1788500000000
  implements MigrationInterface
{
  name = 'AddDailyWorkerReviewRemarks1788500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_workers" ADD COLUMN IF NOT EXISTS "reviewRemarks" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_workers" DROP COLUMN IF EXISTS "reviewRemarks"`,
    );
  }
}

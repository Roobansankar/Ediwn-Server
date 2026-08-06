import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDailyWorkerShiftAmount1788000000000
  implements MigrationInterface
{
  name = 'AddDailyWorkerShiftAmount1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_workers" ADD "shiftAmount" numeric(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_workers" DROP COLUMN "shiftAmount"`,
    );
  }
}

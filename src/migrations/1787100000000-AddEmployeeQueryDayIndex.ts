import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeQueryDayIndex1787100000000
  implements MigrationInterface
{
  name = 'AddEmployeeQueryDayIndex1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_queries" ADD "dayIndex" smallint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_queries" DROP COLUMN "dayIndex"`,
    );
  }
}

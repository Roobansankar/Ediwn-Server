import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterEmployeeQueriesColumnTypes1780000100001
  implements MigrationInterface
{
  name = 'AlterEmployeeQueriesColumnTypes1780000100001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_queries" ALTER COLUMN "timesheetId" TYPE uuid USING "timesheetId"::uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_queries" ALTER COLUMN "siteEngineerId" TYPE uuid USING "siteEngineerId"::uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_queries" ALTER COLUMN "siteEngineerId" TYPE varchar USING "siteEngineerId"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_queries" ALTER COLUMN "timesheetId" TYPE varchar USING "timesheetId"::text`,
    );
  }
}

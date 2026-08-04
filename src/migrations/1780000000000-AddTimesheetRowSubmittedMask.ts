import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTimesheetRowSubmittedMask1780000000000
  implements MigrationInterface
{
  name = 'AddTimesheetRowSubmittedMask1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'timesheet_rows',
      new TableColumn({
        name: 'submittedMask',
        type: 'int',
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('timesheet_rows', 'submittedMask');
  }
}

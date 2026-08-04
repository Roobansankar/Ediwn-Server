import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddEmployeeQueries1780000100000 implements MigrationInterface {
  name = 'AddEmployeeQueries1780000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'employee_queries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'timesheetId',
            type: 'varchar',
          },
          {
            name: 'siteEngineerId',
            type: 'varchar',
          },
          {
            name: 'reason',
            type: 'text',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'respondedById',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'respondedAt',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'isDeleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('employee_queries');
  }
}

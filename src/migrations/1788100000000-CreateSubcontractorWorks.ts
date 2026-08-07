import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSubcontractorWorks1788100000000
  implements MigrationInterface
{
  name = 'CreateSubcontractorWorks1788100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'subcontractor_works',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'projectId',
            type: 'uuid',
          },
          {
            name: 'subcontractorId',
            type: 'uuid',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'photoUrls',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'photoKeys',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'createdById',
            type: 'uuid',
          },
          {
            name: 'respondedById',
            type: 'uuid',
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
    await queryRunner.dropTable('subcontractor_works');
  }
}

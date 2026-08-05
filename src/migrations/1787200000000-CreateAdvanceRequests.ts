import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAdvanceRequests1787200000000 implements MigrationInterface {
  name = 'CreateAdvanceRequests1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'advance_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'vendorId',
            type: 'uuid',
          },
          {
            name: 'projectId',
            type: 'uuid',
          },
          {
            name: 'materialRequirementNo',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'requestedById',
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
    await queryRunner.dropTable('advance_requests');
  }
}

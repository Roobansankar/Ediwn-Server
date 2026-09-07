import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpenseRejectionReason1788700000000
  implements MigrationInterface
{
  name = 'AddExpenseRejectionReason1788700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "rejectionReason" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP COLUMN IF EXISTS "rejectionReason"`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdvanceRequestApprovedAmount1790400000000 implements MigrationInterface {
  name = 'AddAdvanceRequestApprovedAmount1790400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "advance_requests" ADD COLUMN IF NOT EXISTS "approvedAmount" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "advance_requests" DROP COLUMN IF EXISTS "approvedAmount"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStaffType1780000300000 implements MigrationInterface {
  name = 'AddUserStaffType1780000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "staffType" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "staffType"`);
  }
}

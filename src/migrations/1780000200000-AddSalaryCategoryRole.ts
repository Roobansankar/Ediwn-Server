import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalaryCategoryRole1780000200000 implements MigrationInterface {
  name = 'AddSalaryCategoryRole1780000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "salaries" ADD "category" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "salaries" ADD "role" character varying NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salaries" DROP COLUMN "role"`);
    await queryRunner.query(`ALTER TABLE "salaries" DROP COLUMN "category"`);
  }
}

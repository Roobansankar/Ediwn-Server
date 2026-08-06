import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTradeShiftWiseAmount1787900000000
  implements MigrationInterface
{
  name = 'AddTradeShiftWiseAmount1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trades" ADD "shiftWiseAmount" numeric(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trades" DROP COLUMN "shiftWiseAmount"`,
    );
  }
}

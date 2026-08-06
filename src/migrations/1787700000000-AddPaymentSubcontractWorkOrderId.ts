import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentSubcontractWorkOrderId1787700000000
  implements MigrationInterface
{
  name = 'AddPaymentSubcontractWorkOrderId1787700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "subcontractWorkOrderId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "subcontractWorkOrderId"`,
    );
  }
}

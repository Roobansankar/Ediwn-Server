import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLabourPayments1788800000000 implements MigrationInterface {
  name = 'CreateLabourPayments1788800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "labour_payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "userName" varchar NOT NULL,
        "weekStart" date NOT NULL,
        "weekEnd" date NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "paymentDate" date NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "notes" text,
        "createdById" uuid,
        "isDeleted" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_labour_payments" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "daily_workers" ADD COLUMN IF NOT EXISTS "labourPaymentId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_workers" DROP COLUMN IF EXISTS "labourPaymentId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "labour_payments"`);
  }
}

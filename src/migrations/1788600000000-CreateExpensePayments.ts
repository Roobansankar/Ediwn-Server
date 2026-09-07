import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpensePayments1788600000000 implements MigrationInterface {
  name = 'CreateExpensePayments1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expense_payments" (
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
        CONSTRAINT "PK_expense_payments" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "expensePaymentId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP COLUMN IF EXISTS "expensePaymentId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "expense_payments"`);
  }
}

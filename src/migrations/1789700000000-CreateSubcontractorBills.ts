import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubcontractorBills1789700000000
  implements MigrationInterface
{
  name = 'CreateSubcontractorBills1789700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subcontractor_bills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "billNumber" varchar NOT NULL,
        "subcontractorId" uuid NOT NULL,
        "subcontractWorkOrderId" uuid,
        "projectId" uuid,
        "amount" numeric(12,2) NOT NULL DEFAULT 0,
        "gstPercent" numeric(5,2),
        "gstAmount" numeric(12,2),
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "paidAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "billDate" date,
        "dueDate" date,
        "billFileUrl" varchar,
        "billFileKey" varchar,
        "notes" text,
        "paidAt" TIMESTAMP,
        "isDeleted" boolean NOT NULL DEFAULT false,
        "createdBy" uuid,
        "updatedBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subcontractor_bills" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subcontractor_bills_billNumber" UNIQUE ("billNumber")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "subcontractorBillId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN IF EXISTS "subcontractorBillId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "subcontractor_bills"`);
  }
}

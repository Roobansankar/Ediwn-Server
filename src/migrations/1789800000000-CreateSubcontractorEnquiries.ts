import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubcontractorEnquiries1789800000000
  implements MigrationInterface
{
  name = 'CreateSubcontractorEnquiries1789800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subcontractor_enquiries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "groupId" character varying NOT NULL,
        "scrNo" character varying NOT NULL,
        "projectId" uuid NOT NULL,
        "workCategoryId" uuid NOT NULL,
        "subcontractorId" uuid NOT NULL,
        "scopeOfWork" text,
        "totalAmount" numeric(12,2),
        "gstPercent" numeric(5,2),
        "gstAmount" numeric(12,2),
        "totalWithGst" numeric(12,2),
        "quotationUrl" character varying,
        "quotationKey" character varying,
        "startDate" date,
        "endDate" date,
        "status" character varying(50) NOT NULL DEFAULT 'pending',
        "isDeleted" boolean NOT NULL DEFAULT false,
        "createdBy" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subcontractor_enquiries" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "subcontractor_enquiries"
      ADD CONSTRAINT "FK_subcontractor_enquiries_project"
      FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "subcontractor_enquiries"
      ADD CONSTRAINT "FK_subcontractor_enquiries_work_category"
      FOREIGN KEY ("workCategoryId") REFERENCES "work_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "subcontractor_enquiries"
      ADD CONSTRAINT "FK_subcontractor_enquiries_subcontractor"
      FOREIGN KEY ("subcontractorId") REFERENCES "subcontractors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "subcontractor_enquiries"`);
  }
}

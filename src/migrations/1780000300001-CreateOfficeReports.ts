import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOfficeReports1780000300001 implements MigrationInterface {
  name = 'CreateOfficeReports1780000300001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "office_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "category" character varying NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "projectId" uuid,
        "fileUrl" character varying NOT NULL,
        "fileKey" character varying NOT NULL,
        "uploadedBy" uuid,
        "isDeleted" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_office_reports" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "office_reports" ADD CONSTRAINT "FK_office_reports_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "office_reports" DROP CONSTRAINT "FK_office_reports_project"`,
    );
    await queryRunner.query(`DROP TABLE "office_reports"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectAccess1787000000000 implements MigrationInterface {
  name = 'CreateProjectAccess1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "project_access" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "projectId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "approvedDays" integer NOT NULL DEFAULT 1,
        "approvedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "expiresAt" TIMESTAMP NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "approvedById" uuid,
        "isDeleted" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_access" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_access_project_user" UNIQUE ("projectId", "userId")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_access" ADD CONSTRAINT "FK_project_access_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_access" ADD CONSTRAINT "FK_project_access_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_access" ADD CONSTRAINT "FK_project_access_approver" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_access" DROP CONSTRAINT "FK_project_access_project"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_access" DROP CONSTRAINT "FK_project_access_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_access" DROP CONSTRAINT "FK_project_access_approver"`,
    );
    await queryRunner.query(`DROP TABLE "project_access"`);
  }
}

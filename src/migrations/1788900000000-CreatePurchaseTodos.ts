import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseTodos1788900000000 implements MigrationInterface {
  name = 'CreatePurchaseTodos1788900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_todos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "dueDate" date,
        "isDone" boolean NOT NULL DEFAULT false,
        "isDeleted" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_todos" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "purchase_todos" ADD CONSTRAINT "FK_purchase_todos_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_purchase_todos_userId" ON "purchase_todos" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchase_todos" DROP CONSTRAINT IF EXISTS "FK_purchase_todos_user"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchase_todos_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_todos"`);
  }
}

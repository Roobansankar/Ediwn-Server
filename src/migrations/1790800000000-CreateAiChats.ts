import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiChats1790800000000 implements MigrationInterface {
  name = 'CreateAiChats1790800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "ai_chats" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "userId" uuid NOT NULL,
      "title" varchar(120) NOT NULL DEFAULT 'New chat',
      "messages" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_ai_chats" PRIMARY KEY ("id"),
      CONSTRAINT "FK_ai_chats_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      'CREATE INDEX "IDX_ai_chats_user_updated" ON "ai_chats" ("userId", "updatedAt")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "ai_chats"');
  }
}

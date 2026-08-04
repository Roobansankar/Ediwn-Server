import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMaterialReceived1780000500000
  implements MigrationInterface
{
  name = 'CreateMaterialReceived1780000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "material_received" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mrNumber" character varying NOT NULL,
        "projectId" uuid NOT NULL,
        "purchaseOrderId" uuid,
        "receivedDate" date,
        "notes" text,
        "items" jsonb NOT NULL DEFAULT '[]',
        "photoUrls" jsonb NOT NULL DEFAULT '[]',
        "photoKeys" jsonb NOT NULL DEFAULT '[]',
        "billUrl" character varying,
        "billKey" character varying,
        "status" character varying(50) NOT NULL DEFAULT 'pending',
        "isDeleted" boolean NOT NULL DEFAULT false,
        "createdBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_material_received" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_material_received_mrNumber" UNIQUE ("mrNumber")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_received" ADD CONSTRAINT "FK_material_received_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_received" ADD CONSTRAINT "FK_material_received_po" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_received" ADD CONSTRAINT "FK_material_received_creator" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material_received" DROP CONSTRAINT "FK_material_received_project"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_received" DROP CONSTRAINT "FK_material_received_creator"`,
    );
    await queryRunner.query(`DROP TABLE "material_received"`);
  }
}
import { MigrationInterface, QueryRunner } from 'typeorm';

// Trade names are unique per team instead of across the whole table: drop the
// unique constraint on trades.name and add a unique index on (name, teamId).
export class TradeNamePerTeam1790200000000 implements MigrationInterface {
  name = 'TradeNamePerTeam1790200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE r record;
      BEGIN
        FOR r IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = con.conkey[1]
          WHERE rel.relname = 'trades' AND con.contype = 'u'
            AND array_length(con.conkey, 1) = 1 AND att.attname = 'name'
        LOOP
          EXECUTE format('ALTER TABLE "trades" DROP CONSTRAINT %I', r.conname);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_trades_name_teamId" ON "trades" ("name", "teamId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trades_name_teamId"`);
    // Fails if two teams already share a trade name.
    await queryRunner.query(`ALTER TABLE "trades" ADD CONSTRAINT "UQ_trades_name" UNIQUE ("name")`);
  }
}

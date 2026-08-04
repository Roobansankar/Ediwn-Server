import 'dotenv/config';
import { DataSource } from 'typeorm';

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'edwin_erp',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});

await ds.initialize();
const applied = await ds.runMigrations();
console.log('applied:', applied.map((m) => m.name));
await ds.destroy();

import * as path from "node:path";
import * as dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config'

dotenv.config();

export default defineConfig({
  schema: path.join("db", "schema.prisma"),
  migrations: {
    path: path.join("db", "migrations"),
    seed: `ts-node db/seed.ts`,
  },
  typedSql: {
    path: path.join("db", "queries"),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})

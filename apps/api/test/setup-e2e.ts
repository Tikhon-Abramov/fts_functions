/**
 * Jest globalSetup for the e2e suite. Runs once before all tests.
 *
 *  1) Set env so Prisma + Nest point at `fts_functions_e2e`.
 *  2) Create the DB if missing.
 *  3) `prisma migrate deploy` against that DB.
 *  4) `prisma db seed` (idempotent).
 */
import * as mariadb from 'mariadb';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

import {
  applyE2EEnv,
  E2E_DATABASE_URL,
  E2E_DB_HOST,
  E2E_DB_NAME,
  E2E_DB_PASSWORD,
  E2E_DB_PORT,
  E2E_DB_USER,
} from './env-e2e';

const BACKEND_ROOT = path.resolve(__dirname, '..');

async function ensureDatabaseExists(): Promise<void> {
  const conn = await mariadb.createConnection({
    host: E2E_DB_HOST,
    port: Number(E2E_DB_PORT),
    user: E2E_DB_USER,
    password: E2E_DB_PASSWORD,
    allowPublicKeyRetrieval: true,
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${E2E_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await conn.end();
  }
}

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: BACKEND_ROOT,
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')} (exit=${result.status})`);
  }
}

export default async function globalSetup(): Promise<void> {
  applyE2EEnv();

  console.log(`[e2e setup] Using DATABASE_URL=${E2E_DATABASE_URL}`);

  await ensureDatabaseExists();

  // Migrate + seed with the e2e DATABASE_URL. Use `migrate deploy` so Prisma
  // does not prompt. The seed is idempotent.
  run('npx', ['prisma', 'migrate', 'deploy', '--schema', 'db/schema.prisma']);
  run('npx', ['prisma', 'db', 'seed', '--schema', 'db/schema.prisma']);
}

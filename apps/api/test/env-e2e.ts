/**
 * Centralized env setup for e2e tests. Must be imported (and its `applyE2EEnv`
 * called) BEFORE anything that reads DATABASE_* / NODE_ENV / etc.
 *
 * We piggy-back on `.env.development.local` for the non-DB secrets (JWT,
 * COOKIE_SECRET, etc.) and override the DB coordinates to point at
 * `fts_functions_e2e`.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

export const E2E_DB_NAME = 'fts_functions_e2e';
export const E2E_DB_HOST = '127.0.0.1';
export const E2E_DB_PORT = '3306';
export const E2E_DB_USER = 'root';
export const E2E_DB_PASSWORD = 'RossyFireArmss';
export const E2E_DATABASE_URL = `mysql://${E2E_DB_USER}:${E2E_DB_PASSWORD}@${E2E_DB_HOST}:${E2E_DB_PORT}/${E2E_DB_NAME}?connection_limit=10`;

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function applyE2EEnv(): void {
  // Force NODE_ENV first so the .env.<env>.local file picks up JWT/COOKIE secrets.
  process.env['NODE_ENV'] = 'development';

  const backendRoot = path.resolve(__dirname, '..');
  loadEnvFile(path.join(backendRoot, '.env.development.local'));
  loadEnvFile(path.join(backendRoot, '.env'));

  // Override DB coordinates to point at the isolated e2e database.
  process.env['DATABASE_HOST'] = E2E_DB_HOST;
  process.env['DATABASE_PORT'] = E2E_DB_PORT;
  process.env['DATABASE_USER'] = E2E_DB_USER;
  process.env['DATABASE_PASSWORD'] = E2E_DB_PASSWORD;
  process.env['DATABASE_NAME'] = E2E_DB_NAME;
  process.env['DATABASE_CONNECTION_LIMIT'] = '10';
  process.env['DATABASE_URL'] = E2E_DATABASE_URL;

  // Disable throttler from punishing tight test loops
  process.env['THROTTLE_LIMIT'] = '100000';
  process.env['THROTTLE_TTL'] = '60000';
}

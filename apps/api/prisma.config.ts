import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config();

/**
 * Resolve DATABASE_URL with a fallback: if it's set explicitly, use it as-is;
 * otherwise compose it from DATABASE_USER / DATABASE_PASSWORD / DATABASE_HOST /
 * DATABASE_PORT / DATABASE_NAME (which is what the rest of the app reads anyway).
 * This way a contributor with split env vars never has to also remember to
 * keep the composite URL in sync.
 */
function resolveDatabaseUrl(): string {
  const explicit = process.env['DATABASE_URL'];
  if (explicit && explicit.length > 0) return explicit;

  const user = process.env['DATABASE_USER'];
  const password = process.env['DATABASE_PASSWORD'];
  const host = process.env['DATABASE_HOST'] ?? '127.0.0.1';
  const port = process.env['DATABASE_PORT'] ?? '3306';
  const name = process.env['DATABASE_NAME'];

  if (!user || !password || !name) {
    throw new Error(
      'DATABASE_URL is not set, and one of DATABASE_USER / DATABASE_PASSWORD / DATABASE_NAME is missing. ' +
        'Set DATABASE_URL=mysql://user:pass@host:port/db OR set the five DATABASE_* parts.',
    );
  }

  const limit = process.env['DATABASE_CONNECTION_LIMIT'];
  const limitQuery = limit ? `?connection_limit=${limit}` : '';
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}${limitQuery}`;
}

export default defineConfig({
  schema: path.join('db', 'schema.prisma'),
  migrations: {
    path: path.join('db', 'migrations'),
    seed: `ts-node -r tsconfig-paths/register db/seeds/index.ts`,
  },
  typedSql: {
    path: path.join('db', 'queries'),
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});

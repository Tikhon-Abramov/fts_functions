import type { DatabaseConfig } from '@common/config';

import mariadb from 'mariadb';

import { mountTypeCategoryConstraints } from './mounts';

export type SqlMount = (conn: mariadb.Connection) => Promise<void>;

export const SQL_MOUNTS: SqlMount[] = [mountTypeCategoryConstraints];

export async function setupSql(database: DatabaseConfig): Promise<void> {
  console.info('Setting up SQL (triggers, indexes, constraints)...\n');

  const conn = await mariadb.createConnection({
    host: database.host,
    user: database.user,
    password: database.password,
    port: database.port,
    database: database.name,
    connectTimeout: 5000,
    allowPublicKeyRetrieval: true,
    multipleStatements: false,
  });

  try {
    for (const mount of SQL_MOUNTS) {
      const name = mount.name.replace(/^mount/, '');
      console.info(`  Mounting: ${name}`);
      await mount(conn);
    }
    console.info('\n✅ All SQL setup complete');
  } finally {
    await conn.end();
  }
}

// Реэкспорт констант для удобства
export * from './mounts';

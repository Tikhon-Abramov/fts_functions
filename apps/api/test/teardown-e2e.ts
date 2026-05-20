/**
 * Jest globalTeardown. We DO NOT drop the DB — keeping it around makes re-runs
 * fast (seed is idempotent). If you ever need a clean slate, drop manually:
 *
 *   mysql -u root -p -e 'DROP DATABASE fts_functions_e2e'
 */
export default async function globalTeardown(): Promise<void> {
  // no-op
}

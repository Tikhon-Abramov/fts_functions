/**
 * Centralized access to `import.meta.env`. Every consumer should import from
 * here instead of reaching into `import.meta.env` directly — that way missing
 * required vars fail loudly at module load, and the set of env keys the app
 * depends on is discoverable in one place.
 */

/**
 * Boot-time env validation. Throws if required vars are missing, so the
 * failure lands at module load, not at some random fetch later.
 */
function assertEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return String(value);
}

export const ENV = {
  API_BASE_URL: assertEnv("VITE_API_BASE_URL"),
  MODE: import.meta.env.MODE as "development" | "production",
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

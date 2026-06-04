/**
 * Режим приложения и уровень логирования — серверные константы.
 *
 * Регулярные выражения, лимиты дат/длин и т.п. переехали в `@registry/shared`.
 * Тексты Swagger-ответов — см. `./swagger-descriptions.ts`.
 */

export const AppMode = {
  DEVELOPMENT: 'DEVELOPMENT',
  PRODUCTION: 'PRODUCTION',
} as const;

export type AppMode = (typeof AppMode)[keyof typeof AppMode];

export const LogLevel = {
  DEBUG: 'DEBUG',
  ERROR: 'ERROR',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

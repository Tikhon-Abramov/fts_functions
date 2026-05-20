import { plainToInstance, Type } from 'class-transformer';
import { ValidateNested, validateSync } from 'class-validator';

import { DatabaseConfig } from './database-config';
import { LoggingConfig } from './logging-config';
import { NodeConfig } from './node-config';

/**
 * Корневой конфиг приложения. Собирается единожды при старте через
 * `loadAndValidateConfig` (см. ниже) и подключается в `ConfigModule.forRoot`
 * в `app.module.ts`. Валидация — `class-validator`, бросает `Error` с
 * человекочитаемым описанием, если какая-то переменная задана неверно.
 */
export class RootConfig {
  @Type(() => NodeConfig) @ValidateNested() readonly node!: NodeConfig;
  @Type(() => DatabaseConfig) @ValidateNested() readonly database!: DatabaseConfig;
  @Type(() => LoggingConfig) @ValidateNested() readonly logging!: LoggingConfig;
}

export const CONFIG_KEY = {
  NODE: 'node',
  DATABASE: 'database',
  LOGGING: 'logging',
} as const;

/**
 * Преобразует `process.env` в нормализованную структуру под `RootConfig`,
 * валидирует через `class-validator`, возвращает plain-объект для NestJS
 * `ConfigModule.forRoot({ load: [...] })`.
 */
export function loadAndValidateConfig(): Record<string, unknown> {
  const env = process.env;

  const raw = {
    node: {
      appName: env['APP_NAME'],
      host: env['NODE_HOST'],
      httpPort: env['NODE_HTTP_PORT'],
      mode: env['NODE_ENV']?.toUpperCase(),
      throttleTtl: env['THROTTLE_TTL'],
      throttleLimit: env['THROTTLE_LIMIT'],
      cookieSecret: env['COOKIE_SECRET'],
      jwtAccessTokenSecret: env['JWT_ACCESS_TOKEN_SECRET'],
      jwtAccessTokenExpirationMs: env['JWT_ACCESS_TOKEN_EXPIRATION_MS'],
      jwtRefreshTokenSecret: env['JWT_REFRESH_TOKEN_SECRET'],
      jwtRefreshTokenExpirationMs: env['JWT_REFRESH_TOKEN_EXPIRATION_MS'],
      jwtVerificationTokenSecret: env['JWT_VERIFICATION_TOKEN_SECRET'],
      jwtVerificationTokenExpirationMs: env['JWT_VERIFICATION_TOKEN_EXPIRATION_MS'],
      jwtPasswordResetTokenSecret: env['JWT_PASSWORD_RESET_TOKEN_SECRET'],
      jwtPasswordResetTokenExpirationMs: env['JWT_PASSWORD_RESET_TOKEN_EXPIRATION_MS'],
      allowedOrigins: env['ALLOWED_ORIGINS'],
      minioEndpoint: env['MINIO_ENDPOINT'],
      minioBucket: env['MINIO_BUCKET'],
      minioAccessKey: env['MINIO_ACCESS_KEY'],
      minioSecretKey: env['MINIO_SECRET_KEY'],
      auditLogBucket: env['AUDIT_LOG_BUCKET'],
      auditLogRetentionDays: env['AUDIT_LOG_RETENTION_DAYS'],
      auditLogCron: env['AUDIT_LOG_CRON'],
    },
    database: {
      name: env['DATABASE_NAME'],
      user: env['DATABASE_USER'],
      password: env['DATABASE_PASSWORD'],
      host: env['DATABASE_HOST'],
      port: env['DATABASE_PORT'],
      connectionLimit: env['DATABASE_CONNECTION_LIMIT'],
      explicitUrl: env['DATABASE_URL'],
    },
    logging: {
      level: env['PINO_LOG_LEVEL'],
      logsDir: env['LOGS_DIR'],
    },
  };

  const config = plainToInstance(RootConfig, raw, { enableImplicitConversion: false });

  const errors = validateSync(config, {
    whitelist: false,
    forbidUnknownValues: false,
  });
  if (errors.length > 0) {
    const formatted = errors
      .map(
        (e) =>
          `  ${e.property}: ${JSON.stringify(e.children?.length ? e.children : e.constraints)}`,
      )
      .join('\n');
    throw new Error(`Невалидная конфигурация (см. .env / переменные окружения):\n${formatted}`);
  }

  // ConfigService.get('node') needs a plain object indexed by key.
  return {
    [CONFIG_KEY.NODE]: config.node,
    [CONFIG_KEY.DATABASE]: config.database,
    [CONFIG_KEY.LOGGING]: config.logging,
  };
}

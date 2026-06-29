import { z } from "zod";



export const envBaseSchema = z.object({
  DATABASE_NAME: z.string().nonempty('DATABASE_NAME является обязательным параметром'),
  DATABASE_USER: z.string().nonempty('DATABASE_USER является обязательным параметром'),
  DATABASE_PASSWORD: z.string().nonempty('DATABASE_PASSWORD является обязательным параметром'),
  DATABASE_HOST: z.string().nonempty('DATABASE_HOST является обязательным параметром'),
  DATABASE_PORT: z
    .coerce
    .number()
    .int()
    .positive('Параметр DATABASE_PORT должен быть целочисленным положительным'),
  // DATABASE_CONNECTION_LIMIT: z
  //   .coerce
  //   .number()
  //   .int()
  //   .positive('Параметр DATABASE_CONNECTION_LIMIT должен быть целочисленным положительным')
  //   .max(10000, 'Значение параметраDATABASE_CONNECTION_LIMIT слишком велико'),
  DATABASE_URL: z
    .string()
    .nonempty('DATABASE_URL является обязательным параметром')
    .regex(
      /^mysql:\/\/.+:.+@.+:\d+\/.+$/,
      'DATABASE_URL должен соответствовать формату engine://username:password@host:port/db',
    ),
});


export const envLocalSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),

  APP_NAME: z.string().min(1, 'APP_NAME является обязательным параметром'),

  PINO_LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .default('info'),

  NODE_HOST: z.string().min(1, 'NODE_HOST является обязательным параметром'),
  NODE_HTTP_PORT: z.coerce.number().int().min(1, 'Параметр NODE_HTTP_PORT должен быть целочисленным больше 0'),
  FTS_INTERACTION_AUTH_URL: z.string().min(1, 'FTS_INTERACTION_AUTH_URL является обязательным параметром'),

  THROTTLE_TTL: z.coerce.number().int().positive('Парамеетр THROTTLE_TTL должен быть целочисленным положительным')
    .default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive('Парамеетр THROTTLE_LIMIT должен быть целочисленным положительным')
    .default(100),

  COOKIE_SECRET: z.string().min(32, 'Длина секретного ключа COOKIE_SECRET должна быть не менее 32 символов'),

  JWT_ACCESS_TOKEN_SECRET: z.string().min(32, 'Длина секретного ключа JWT_ACCESS_TOKEN_SECRET должна быть не менее 32 символов'),
  JWT_ACCESS_TOKEN_EXPIRATION_MS: z.coerce.number().positive('Парамеетр JWT_ACCESS_TOKEN_EXPIRATION_MS должен быть целочисленным положительным'),
  JWT_REFRESH_TOKEN_SECRET: z.string().min(32, 'Длина секретного ключа WT_REFRESH_TOKEN_SECRET должна быть не менее 32 символов'),
  JWT_REFRESH_TOKEN_EXPIRATION_MS: z.coerce.number().positive('Парамеетр JWT_REFRESH_TOKEN_EXPIRATION_MS должен быть целочисленным положительным'),
  JWT_VERIFICATION_TOKEN_SECRET: z.string().min(32, 'Длина секретного ключа JWT_VERIFICATION_TOKEN_SECRET должна быть не менее 32 символов'),
  JWT_VERIFICATION_TOKEN_EXPIRATION_MS: z.coerce.number().positive('Парамеетр JWT_VERIFICATION_TOKEN_EXPIRATION_MS должен быть целочисленным положительным'),
  JWT_PASSWORD_RESET_TOKEN_SECRET: z.string().min(32, 'Длина секретного ключа JWT_PASSWORD_RESET_TOKEN_SECRET должна быть не менее 32 символов'),
  JWT_PASSWORD_RESET_TOKEN_EXPIRATION_MS: z.coerce.number().positive('Парамеетр JWT_PASSWORD_RESET_TOKEN_EXPIRATION_MS должен быть целочисленным положительным'),

  MINIO_HOST: z.string().min(1, 'MINIO_HOST является обязательным параметром'),
  MINIO_PORT: z.coerce.number().int().min(1, 'MINIO_PORT должен быть целочисленным больше 0'),
  MINIO_USE_SSL: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return ['true', '1', 'yes', 'on', 'y'].includes(val.toLowerCase());
      }
      return false;
    },
    z.boolean({
      required_error: 'MINIO_USE_SSL является обязательным параметром',
      invalid_type_error: 'MINIO_USE_SSL должен быть булевым значением',
    })
  ),
  MINIO_ROOT_USER: z.string().min(1, 'MINIO_ROOT_USER является обязательным параметром'),
  MINIO_ROOT_PASSWORD: z.string().min(1, 'MINIO_ROOT_PASSWORD является обязательным параметром'),
  MINIO_BUCKET: z.string().min(1, 'MINIO_BUCKET является обязательным параметром'),

});

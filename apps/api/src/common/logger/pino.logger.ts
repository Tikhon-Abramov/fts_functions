import { type FastifyReply, type FastifyRequest } from 'fastify';
import { join } from 'path';
import { type LoggerOptions } from 'pino';

import { PinoLogLevel } from '@common/config';

/**
 * Pino-конфиг. Уровень и режим окружения читаются напрямую из `process.env`
 * именно здесь, потому что объект экспортируется как plain-литерал и
 * используется до старта Nest-контейнера. Ровно один источник правды (значения
 * валидируются при инициализации `RootConfig` в `loadAndValidateConfig`).
 */
const isProduction = process.env['NODE_ENV'] === 'production';
const level: PinoLogLevel =
  (process.env['PINO_LOG_LEVEL'] as PinoLogLevel | undefined) ?? PinoLogLevel.INFO;

export const logger: { pinoHttp: LoggerOptions } = {
  pinoHttp: {
    level,

    transport: isProduction
      ? {
          target: 'pino-roll',
          options: {
            file: join(process.cwd(), 'logs', 'cc'),
            frequency: 'daily',
            mkdir: true,
            extension: '.log',
            limit: { count: 30 },
            dateFormat: 'dd-MM-yyyy',
          },
        }
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd hh:MM:ss',
            ignore: 'pid',
          },
        },

    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["postman-token"]',
        'req.headers.cookie',
        'req.headers["x-access-token"]',
        'req.headers["x-api-key"]',
      ],
    },

    formatters: {
      level: (label: string) => ({ level: label }),
    },

    serializers: {
      req: (req: FastifyRequest) => ({
        method: req.method,
        url: req.url,
      }),
      res: (reply: FastifyReply) => ({
        statusCode: reply.statusCode,
      }),
      err: (err: Error) => ({
        type: err.name,
        message: err.message,
        stack: err.stack,
      }),
    },
  },
};

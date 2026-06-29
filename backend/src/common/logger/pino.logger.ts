
import { FastifyReply, FastifyRequest } from 'fastify';
import { join } from 'path';
import { LoggerOptions } from 'pino';

const isProduction = process.env['NODE_ENV'] === 'production';

export const logger: { pinoHttp: LoggerOptions } = {
  pinoHttp: {
    level: process.env['PINO_LOG_LEVEL'] || 'info',

    transport: isProduction
      ? {
        target: 'pino-roll',
        options: {
          file: join(process.cwd(), 'logs', 'fts_functions_registry'),
          frequency: 'hourly',
          mkdir: true,
          extension: '.log',
          limit: { count: 23 },
          dateFormat: 'dd-MM-yyyy_HH',
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

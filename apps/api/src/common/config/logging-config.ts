import { IsIn, IsOptional, IsString } from 'class-validator';

export const PinoLogLevel = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
  SILENT: 'silent',
} as const;

export type PinoLogLevel = (typeof PinoLogLevel)[keyof typeof PinoLogLevel];

/**
 * Настройки pino-логгера: уровень + путь хранения файлов в production-режиме.
 */
export class LoggingConfig {
  @IsOptional()
  @IsIn(Object.values(PinoLogLevel))
  readonly level: PinoLogLevel = PinoLogLevel.INFO;

  @IsOptional() @IsString() readonly logsDir: string = 'logs';
}

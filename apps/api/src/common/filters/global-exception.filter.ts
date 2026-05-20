import type { FastifyReply } from 'fastify';

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodError } from 'zod';

import { ValidationErrorException } from '@common/errors/exceptions';
import { translatePrismaError } from '@common/prisma/mappers';
import { Prisma } from '@prisma-client';
import { ErrorCode } from '@registry/shared';

/**
 * Минимальный глобальный фильтр — типизированные исключения уже несут
 * в теле `{code, message, params?}`. Фильтр лишь добавляет `timestamp`.
 * Prisma-ошибки переводятся в типизированные исключения как last-mile fallback.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter<unknown> {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FastifyReply>();

    // 1) Zod: напрямую или через @anatine/zod-nestjs.
    const zodIssues = extractZodIssues(exception);
    if (zodIssues) {
      this.send(response, new ValidationErrorException(zodIssues));
      return;
    }

    // 2) Наши типизированные HttpException — проходят насквозь.
    if (exception instanceof HttpException) {
      this.send(response, exception);
      return;
    }

    // 3) Prisma известные ошибки — переводим в типизированный HttpException.
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.send(response, translatePrismaError(exception));
      return;
    }

    // 4) Всё остальное — 500 без утечек.
    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    void response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }

  private send(response: FastifyReply, exception: HttpException): void {
    const statusCode = exception.getStatus();
    const raw = exception.getResponse();
    const base = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const code = typeof base['code'] === 'string' ? base['code'] : ErrorCode.HTTP_EXCEPTION;
    const message =
      base['message'] !== undefined
        ? (base['message'] as unknown)
        : typeof raw === 'string'
          ? raw
          : exception.message;

    const body: Record<string, unknown> = {
      statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
    };
    if (base['params'] !== undefined) body['params'] = base['params'];

    void response.status(statusCode).send(body);
  }
}

function extractZodIssues(exception: unknown): unknown[] | null {
  if (exception instanceof ZodError) return exception.errors;

  // ZodValidationException from some libraries
  if (
    exception &&
    typeof exception === 'object' &&
    (exception as { name?: unknown }).name === 'ZodValidationException'
  ) {
    const err = (exception as { error?: unknown }).error;
    if (err instanceof ZodError) return err.errors;
  }

  // Our ZodValidationPipe wraps issues in BadRequestException whose `message`
  // is an array of {path, message}.
  if (exception instanceof BadRequestException) {
    const response = exception.getResponse();
    if (response && typeof response === 'object') {
      const message = (response as { message?: unknown }).message;
      if (
        Array.isArray(message) &&
        message.length > 0 &&
        (message as unknown[]).every(
          (m) => m && typeof m === 'object' && 'path' in m && 'message' in m,
        )
      ) {
        return message as unknown[];
      }
    }
  }

  return null;
}

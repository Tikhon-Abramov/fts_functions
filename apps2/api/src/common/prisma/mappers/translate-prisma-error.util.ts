import type { Prisma } from '@prisma-client';

import { HttpException, HttpStatus } from '@nestjs/common';

import {
  ForeignKeyConstraintException,
  ResourceNotFoundException,
  TypeCategoryMismatchException,
  UniqueConstraintException,
} from '@common/errors/exceptions';
import { ErrorCode } from '@registry/shared';

/**
 * Последний рубеж: превращает Prisma ошибку в подходящее типизированное
 * исключение. Вызывается фильтром для ошибок, проскочивших маппинг на уровне
 * сервисов (т.е. которые никто явно не обработал).
 */
export function translatePrismaError(error: Prisma.PrismaClientKnownRequestError): HttpException {
  switch (error.code) {
    case 'P2002': {
      const target = (error.meta as { target?: unknown } | undefined)?.target;
      const targetArr = Array.isArray(target)
        ? target.filter((x): x is string => typeof x === 'string')
        : typeof target === 'string'
          ? [target]
          : undefined;
      return new UniqueConstraintException(targetArr);
    }
    case 'P2003': {
      const field = (error.meta as { field_name?: unknown } | undefined)?.field_name;
      return new ForeignKeyConstraintException(typeof field === 'string' ? field : undefined);
    }
    case 'P2010': {
      // Raw driver error — may carry a trigger SIGNAL message.
      const meta = error.meta as
        | {
            driverAdapterError?: { message?: unknown };
            message?: unknown;
          }
        | undefined;
      const candidates: unknown[] = [
        meta?.driverAdapterError?.message,
        meta?.message,
        error.message,
      ];
      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.includes('TYPE_CATEGORY_MISMATCH:')) {
          const match = candidate.match(/TYPE_CATEGORY_MISMATCH:([^:'"\s]+):([A-Z0-9_]+)/);
          if (match) {
            const tableColumn = match[1] ?? '';
            const category = match[2] ?? '';
            const dot = tableColumn.indexOf('.');
            const table = dot > -1 ? tableColumn.slice(0, dot) : '';
            const column = dot > -1 ? tableColumn.slice(dot + 1) : tableColumn;
            return new TypeCategoryMismatchException(table, column, category);
          }
        }
      }
      // Unknown raw driver error — fall through to a 500-ish generic.
      return new (class extends HttpException {
        constructor() {
          super(
            {
              code: ErrorCode.INTERNAL_SERVER_ERROR,
              message: error.message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      })();
    }
    case 'P2025':
      return new ResourceNotFoundException();
    default:
      return new (class extends HttpException {
        constructor() {
          super(
            {
              code: ErrorCode.INTERNAL_SERVER_ERROR,
              message: error.message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      })();
  }
}

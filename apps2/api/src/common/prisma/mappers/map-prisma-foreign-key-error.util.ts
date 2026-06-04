import { ForeignKeyConstraintException } from '@common/errors/exceptions';
import { ERROR_MESSAGE } from '@common/strings';

import { isPrismaForeignKeyError } from './is-prisma-error.util';

/**
 * Бросает {@link ForeignKeyConstraintException}, если `error` — Prisma P2003.
 * Иначе пробрасывает исходный `error`.
 */
export function mapPrismaForeignKeyError(
  error: unknown,
  message: string = ERROR_MESSAGE.FOREIGN_KEY_CONSTRAINT,
): never {
  if (!isPrismaForeignKeyError(error)) throw error;
  const meta = error.meta;
  const field = typeof meta?.['field_name'] === 'string' ? meta['field_name'] : undefined;
  throw new ForeignKeyConstraintException(field, message);
}

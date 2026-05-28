import { type HttpException } from '@nestjs/common';

import { ResourceNotFoundException } from '@common/errors/exceptions';

import { isPrismaNotFoundError } from './is-prisma-error.util';

/**
 * Бросает либо переданное `exception`, либо дефолтный
 * {@link ResourceNotFoundException}, если `error` — Prisma P2025.
 * Иначе пробрасывает исходный `error`.
 */
export function mapPrismaNotFound(error: unknown, exception?: HttpException): never {
  if (!isPrismaNotFoundError(error)) throw error;
  throw exception ?? new ResourceNotFoundException();
}

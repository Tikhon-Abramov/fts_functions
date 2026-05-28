import { Prisma } from '@prisma-client';

/**
 * Type guard — проверяет, что значение является Prisma известной ошибкой
 * с указанным кодом (P2002, P2003, P2025 и т.п.).
 */
export function isPrismaKnownError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isPrismaUniqueError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return isPrismaKnownError(error) && error.code === 'P2002';
}

export function isPrismaForeignKeyError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return isPrismaKnownError(error) && error.code === 'P2003';
}

export function isPrismaNotFoundError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return isPrismaKnownError(error) && error.code === 'P2025';
}

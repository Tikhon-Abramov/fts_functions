import { UniqueConstraintException } from '@common/errors/exceptions';
import { ERROR_MESSAGE } from '@common/strings';

import { isPrismaUniqueError } from './is-prisma-error.util';

/**
 * Порядковые поля, извлекаемые Prisma в `meta.target`. Некоторые версии
 * возвращают строку (`"email"`), некоторые — массив (`["email", "tenantId"]`).
 */
function extractTarget(error: unknown): string[] | undefined {
  if (!isPrismaUniqueError(error)) return undefined;
  const meta = error.meta;
  const target = meta?.['target'];
  if (Array.isArray(target)) {
    return target.filter((x): x is string => typeof x === 'string');
  }
  if (typeof target === 'string') return [target];
  return undefined;
}

/**
 * Бросает {@link UniqueConstraintException}, если `error` — это Prisma P2002.
 * Иначе пробрасывает исходный `error` наверх.
 *
 * `fieldMessages` — карта «поле → понятное пользователю сообщение»:
 * если `target` указывает на одно из известных полей, используется его текст;
 * иначе — `commonMessage`.
 */
export function mapPrismaUniqueError(
  error: unknown,
  fieldMessages: Record<string, string> = {},
  commonMessage: string = ERROR_MESSAGE.UNIQUE_CONSTRAINT,
): never {
  if (!isPrismaUniqueError(error)) throw error;

  const target = extractTarget(error);
  const firstHit = target?.find((f) => f in fieldMessages);
  const message = firstHit ? fieldMessages[firstHit] : commonMessage;

  throw new UniqueConstraintException(target, message);
}

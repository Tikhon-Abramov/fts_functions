import { TypeCategoryMismatchException } from '@common/errors/exceptions';
import { TYPE_CATEGORY_GUARDS } from '@db/sql/mounts';
import { type Category } from '@prisma-client';

import { type PrismaService } from '../../prisma/prisma.service';

/**
 * Карта: Category → первая найденная пара (table, column) из списка
 * триггерных гвардов. Нужна для обогащения сообщения об ошибке,
 * чтобы клиент мог выделить конкретное поле.
 */
const CATEGORY_TO_LOCATION: Partial<Record<string, { table: string; column: string }>> = (() => {
  const map: Record<string, { table: string; column: string }> = {};
  for (const g of TYPE_CATEGORY_GUARDS) {
    if (!map[g.category]) {
      map[g.category] = { table: g.table, column: g.column };
    }
  }
  return map;
})();

/**
 * Проверяет, что запись Type с данным id принадлежит ожидаемой категории.
 * В случае несоответствия бросает {@link TypeCategoryMismatchException}.
 *
 * Используется на уровне сервиса при каждой записи, устанавливающей FK на Type.
 * DB-уровень (триггер) выполняется параллельно; данная проверка — источник
 * пользовательских сообщений об ошибке.
 */
export async function assertTypeCategory(
  prisma: PrismaService,
  id: number,
  expected: Category,
): Promise<void> {
  const type = await prisma.type.findUniqueOrThrow({ where: { id } });
  if (type.category !== expected) {
    const loc = CATEGORY_TO_LOCATION[expected];
    throw new TypeCategoryMismatchException(loc?.table ?? '', loc?.column ?? '', expected);
  }
}

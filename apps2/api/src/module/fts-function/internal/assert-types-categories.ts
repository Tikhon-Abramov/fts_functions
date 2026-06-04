import { TypeCategoryMismatchException } from '@common/errors/exceptions';
import { TYPE_CATEGORY_GUARDS } from '@db/sql/mounts';
import { type Category } from '@prisma-client';

import { type PrismaService } from '../../prisma/prisma.service';

type TypeCategoryCheck = {
  id: number;
  expected: Category;
};

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
 * Batch variant of `assertTypeCategory`: validates several (id, expectedCategory)
 * pairs in a single Prisma round-trip via `findMany({ id: { in } })`.
 *
 * Replaces the previous N-parallel `findUniqueOrThrow` pattern in
 * `validateFtsFunctionWrite` / `validateFtsFunctionDetailWrite`. Throws the
 * first mismatch encountered to keep error semantics aligned with
 * `assertTypeCategory`.
 *
 * Empty input is a no-op; duplicate IDs are deduplicated for the query.
 */
export async function assertTypesCategories(
  prisma: PrismaService,
  checks: TypeCategoryCheck[],
): Promise<void> {
  if (checks.length === 0) return;

  const ids = Array.from(new Set(checks.map((c) => c.id)));
  const types = await prisma.type.findMany({
    where: { id: { in: ids } },
    select: { id: true, category: true },
  });
  const byId = new Map(types.map((t) => [t.id, t.category]));

  for (const check of checks) {
    const actual = byId.get(check.id);
    if (actual === undefined || actual !== check.expected) {
      const loc = CATEGORY_TO_LOCATION[check.expected];
      throw new TypeCategoryMismatchException(loc?.table ?? '', loc?.column ?? '', check.expected);
    }
  }
}

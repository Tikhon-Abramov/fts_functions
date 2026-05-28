/**
 * Reverse-index over `TypeResponseDto[]` keyed by `${category}::${name}`.
 *
 * `FunctionRecord` only carries Type *names* in its display fields (not ids),
 * so cell renderers that want the Type's color must resolve it back to a row
 * via (category, displayName). Building a single Map once per types-array
 * change is cheaper than the O(n) linear scan that would otherwise run per
 * cell render.
 */
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useCallback, useMemo } from "react";

export type TypeLookupByName = (
  category: string,
  name: string | undefined,
) => TypeResponseDto | undefined;

export function useTypeColorLookup(types: TypeResponseDto[]): TypeLookupByName {
  const colorByCategoryName = useMemo(() => {
    const m = new Map<string, TypeResponseDto>();
    for (const tp of types) {
      m.set(`${tp.category}::${tp.name}`, tp);
    }
    return m;
  }, [types]);

  return useCallback<TypeLookupByName>(
    (category, name) =>
      name ? colorByCategoryName.get(`${category}::${name}`) : undefined,
    [colorByCategoryName],
  );
}

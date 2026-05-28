/**
 * One-pass index over the flat Type[] dictionary returned by
 * `useConstantControllerGetTypesV1Query`.
 *
 * Consumers commonly want the same list sliced four different ways (by
 * category → rows, by category → MUI SelectOption[], by id, by code). This
 * hook builds all four indexes in a single `useMemo` so we stop paying the
 * cost of N separate filter+map passes — and, more importantly, so call-sites
 * no longer repeat the `typesAll.filter(t => t.category === "FTS_…").map(...)`
 * boilerplate that used to live in home.tsx.
 */
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useMemo } from "react";

import { Category } from "@registry/shared/enums";

export type SelectOption = { value: number; label: string };

export type Dictionary = {
  byCategory: Readonly<Record<Category, TypeResponseDto[]>>;
  optionsByCategory: Readonly<Record<Category, SelectOption[]>>;
  byId: ReadonlyMap<number, TypeResponseDto>;
  byCode: ReadonlyMap<string, TypeResponseDto>;
};

export function useDictionary(types: TypeResponseDto[]): Dictionary {
  return useMemo(() => {
    const byCategory = {} as Record<Category, TypeResponseDto[]>;
    const optionsByCategory = {} as Record<Category, SelectOption[]>;
    const byId = new Map<number, TypeResponseDto>();
    const byCode = new Map<string, TypeResponseDto>();

    for (const cat of Object.values(Category)) {
      byCategory[cat] = [];
      optionsByCategory[cat] = [];
    }
    for (const t of types) {
      const cat = t.category as Category;

      if (!byCategory[cat]) continue;

      byCategory[cat].push(t);
      optionsByCategory[cat].push({ value: t.id, label: t.name });
      byId.set(t.id, t);
      byCode.set(t.code, t);
    }
    return { byCategory, optionsByCategory, byId, byCode };
  }, [types]);
}

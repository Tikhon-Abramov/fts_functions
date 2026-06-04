import type { Link, Row } from "src/entities/fts-function/types";

import { CATEGORIES } from "src/entities/fts-function/constants";
import { FtsFunctionCategory } from "src/entities/fts-function/model";

// ---------- types ----------

export type RowsByCategory = Record<FtsFunctionCategory, Row[]>;

// ---------- constants ----------

// Every known category must be present in the grouped output so render code
// can safely index by category without nullish checks.
const ALL_CATEGORIES: readonly FtsFunctionCategory[] =
    Object.values(FtsFunctionCategory);

// ---------- functions ----------

/**
 * Group a list of rows by their `category`.
 *
 * Pure — returns a fresh record every call with an entry for every known
 * `FtsFunctionCategory`. Rows with an unknown category are skipped so the
 * output is always render-safe.
 */
export function groupRowsByCategory(rows: Row[]): RowsByCategory {
  const groups = emptyCategoryBuckets();

  for (const row of rows) {
    const category = row?.category;

    if (category && category in groups) {
      groups[category].push(row);
    }
  }

  return groups;
}

/**
 * Flatten grouped rows exactly in the same order as they are rendered
 * in DetailStepGrid.
 *
 * This is important for numbering:
 * rows are displayed by category sections, so labels like 1.1, 1.2, 1.3...
 * must follow the rendered category order, not the raw API/create-date order.
 */
export function flattenRowsByRenderedCategoryOrder(
    groups: RowsByCategory,
): Row[] {
  const result: Row[] = [];

  for (const category of CATEGORIES) {
    result.push(...(groups[category] ?? []));
  }

  return result;
}

/**
 * Build a map from row id → 1-based index in the input array.
 *
 * Pass here the already-render-ordered rows if the number must match UI order.
 */
export function buildRowIndexMap(rows: Row[]): Map<string, number> {
  const map = new Map<string, number>();

  rows.forEach((row, index) => {
    map.set(row.id, index + 1);
  });

  return map;
}

/**
 * Count how many links originate from a Step-1 row within each category.
 *
 * Pure. Walks every link's `fromId`, resolves it to a Row via `rowMap`, and
 * if that row belongs to `step1Rows` it increments the counter for its
 * category. Returns a Record with every `FtsFunctionCategory` key populated.
 */
export function countStep1LinksByCategory(
    step1Rows: Row[],
    links: Link[],
    rowMap: Map<string, Row>,
): Record<FtsFunctionCategory, number> {
  const counts = emptyCategoryCounts();
  const step1Ids = new Set(step1Rows.map((row) => row.id).filter(Boolean));

  for (const link of links) {
    if (!link?.fromId) continue;

    const from = rowMap.get(link.fromId);

    if (
        from &&
        step1Ids.has(from.id) &&
        from.category &&
        from.category in counts
    ) {
      counts[from.category]++;
    }
  }

  return counts;
}

// ---------- helpers ----------

function emptyCategoryBuckets(): RowsByCategory {
  const out = {} as RowsByCategory;

  for (const category of ALL_CATEGORIES) {
    out[category] = [];
  }

  return out;
}

function emptyCategoryCounts(): Record<FtsFunctionCategory, number> {
  const out = {} as Record<FtsFunctionCategory, number>;

  for (const category of ALL_CATEGORIES) {
    out[category] = 0;
  }

  return out;
}
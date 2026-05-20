import type { Link, Row } from "src/entities/fts-function/types";

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
 * Group a list of rows by their `category`. Pure — returns a fresh record
 * every call with an entry for every known `FtsFunctionCategory`. Rows with
 * an unknown category are skipped so the output is always render-safe.
 */
export function groupRowsByCategory(rows: Row[]): RowsByCategory {
  const groups = emptyCategoryBuckets();
  for (const r of rows) {
    const cat = r?.category;
    if (cat && cat in groups) {
      groups[cat].push(r);
    }
  }
  return groups;
}

/**
 * Build a map from row id → 1-based index in the input array. Pure — the
 * same input order always produces the same map. Used to render "№" badges
 * on per-step row lists.
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
  const step1Ids = new Set(step1Rows.map((r) => r.id).filter(Boolean));
  for (const l of links) {
    if (!l?.fromId) continue;
    const from = rowMap.get(l.fromId);
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
  for (const cat of ALL_CATEGORIES) {
    out[cat] = [];
  }
  return out;
}

function emptyCategoryCounts(): Record<FtsFunctionCategory, number> {
  const out = {} as Record<FtsFunctionCategory, number>;
  for (const cat of ALL_CATEGORIES) {
    out[cat] = 0;
  }
  return out;
}

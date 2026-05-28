import type { Link, Row } from "src/entities/fts-function/types";

import { useMemo } from "react";

export type SelectionLinks = {
  /** Set of row ids linked to the currently selected row (either direction). */
  linkedIds: Set<string>;
  /** Subset of `links` touching `selectedId`, in original order. */
  selectedLinks: Link[];
  /** Resolved row record for `selectedId`, or null when nothing is selected. */
  selectedRow: Row | null;
};

/**
 * Coordinates derived data that depends on the currently selected row:
 * the set of linked ids, the relevant subset of links, and the row record
 * itself. Replaces three overlapping `useMemo`s in the modal body.
 */
export function useSelectionLinks(
  links: Link[],
  selectedId: string | null,
  rowMap: Map<string, Row>,
): SelectionLinks {
  const linkedIds = useMemo(() => {
    const ids = new Set<string>();
    if (!selectedId) return ids;
    for (const l of links) {
      if (!l) continue;
      if (l.fromId === selectedId && l.toId) ids.add(l.toId);
      if (l.toId === selectedId && l.fromId) ids.add(l.fromId);
    }
    return ids;
  }, [links, selectedId]);

  const selectedLinks = useMemo(() => {
    if (!selectedId) return [];
    return links.filter(
      (l) => l?.fromId === selectedId || l?.toId === selectedId,
    );
  }, [links, selectedId]);

  const selectedRow = useMemo(
    () => (selectedId ? (rowMap.get(selectedId) ?? null) : null),
    [selectedId, rowMap],
  );

  return { linkedIds, selectedLinks, selectedRow };
}

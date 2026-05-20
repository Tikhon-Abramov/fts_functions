import type { Row } from "src/entities/fts-function/types";

import { useCallback } from "react";

/**
 * The four discrete visual states a row can occupy. Replaces the four-branch
 * nested-ternary the modal used to compute background, hover, and outline.
 */
export const RowPresentation = {
  SELECTED: "SELECTED",
  LINKED: "LINKED",
  DIMMED: "DIMMED",
  NORMAL: "NORMAL",
} as const;
export type RowPresentation =
  (typeof RowPresentation)[keyof typeof RowPresentation];

export type RowPresentationResolver = (row: Row) => RowPresentation;

/**
 * Returns a stable resolver mapping each row to a single `RowPresentation`
 * symbol. Consumers translate the symbol to styles via a Record map, keeping
 * branching out of JSX.
 */
export function useRowPresentation(
  selectedId: string | null,
  linkedIds: Set<string>,
): RowPresentationResolver {
  return useCallback(
    (row: Row): RowPresentation => {
      if (row.id === selectedId) return RowPresentation.SELECTED;
      if (linkedIds.has(row.id)) return RowPresentation.LINKED;
      if (selectedId !== null) return RowPresentation.DIMMED;
      return RowPresentation.NORMAL;
    },
    [selectedId, linkedIds],
  );
}

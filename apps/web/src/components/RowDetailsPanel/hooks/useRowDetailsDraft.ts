import type { Row } from "src/entities/fts-function/types";

import { useCallback, useEffect, useState } from "react";

export type RowDraft = Partial<Row>;

const DEFAULT_PERIODICITY = "DAILY" as const;
const DEFAULT_COMPLEXITY = "MIDDLE" as const;

function buildDraft(row: Row): RowDraft {
  return {
    category: row.category,
    detailText: row.detailText ?? "",
    actionLabel: row.actionLabel,
    who: row.who ?? "",
    periodicity: row.periodicity || DEFAULT_PERIODICITY,
    complexity: row.complexity || DEFAULT_COMPLEXITY,
    artifact: row.artifact ?? "",
    basis: row.basis ?? "",
    artifactUsage: row.artifactUsage ?? "",
    purpose: row.purpose ?? "",
  };
}

/**
 * Edit-draft state for a single Row. Kept as useState (not RHF) because:
 *   1. The view/edit toggle resets the draft on row change.
 *   2. The draft is initialized lazily on edit-start (not on mount), so
 *      RHF's defaultValues / reset cycle adds noise without saving lines.
 *   3. There is no validation logic — the form is always submittable.
 */
export function useRowDetailsDraft(row: Row | null) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RowDraft>({});

  useEffect(() => {
    setEditing(false);
    setDraft({});
  }, [row?.id]);

  const startEdit = useCallback(() => {
    if (!row) return;
    setDraft(buildDraft(row));
    setEditing(true);
  }, [row]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft({});
  }, []);

  const finishEdit = useCallback(() => {
    setEditing(false);
  }, []);

  const setField = useCallback((key: keyof Row, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { editing, draft, startEdit, cancelEdit, finishEdit, setField };
}

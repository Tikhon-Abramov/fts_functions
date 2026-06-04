import type { Row } from "src/entities/fts-function/types";

import { useCallback, useEffect, useState } from "react";

import { RowField } from "src/entities/fts-function/model";

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
    technologicalSolution: row.technologicalSolution ?? "",
    number: row.number ?? "",
    responsible: row.responsible ?? "",
    algorithm: row.algorithm ?? "",
  };
}

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
    setDraft((prev) => {
      if (key === RowField.TECHNOLOGICAL_SOLUTION && !value.trim()) {
        return {
          ...prev,
          technologicalSolution: "",
          number: "",
          responsible: "",
          algorithm: "",
        };
      }

      return { ...prev, [key]: value };
    });
  }, []);

  return { editing, draft, startEdit, cancelEdit, finishEdit, setField };
}
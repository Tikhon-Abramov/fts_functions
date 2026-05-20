/**
 * Registry of `Row` field names. Domain-meaningful identifiers — referenced
 * via `[RowField.PERIODICITY]:` in resolver/lookup maps so that every
 * reference to a row field flows through a single grep target. See
 * patterns.md §Class 27 ("literal property keys for domain-meaningful
 * identifiers").
 */
export const RowField = {
  CATEGORY: "category",
  DETAIL_TEXT: "detailText",
  ACTION_LABEL: "actionLabel",
  WHO: "who",
  PERIODICITY: "periodicity",
  COMPLEXITY: "complexity",
  ARTIFACT: "artifact",
  BASIS: "basis",
  ARTIFACT_USAGE: "artifactUsage",
  PURPOSE: "purpose",
} as const;

export type RowFieldName = (typeof RowField)[keyof typeof RowField];

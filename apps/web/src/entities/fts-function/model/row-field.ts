/**
 * Registry of UI row field keys.
 * Keeps field-name usage centralized and avoids string literals in forms,
 * details panels and resolvers.
 */
export const RowField = {
  ID: "id",
  STEP: "step",
  CATEGORY: "category",
  DETAIL_TEXT: "detailText",
  WHO: "who",
  ACTION_LABEL: "actionLabel",
  PERIODICITY: "periodicity",
  COMPLEXITY: "complexity",
  ARTIFACT: "artifact",
  BASIS: "basis",
  ARTIFACT_USAGE: "artifactUsage",
  PURPOSE: "purpose",
  TECHNOLOGICAL_SOLUTION: "technologicalSolution",
  NUMBER: "number",
  RESPONSIBLE: "responsible",
  ALGORITHM: "algorithm",
} as const;

export type RowField = (typeof RowField)[keyof typeof RowField];
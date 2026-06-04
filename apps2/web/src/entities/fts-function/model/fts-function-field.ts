/**
 * Registry of `FunctionRecord` (DataGrid row) field names. Domain-meaningful
 * identifiers — referenced via `[FtsFunctionField.X]:` in column configs,
 * filter translators, and any cross-cutting field-name lookup so every
 * reference flows through a single grep target. See patterns.md §Class 2
 * (string-literal unions → const-as-const) and §Class 27 (literal property
 * keys for domain identifiers).
 *
 * Values must match keys of `FunctionRecord` in
 * `apps/web/src/entities/fts-function/types.ts` (plus the synthetic
 * `actions` column that has no row backing). The TypeScript compiler will
 * not enforce that — keep this list in lock-step with `FunctionRecord` by
 * hand.
 */
export const FtsFunctionField = {
  ID: "id",
  ACTIONS: "actions",
  NAME: "name",
  MARKER: "marker",
  STRATEGY_PROJECTS: "strategyProjects",
  CENTRALIZATION: "centralization",
  COMPETENCE_CENTER: "competenceCenter",
  CURATOR_CA: "curatorCA",
  NU_ZNU: "nuZnu",
  MANAGER_MIUDOL: "managerMiudol",
  NI_ZNI: "niZni",
} as const;

export type FtsFunctionField =
  (typeof FtsFunctionField)[keyof typeof FtsFunctionField];

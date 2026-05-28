/**
 * Const-as-const зеркала Prisma-enum'ов. Живут в shared-пакете, чтобы фронт
 * мог импортировать их без зависимости от серверного Prisma-клиента.
 *
 * Соответствие со сгенерированными Prisma-типами проверяется компилятором
 * бэкенда через `AssertEqual` (см. `apps/api/src/common/contract/enum-assertions.ts`).
 */
export * from "./contract-assert";

export * from "./fts-function-category";
export * from "./fts-function-step";
export * from "./fts-function-action-type";
export * from "./fts-function-execution-frequency";
export * from "./fts-function-complexity";
export * from "./fts-function-relation-type";

export const UserRole = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const FtsPositionRole = {
  DEPUTY_CHIEF: "DEPUTY_CHIEF",
  CHIEF: "CHIEF",
} as const;
export type FtsPositionRole =
  (typeof FtsPositionRole)[keyof typeof FtsPositionRole];

export const FtsFunctionRole = {
  CURATOR: "CURATOR",
  MANAGER: "MANAGER",
} as const;
export type FtsFunctionRole =
  (typeof FtsFunctionRole)[keyof typeof FtsFunctionRole];

export const FtsBranchType = {
  CENTRAL_OFFICE: "CENTRAL_OFFICE",
  INTERREGIONAL_INSPECTION: "INTERREGIONAL_INSPECTION",
} as const;
export type FtsBranchType = (typeof FtsBranchType)[keyof typeof FtsBranchType];

export const Category = {
  FTS_CENTRALIZATION: "FTS_CENTRALIZATION",
  FTS_FUNCTION_NAME: "FTS_FUNCTION_NAME",
  FTS_FUNCTION_STEP: "FTS_FUNCTION_STEP",
  FTS_FUNCTION_CATEGORY: "FTS_FUNCTION_CATEGORY",
  FTS_FUNCTION_MARKER: "FTS_FUNCTION_MARKER",
  FTS_FUNCTION_COMPLEXITY: "FTS_FUNCTION_COMPLEXITY",
  FTS_FUNCTION_EXECUTION_FREQUENCY: "FTS_FUNCTION_EXECUTION_FREQUENCY",
  WHO_PERFORMS_ACTION: "WHO_PERFORMS_ACTION",
  FTS_FUNCTION_ACTION_TYPE: "FTS_FUNCTION_ACTION_TYPE",
  FTS_FUNCTION_EFFECTIVENESS: "FTS_FUNCTION_EFFECTIVENESS",
  FTS_COMPETENCY_CENTER: "FTS_COMPETENCY_CENTER",
  FTS_DTI: "FTS_DTI",
  FTS_FUNCTION_RELATION_TYPE: "FTS_FUNCTION_RELATION_TYPE",
} as const;
export type Category = (typeof Category)[keyof typeof Category];

export const ActionHistoryType = {
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;
export type ActionHistoryType =
  (typeof ActionHistoryType)[keyof typeof ActionHistoryType];

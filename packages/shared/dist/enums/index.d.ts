/**
 * Compile-time guard: A and B must be exact equal sets.
 * Fails the build if they drift.
 *
 * Usage:
 *   type _Contract = AssertEqual<SharedEnum, PrismaEnum>;
 *   const _check: _Contract = true;
 */
type AssertEqual<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;

/**
 * Source of truth — domain codes for the `FTS_FUNCTION_CATEGORY` bucket.
 *
 * These values are NOT Prisma enums; they are stored as `Type.code` strings
 * under `Type.category = 'FTS_FUNCTION_CATEGORY'` (see Prisma's `Category`
 * enum + the seed in `apps/api/db/seeds/constants.ts`). The compiler cannot
 * structurally assert these against Prisma. Drift is guarded by the
 * sibling-type contract below: editing the shared enum without updating
 * `_ExpectedCodes` (or vice-versa) fails the build.
 */
declare const FtsFunctionCategory: {
    readonly METHODOLOGY: "METHODOLOGY";
    readonly ACTUAL_ACTION: "ACTUAL_ACTION";
    readonly CONTROL_ANALYTICS: "CONTROL_ANALYTICS";
};
type FtsFunctionCategory = (typeof FtsFunctionCategory)[keyof typeof FtsFunctionCategory];

/**
 * Source of truth — domain codes for the `FTS_FUNCTION_STEP` bucket.
 *
 * Stored as `Type.code` strings under `Type.category = 'FTS_FUNCTION_STEP'`.
 * Drift is guarded by the sibling-type contract below.
 */
declare const FtsFunctionStep: {
    readonly OBJECT_SELECTION: "OBJECT_SELECTION";
    readonly CLUSTERING_IMPACT: "CLUSTERING_IMPACT";
};
type FtsFunctionStep = (typeof FtsFunctionStep)[keyof typeof FtsFunctionStep];

/**
 * Source of truth — domain codes for the `FTS_FUNCTION_ACTION_TYPE` bucket.
 *
 * Stored as `Type.code` strings under
 * `Type.category = 'FTS_FUNCTION_ACTION_TYPE'`. Drift is guarded by the
 * sibling-type contract below.
 */
declare const FtsFunctionActionType: {
    readonly KEEP: "KEEP";
    readonly TRANSFER: "TRANSFER";
    readonly OPTIMIZE: "OPTIMIZE";
    readonly OPTIMIZE_TRANSFER: "OPTIMIZE_TRANSFER";
    readonly REMOVE: "REMOVE";
};
type FtsFunctionActionType = (typeof FtsFunctionActionType)[keyof typeof FtsFunctionActionType];

/**
 * Source of truth — domain codes for the `FTS_FUNCTION_EXECUTION_FREQUENCY`
 * bucket exposed to the UI.
 *
 * NOTE: the seed in `apps/api/db/seeds/constants.ts` defines additional
 * frequencies (QUARTERLY, ANNUALLY, TEN_DAYS, TWO_WEEKS, TWO_MONTHS,
 * HALF_YEAR, AS_PER_FNS_ORDER). The UI currently surfaces only the three
 * variants below; backend tolerates the others as opaque `Type.code`
 * strings. Drift on these three is guarded by the sibling-type contract.
 */
declare const FtsFunctionExecutionFrequency: {
    readonly DAILY: "DAILY";
    readonly WEEKLY: "WEEKLY";
    readonly MONTHLY: "MONTHLY";
};
type FtsFunctionExecutionFrequency = (typeof FtsFunctionExecutionFrequency)[keyof typeof FtsFunctionExecutionFrequency];

/**
 * Source of truth — domain codes for the `FTS_FUNCTION_COMPLEXITY` bucket.
 *
 * Stored as `Type.code` strings under
 * `Type.category = 'FTS_FUNCTION_COMPLEXITY'`. Drift is guarded by the
 * sibling-type contract below.
 */
declare const FtsFunctionComplexity: {
    readonly SIMPLE: "SIMPLE";
    readonly MIDDLE: "MIDDLE";
    readonly HARD: "HARD";
};
type FtsFunctionComplexity = (typeof FtsFunctionComplexity)[keyof typeof FtsFunctionComplexity];

/**
 * Source of truth — domain codes for the `FTS_FUNCTION_RELATION_TYPE` bucket.
 *
 * Stored as `Type.code` strings under
 * `Type.category = 'FTS_FUNCTION_RELATION_TYPE'`. Drift is guarded by the
 * sibling-type contract below.
 */
declare const FtsFunctionRelationType: {
    readonly CONNECTED: "CONNECTED";
    readonly DEPENDS_ON: "DEPENDS_ON";
    readonly CONTROLS: "CONTROLS";
};
type FtsFunctionRelationType = (typeof FtsFunctionRelationType)[keyof typeof FtsFunctionRelationType];

/**
 * Const-as-const зеркала Prisma-enum'ов. Живут в shared-пакете, чтобы фронт
 * мог импортировать их без зависимости от серверного Prisma-клиента.
 *
 * Соответствие со сгенерированными Prisma-типами проверяется компилятором
 * бэкенда через `AssertEqual` (см. `apps/api/src/common/contract/enum-assertions.ts`).
 */

declare const UserRole: {
    readonly ADMIN: "ADMIN";
    readonly USER: "USER";
};
type UserRole = (typeof UserRole)[keyof typeof UserRole];
declare const FtsPositionRole: {
    readonly DEPUTY_CHIEF: "DEPUTY_CHIEF";
    readonly CHIEF: "CHIEF";
};
type FtsPositionRole = (typeof FtsPositionRole)[keyof typeof FtsPositionRole];
declare const FtsFunctionRole: {
    readonly CURATOR: "CURATOR";
    readonly MANAGER: "MANAGER";
};
type FtsFunctionRole = (typeof FtsFunctionRole)[keyof typeof FtsFunctionRole];
declare const FtsBranchType: {
    readonly CENTRAL_OFFICE: "CENTRAL_OFFICE";
    readonly INTERREGIONAL_INSPECTION: "INTERREGIONAL_INSPECTION";
};
type FtsBranchType = (typeof FtsBranchType)[keyof typeof FtsBranchType];
declare const Category: {
    readonly FTS_CENTRALIZATION: "FTS_CENTRALIZATION";
    readonly FTS_FUNCTION_NAME: "FTS_FUNCTION_NAME";
    readonly FTS_FUNCTION_STEP: "FTS_FUNCTION_STEP";
    readonly FTS_FUNCTION_CATEGORY: "FTS_FUNCTION_CATEGORY";
    readonly FTS_FUNCTION_MARKER: "FTS_FUNCTION_MARKER";
    readonly FTS_FUNCTION_COMPLEXITY: "FTS_FUNCTION_COMPLEXITY";
    readonly FTS_FUNCTION_EXECUTION_FREQUENCY: "FTS_FUNCTION_EXECUTION_FREQUENCY";
    readonly WHO_PERFORMS_ACTION: "WHO_PERFORMS_ACTION";
    readonly FTS_FUNCTION_ACTION_TYPE: "FTS_FUNCTION_ACTION_TYPE";
    readonly FTS_FUNCTION_EFFECTIVENESS: "FTS_FUNCTION_EFFECTIVENESS";
    readonly FTS_COMPETENCY_CENTER: "FTS_COMPETENCY_CENTER";
    readonly FTS_DTI: "FTS_DTI";
    readonly FTS_FUNCTION_RELATION_TYPE: "FTS_FUNCTION_RELATION_TYPE";
};
type Category = (typeof Category)[keyof typeof Category];
declare const ActionHistoryType: {
    readonly INSERT: "INSERT";
    readonly UPDATE: "UPDATE";
    readonly DELETE: "DELETE";
};
type ActionHistoryType = (typeof ActionHistoryType)[keyof typeof ActionHistoryType];

export { ActionHistoryType, type AssertEqual, Category, FtsBranchType, FtsFunctionActionType, FtsFunctionCategory, FtsFunctionComplexity, FtsFunctionExecutionFrequency, FtsFunctionRelationType, FtsFunctionRole, FtsFunctionStep, FtsPositionRole, UserRole };

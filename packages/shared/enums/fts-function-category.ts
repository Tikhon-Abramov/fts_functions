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
// prettier-ignore
export const FtsFunctionCategory = {
  METHODOLOGY:       'METHODOLOGY',
  ACTUAL_ACTION:     'ACTUAL_ACTION',
  CONTROL_ANALYTICS: 'CONTROL_ANALYTICS',
} as const;
export type FtsFunctionCategory =
  (typeof FtsFunctionCategory)[keyof typeof FtsFunctionCategory];

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AssertEqual } from "./contract-assert";
type _ExpectedFtsFunctionCategoryCodes =
  | "METHODOLOGY"
  | "ACTUAL_ACTION"
  | "CONTROL_ANALYTICS";
type _FtsFunctionCategoryContract = AssertEqual<
  FtsFunctionCategory,
  _ExpectedFtsFunctionCategoryCodes
>;
const _ftsFunctionCategoryCheck: _FtsFunctionCategoryContract = true;
void _ftsFunctionCategoryCheck;
/* eslint-enable @typescript-eslint/no-unused-vars */

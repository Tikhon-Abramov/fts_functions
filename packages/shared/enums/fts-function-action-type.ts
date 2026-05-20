/**
 * Source of truth — domain codes for the `FTS_FUNCTION_ACTION_TYPE` bucket.
 *
 * Stored as `Type.code` strings under
 * `Type.category = 'FTS_FUNCTION_ACTION_TYPE'`. Drift is guarded by the
 * sibling-type contract below.
 */
// prettier-ignore
export const FtsFunctionActionType = {
  KEEP:              'KEEP',
  TRANSFER:          'TRANSFER',
  OPTIMIZE:          'OPTIMIZE',
  OPTIMIZE_TRANSFER: 'OPTIMIZE_TRANSFER',
  REMOVE:            'REMOVE',
} as const;
export type FtsFunctionActionType =
  (typeof FtsFunctionActionType)[keyof typeof FtsFunctionActionType];

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AssertEqual } from "./contract-assert";
type _ExpectedFtsFunctionActionTypeCodes =
  | "KEEP"
  | "TRANSFER"
  | "OPTIMIZE"
  | "OPTIMIZE_TRANSFER"
  | "REMOVE";
type _FtsFunctionActionTypeContract = AssertEqual<
  FtsFunctionActionType,
  _ExpectedFtsFunctionActionTypeCodes
>;
const _ftsFunctionActionTypeCheck: _FtsFunctionActionTypeContract = true;
void _ftsFunctionActionTypeCheck;
/* eslint-enable @typescript-eslint/no-unused-vars */

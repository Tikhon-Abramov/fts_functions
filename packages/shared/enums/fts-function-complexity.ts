/**
 * Source of truth — domain codes for the `FTS_FUNCTION_COMPLEXITY` bucket.
 *
 * Stored as `Type.code` strings under
 * `Type.category = 'FTS_FUNCTION_COMPLEXITY'`. Drift is guarded by the
 * sibling-type contract below.
 */
// prettier-ignore
export const FtsFunctionComplexity = {
  SIMPLE: 'SIMPLE',
  MIDDLE: 'MIDDLE',
  HARD:   'HARD',
} as const;
export type FtsFunctionComplexity =
  (typeof FtsFunctionComplexity)[keyof typeof FtsFunctionComplexity];

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AssertEqual } from "./contract-assert";
type _ExpectedFtsFunctionComplexityCodes = "SIMPLE" | "MIDDLE" | "HARD";
type _FtsFunctionComplexityContract = AssertEqual<
  FtsFunctionComplexity,
  _ExpectedFtsFunctionComplexityCodes
>;
const _ftsFunctionComplexityCheck: _FtsFunctionComplexityContract = true;
void _ftsFunctionComplexityCheck;
/* eslint-enable @typescript-eslint/no-unused-vars */

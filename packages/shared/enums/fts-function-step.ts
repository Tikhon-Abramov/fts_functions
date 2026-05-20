/**
 * Source of truth — domain codes for the `FTS_FUNCTION_STEP` bucket.
 *
 * Stored as `Type.code` strings under `Type.category = 'FTS_FUNCTION_STEP'`.
 * Drift is guarded by the sibling-type contract below.
 */
// prettier-ignore
export const FtsFunctionStep = {
  OBJECT_SELECTION:  'OBJECT_SELECTION',
  CLUSTERING_IMPACT: 'CLUSTERING_IMPACT',
} as const;
export type FtsFunctionStep =
  (typeof FtsFunctionStep)[keyof typeof FtsFunctionStep];

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AssertEqual } from "./contract-assert";
type _ExpectedFtsFunctionStepCodes = "OBJECT_SELECTION" | "CLUSTERING_IMPACT";
type _FtsFunctionStepContract = AssertEqual<
  FtsFunctionStep,
  _ExpectedFtsFunctionStepCodes
>;
const _ftsFunctionStepCheck: _FtsFunctionStepContract = true;
void _ftsFunctionStepCheck;
/* eslint-enable @typescript-eslint/no-unused-vars */

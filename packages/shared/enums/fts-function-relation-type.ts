/**
 * Source of truth — domain codes for the `FTS_FUNCTION_RELATION_TYPE` bucket.
 *
 * Stored as `Type.code` strings under
 * `Type.category = 'FTS_FUNCTION_RELATION_TYPE'`. Drift is guarded by the
 * sibling-type contract below.
 */
// prettier-ignore
export const FtsFunctionRelationType = {
  CONNECTED:  'CONNECTED',
  DEPENDS_ON: 'DEPENDS_ON',
  CONTROLS:   'CONTROLS',
} as const;
export type FtsFunctionRelationType =
  (typeof FtsFunctionRelationType)[keyof typeof FtsFunctionRelationType];

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AssertEqual } from "./contract-assert";
type _ExpectedFtsFunctionRelationTypeCodes =
  | "CONNECTED"
  | "DEPENDS_ON"
  | "CONTROLS";
type _FtsFunctionRelationTypeContract = AssertEqual<
  FtsFunctionRelationType,
  _ExpectedFtsFunctionRelationTypeCodes
>;
const _ftsFunctionRelationTypeCheck: _FtsFunctionRelationTypeContract = true;
void _ftsFunctionRelationTypeCheck;
/* eslint-enable @typescript-eslint/no-unused-vars */

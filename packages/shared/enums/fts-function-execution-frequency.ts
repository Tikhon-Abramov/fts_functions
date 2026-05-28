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
// prettier-ignore
export const FtsFunctionExecutionFrequency = {
  DAILY:   'DAILY',
  WEEKLY:  'WEEKLY',
  MONTHLY: 'MONTHLY',
} as const;
export type FtsFunctionExecutionFrequency =
  (typeof FtsFunctionExecutionFrequency)[keyof typeof FtsFunctionExecutionFrequency];

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AssertEqual } from "./contract-assert";
type _ExpectedFtsFunctionExecutionFrequencyCodes =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY";
type _FtsFunctionExecutionFrequencyContract = AssertEqual<
  FtsFunctionExecutionFrequency,
  _ExpectedFtsFunctionExecutionFrequencyCodes
>;
const _ftsFunctionExecutionFrequencyCheck: _FtsFunctionExecutionFrequencyContract = true;
void _ftsFunctionExecutionFrequencyCheck;
/* eslint-enable @typescript-eslint/no-unused-vars */

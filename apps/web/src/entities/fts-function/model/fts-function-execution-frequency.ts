import type { I18nKey } from "src/shared/i18n/types";

import { I18N } from "src/shared/i18n/keys";

import { FtsFunctionExecutionFrequency } from "@registry/shared";

/**
 * Re-export the shared enum + type so existing imports from
 * `src/entities/fts-function/model[/fts-function-execution-frequency]` keep
 * working. Source of truth lives in
 * `packages/shared/enums/fts-function-execution-frequency.ts`.
 */
export { FtsFunctionExecutionFrequency };

export const FTS_FUNCTION_EXECUTION_FREQUENCY_LABEL: Record<
  FtsFunctionExecutionFrequency,
  I18nKey
> = {
  [FtsFunctionExecutionFrequency.DAILY]: I18N.periodicity.daily,
  [FtsFunctionExecutionFrequency.WEEKLY]: I18N.periodicity.weekly,
  [FtsFunctionExecutionFrequency.MONTHLY]: I18N.periodicity.monthly,
};

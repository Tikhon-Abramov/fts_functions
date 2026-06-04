import type { I18nKey } from "src/shared/i18n/types";

import { I18N } from "src/shared/i18n/keys";

import { FtsFunctionComplexity } from "@registry/shared";

/**
 * Re-export the shared enum + type so existing imports from
 * `src/entities/fts-function/model[/fts-function-complexity]` keep working.
 * Source of truth lives in `packages/shared/enums/fts-function-complexity.ts`.
 */
export { FtsFunctionComplexity };

export const FTS_FUNCTION_COMPLEXITY_LABEL: Record<
  FtsFunctionComplexity,
  I18nKey
> = {
  [FtsFunctionComplexity.SIMPLE]: I18N.complexity.low,
  [FtsFunctionComplexity.MIDDLE]: I18N.complexity.medium,
  [FtsFunctionComplexity.HARD]: I18N.complexity.high,
};

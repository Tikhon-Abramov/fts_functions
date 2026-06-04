import type { I18nKey } from "src/shared/i18n/types";

import { I18N } from "src/shared/i18n/keys";

import { FtsFunctionCategory } from "@registry/shared";

/**
 * Re-export the shared enum + type so existing imports from
 * `src/entities/fts-function/model[/fts-function-category]` keep working.
 * Source of truth lives in `packages/shared/enums/fts-function-category.ts`.
 */
export { FtsFunctionCategory };

/** Frontend-only i18n labels (i18n keys are a frontend concern). */
export const FTS_FUNCTION_CATEGORY_LABEL: Record<FtsFunctionCategory, I18nKey> =
  {
    [FtsFunctionCategory.METHODOLOGY]: I18N.category.methodology,
    [FtsFunctionCategory.ACTUAL_ACTION]: I18N.category.actualAction,
    [FtsFunctionCategory.CONTROL_ANALYTICS]: I18N.category.controlAnalytics,
  };

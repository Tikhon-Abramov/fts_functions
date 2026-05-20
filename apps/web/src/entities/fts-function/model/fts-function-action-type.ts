import type { I18nKey } from "src/shared/i18n/types";

import { I18N } from "src/shared/i18n/keys";

import { FtsFunctionActionType } from "@registry/shared";

/**
 * Re-export the shared enum + type so existing imports from
 * `src/entities/fts-function/model[/fts-function-action-type]` keep working.
 * Source of truth lives in `packages/shared/enums/fts-function-action-type.ts`.
 */
export { FtsFunctionActionType };

export const FTS_FUNCTION_ACTION_TYPE_LABEL: Record<
  FtsFunctionActionType,
  I18nKey
> = {
  [FtsFunctionActionType.KEEP]: I18N.action.keep,
  [FtsFunctionActionType.TRANSFER]: I18N.action.transfer,
  [FtsFunctionActionType.OPTIMIZE]: I18N.action.optimize,
  [FtsFunctionActionType.OPTIMIZE_TRANSFER]: I18N.action.optimizeTransfer,
  [FtsFunctionActionType.REMOVE]: I18N.action.remove,
};

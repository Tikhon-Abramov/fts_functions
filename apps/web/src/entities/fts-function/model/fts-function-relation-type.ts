import type { I18nKey } from "src/shared/i18n/types";

import { I18N } from "src/shared/i18n/keys";

import { FtsFunctionRelationType } from "@registry/shared";

/**
 * Re-export the shared enum + type so existing imports from
 * `src/entities/fts-function/model[/fts-function-relation-type]` keep working.
 * Source of truth lives in `packages/shared/enums/fts-function-relation-type.ts`.
 */
export { FtsFunctionRelationType };

export const FTS_FUNCTION_RELATION_TYPE_LABEL: Record<
  FtsFunctionRelationType,
  I18nKey
> = {
  [FtsFunctionRelationType.CONNECTED]: I18N.linkKind.related,
  [FtsFunctionRelationType.DEPENDS_ON]: I18N.linkKind.dependsOn,
  [FtsFunctionRelationType.CONTROLS]: I18N.linkKind.controls,
};

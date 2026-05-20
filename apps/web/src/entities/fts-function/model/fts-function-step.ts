import type { I18nKey } from "src/shared/i18n/types";

import { I18N } from "src/shared/i18n/keys";

import { FtsFunctionStep } from "@registry/shared";

/**
 * Re-export the shared enum + type so existing imports from
 * `src/entities/fts-function/model[/fts-function-step]` keep working.
 * Source of truth lives in `packages/shared/enums/fts-function-step.ts`.
 */
export { FtsFunctionStep };

/** i18n key per code — render-time label resolution. */
export const FTS_FUNCTION_STEP_LABEL: Record<FtsFunctionStep, I18nKey> = {
  [FtsFunctionStep.OBJECT_SELECTION]: I18N.modal.step1Title,
  [FtsFunctionStep.CLUSTERING_IMPACT]: I18N.modal.step2Title,
};

/**
 * Short 1-based number for the step, used where the UI renders a literal
 * "Шаг N" label (i18n templates take `{{step}}`). The numeric form never
 * leaves UI-rendering callsites — the domain model uses the string code.
 */
export const FTS_FUNCTION_STEP_NUMBER: Record<FtsFunctionStep, 1 | 2> = {
  [FtsFunctionStep.OBJECT_SELECTION]: 1,
  [FtsFunctionStep.CLUSTERING_IMPACT]: 2,
};

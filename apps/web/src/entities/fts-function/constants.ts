import type { Row } from "./types";

import { I18N, type I18nKey } from "src/shared/i18n";

import { FtsFunctionActionType } from "./model/fts-function-action-type";
import { FtsFunctionCategory } from "./model/fts-function-category";
import { FtsFunctionComplexity } from "./model/fts-function-complexity";
import { FtsFunctionExecutionFrequency } from "./model/fts-function-execution-frequency";
import { FtsFunctionRelationType } from "./model/fts-function-relation-type";

// ---- canonical domain code lists ----

export const CATEGORIES: FtsFunctionCategory[] =
  Object.values(FtsFunctionCategory);

export const ACTIONS: FtsFunctionActionType[] = Object.values(
  FtsFunctionActionType,
);

export const KINDS: FtsFunctionRelationType[] = Object.values(
  FtsFunctionRelationType,
);

export const PERIODICITIES: FtsFunctionExecutionFrequency[] = Object.values(
  FtsFunctionExecutionFrequency,
);

export const COMPLEXITIES: FtsFunctionComplexity[] = Object.values(
  FtsFunctionComplexity,
);

// Display labels for codes are resolved at render-time from the DB `Type.name`
// via `findTypeNameByCode(typesAll, code)`. No i18n maps for option labels.

// Extra passport fields shown on the row-details panel.
export const EXTRA_FIELD_KEYS: Array<{ key: keyof Row; labelKey: I18nKey }> = [
  { key: "who", labelKey: I18N.field.who },
  { key: "periodicity", labelKey: I18N.field.periodicity },
  { key: "complexity", labelKey: I18N.field.complexity },
  { key: "artifact", labelKey: I18N.field.artifact },
  { key: "basis", labelKey: I18N.field.basis },
  { key: "artifactUsage", labelKey: I18N.field.artifactUsage },
  { key: "purpose", labelKey: I18N.field.purpose },
];

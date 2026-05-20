import type { Row } from "src/entities/fts-function/types";
import type { I18nKey } from "src/shared/i18n";

import {
  ACTIONS,
  CATEGORIES,
  COMPLEXITIES,
  PERIODICITIES,
} from "src/entities/fts-function/constants";
import { RowField } from "src/entities/fts-function/model";
import { I18N } from "src/shared/i18n";

import { Category } from "@registry/shared/enums";

/**
 * Field-kind enum drives rendering modes.
 *  - SELECT_CODE — fixed option set of domain codes; label resolved at render
 *    time from `typesAll` via `findTypeNameByCode` (DB is source of truth).
 *  - AUTOCOMPLETE_FROM_TYPES — free-form text with autocomplete suggestions
 *    sourced from the DB `type` table (filter by `typeCategory`).
 *  - TEXT — single-line free text.
 *  - TEXTAREA — multi-line free text.
 */
export const FieldKind = {
  SELECT_CODE: "SELECT_CODE",
  AUTOCOMPLETE_FROM_TYPES: "AUTOCOMPLETE_FROM_TYPES",
  TEXT: "TEXT",
  TEXTAREA: "TEXTAREA",
} as const;
export type FieldKind = (typeof FieldKind)[keyof typeof FieldKind];

export type SelectCodeOption = {
  /** Stored on the row (backend code, e.g. "DAILY"). Label is resolved at
   * render time from `typesAll` via `findTypeNameByCode(typesAll, value)`. */
  value: string;
};

export type ExtraFieldConfig = {
  key: keyof Row;
  labelKey: I18nKey;
  kind: FieldKind;
  /** Domain-code options for SELECT_CODE fields. */
  options?: readonly SelectCodeOption[];
  /** Filter `typesAll` by this `Type.category` for AUTOCOMPLETE_FROM_TYPES. */
  typeCategory?: Category;
  testId: string;
};

const periodicityOptions: SelectCodeOption[] = PERIODICITIES.map((p) => ({
  value: p,
}));
const complexityOptions: SelectCodeOption[] = COMPLEXITIES.map((x) => ({
  value: x,
}));
const categoryOptions: SelectCodeOption[] = CATEGORIES.map((c) => ({
  value: c,
}));
const actionOptions: SelectCodeOption[] = ACTIONS.map((a) => ({
  value: a,
}));

/**
 * Primary detail-row fields — created via AddItemForm and editable from the
 * Сведения panel. Rendered before `EXTRA_FIELDS` in the edit form. The read
 * view has its own hardcoded section for these (see RowDetailsView), so this
 * registry only drives the edit form.
 */
export const PRIMARY_FIELDS: ExtraFieldConfig[] = [
  {
    key: RowField.CATEGORY,
    labelKey: I18N.field.category,
    kind: FieldKind.SELECT_CODE,
    options: categoryOptions,
    testId: "details-panel-category",
  },
  {
    key: RowField.DETAIL_TEXT,
    labelKey: I18N.field.detail,
    kind: FieldKind.TEXTAREA,
    testId: "details-panel-detail-text",
  },
  {
    key: RowField.WHO,
    labelKey: I18N.field.who,
    kind: FieldKind.AUTOCOMPLETE_FROM_TYPES,
    typeCategory: Category.WHO_PERFORMS_ACTION,
    testId: "details-panel-who",
  },
  {
    key: RowField.ACTION_LABEL,
    labelKey: I18N.field.action,
    kind: FieldKind.SELECT_CODE,
    options: actionOptions,
    testId: "details-panel-action",
  },
];

/**
 * Single source of truth for row-details extra fields. Keys flow through the
 * `RowField` registry per Class 27. Both the read view and edit form iterate
 * this list — the edit form branches on `kind` to render the appropriate
 * input.
 */
export const EXTRA_FIELDS: ExtraFieldConfig[] = [
  {
    key: RowField.PERIODICITY,
    labelKey: I18N.field.periodicity,
    kind: FieldKind.SELECT_CODE,
    options: periodicityOptions,
    testId: "details-panel-periodicity",
  },
  {
    key: RowField.COMPLEXITY,
    labelKey: I18N.field.complexity,
    kind: FieldKind.SELECT_CODE,
    options: complexityOptions,
    testId: "details-panel-complexity",
  },
  {
    key: RowField.ARTIFACT,
    labelKey: I18N.field.artifact,
    kind: FieldKind.TEXT,
    testId: "details-panel-artifact",
  },
  {
    key: RowField.BASIS,
    labelKey: I18N.field.basis,
    kind: FieldKind.TEXT,
    testId: "details-panel-basis",
  },
  {
    key: RowField.ARTIFACT_USAGE,
    labelKey: I18N.field.artifactUsage,
    kind: FieldKind.TEXTAREA,
    testId: "details-panel-artifactUsage",
  },
  {
    key: RowField.PURPOSE,
    labelKey: I18N.field.purpose,
    kind: FieldKind.TEXTAREA,
    testId: "details-panel-purpose",
  },
];

export function countFilled(row: Row): number {
  return EXTRA_FIELDS.filter((f) => {
    const val = row[f.key];
    return val !== undefined && val !== null && String(val).trim() !== "";
  }).length;
}

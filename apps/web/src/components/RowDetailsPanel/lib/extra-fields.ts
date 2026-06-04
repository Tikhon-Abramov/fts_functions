import type { Row } from "src/entities/fts-function/types";
import type { I18nKey } from "src/shared/i18n";

import {
  CATEGORIES,
  COMPLEXITIES,
  PERIODICITIES,
} from "src/entities/fts-function/constants";
import {
  DETAIL_TYPE_CATEGORY,
  TECHNOLOGY_DETAIL_LABELS,
  type TypeCategory,
} from "src/entities/fts-function/lib/detail-technology";
import { RowField } from "src/entities/fts-function/model";
import { I18N } from "src/shared/i18n";

export const FieldKind = {
  SELECT_CODE: "SELECT_CODE",
  SELECT_TYPE_CODE: "SELECT_TYPE_CODE",
  AUTOCOMPLETE_FROM_TYPES: "AUTOCOMPLETE_FROM_TYPES",
  TEXT: "TEXT",
  TEXTAREA: "TEXTAREA",
} as const;

export type FieldKind = (typeof FieldKind)[keyof typeof FieldKind];

export type SelectCodeOption = {
  value: string;
};

export type ExtraFieldConfig = {
  key: keyof Row;
  labelKey?: I18nKey;
  label?: string;
  kind: FieldKind;
  options?: readonly SelectCodeOption[];
  typeCategory?: TypeCategory;
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
    typeCategory: DETAIL_TYPE_CATEGORY.WHO_PERFORMS_ACTION,
    testId: "details-panel-who",
  },
];

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

export const TECHNOLOGY_FIELDS: ExtraFieldConfig[] = [
  {
    key: RowField.TECHNOLOGICAL_SOLUTION,
    label: TECHNOLOGY_DETAIL_LABELS.technologicalSolution,
    kind: FieldKind.SELECT_TYPE_CODE,
    typeCategory: DETAIL_TYPE_CATEGORY.TECHNOLOGICAL_SOLUTION,
    testId: "details-panel-technological-solution",
  },
  {
    key: RowField.NUMBER,
    label: TECHNOLOGY_DETAIL_LABELS.number,
    kind: FieldKind.TEXT,
    testId: "details-panel-number",
  },
  {
    key: RowField.RESPONSIBLE,
    label: TECHNOLOGY_DETAIL_LABELS.responsible,
    kind: FieldKind.SELECT_TYPE_CODE,
    typeCategory: DETAIL_TYPE_CATEGORY.RESPONSIBLE,
    testId: "details-panel-responsible",
  },
  {
    key: RowField.ALGORITHM_FILE,
    label: TECHNOLOGY_DETAIL_LABELS.algorithm,
    kind: FieldKind.TEXTAREA,
    testId: "details-panel-algorithm",
  },
  {
    key: RowField.ALGORITHM,
    label: "",
    kind: FieldKind.TEXTAREA,
    testId: "details-panel-algorithm-file",
  },
];

export function getFieldLabel(
    field: ExtraFieldConfig,
    t: (key: I18nKey) => string,
): string {
  if (field.label) return field.label;

  return field.labelKey ? t(field.labelKey) : "";
}

export function countFilled(
    row: Row,
    fields: readonly ExtraFieldConfig[] = EXTRA_FIELDS,
): number {
  return fields.filter((f) => {
    const val = row[f.key];

    return val !== undefined && val !== null && String(val).trim() !== "";
  }).length;
}
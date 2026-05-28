import type {
  GridFilterItem,
  GridFilterModel,
  GridSortModel,
} from "@mui/x-data-grid";
import type { FtsFunctionControllerListV1ApiArg } from "src/shared/api/ftsFunctionsApi";

import { FtsFunctionField } from "src/entities/fts-function/model";

export type ListQueryArgs = Partial<FtsFunctionControllerListV1ApiArg>;

type SortBy = NonNullable<FtsFunctionControllerListV1ApiArg["sortBy"]>;

const SORTABLE_FIELDS: readonly SortBy[] = ["createdAt", "updatedAt", "id"];

export const DICTIONARY_PARAM = {
  COMPETENCY_CENTER_IDS: "competencyCenterIds",
  FTS_FUNCTION_NAME_IDS: "ftsFunctionNameIds",
  FTS_FUNCTION_MARKER_IDS: "ftsFunctionMarkerIds",
  FTS_CENTRALIZATION_IDS: "ftsCentralizationIds",
  DTI_IDS: "dtiIds",
  CURATOR_CENTRAL_OFFICE_IDS: "curatorCentralOfficeIds",
  MANAGER_INTERREGIONAL_INSPECTION_IDS: "managerInterregionalInspectionIds",
  DEPARTMENT_HEAD_CENTRAL_OFFICE_IDS: "departmentHeadCentralOfficeIds",
  DEPARTMENT_HEAD_INTERREGIONAL_INSPECTION_IDS:
      "departmentHeadInterregionalInspectionIds",
} as const;

export type DictionaryParam =
    (typeof DICTIONARY_PARAM)[keyof typeof DICTIONARY_PARAM];

const DICTIONARY_FIELD_TO_PARAM: Readonly<Record<string, DictionaryParam>> = {
  [FtsFunctionField.NAME]: DICTIONARY_PARAM.FTS_FUNCTION_NAME_IDS,
  [FtsFunctionField.MARKER]: DICTIONARY_PARAM.FTS_FUNCTION_MARKER_IDS,
  [FtsFunctionField.STRATEGY_PROJECTS]: DICTIONARY_PARAM.DTI_IDS,
  [FtsFunctionField.CENTRALIZATION]: DICTIONARY_PARAM.FTS_CENTRALIZATION_IDS,
  [FtsFunctionField.COMPETENCE_CENTER]:
  DICTIONARY_PARAM.COMPETENCY_CENTER_IDS,
  [FtsFunctionField.CURATOR_CA]:
  DICTIONARY_PARAM.CURATOR_CENTRAL_OFFICE_IDS,
  [FtsFunctionField.NU_ZNU]:
  DICTIONARY_PARAM.DEPARTMENT_HEAD_CENTRAL_OFFICE_IDS,
  [FtsFunctionField.MANAGER_MIUDOL]:
  DICTIONARY_PARAM.MANAGER_INTERREGIONAL_INSPECTION_IDS,
  [FtsFunctionField.NI_ZNI]:
  DICTIONARY_PARAM.DEPARTMENT_HEAD_INTERREGIONAL_INSPECTION_IDS,
};

export function translateFilterModel(model: GridFilterModel): ListQueryArgs {
  const args: ListQueryArgs = {};

  for (const item of model.items) {
    if (item.field === FtsFunctionField.ID) {
      applyIdFilter(args, item);
      continue;
    }

    applyDictionaryFilter(args, item);
  }

  return args;
}

export function translateSortModel(
    model: GridSortModel,
): Pick<FtsFunctionControllerListV1ApiArg, "sortBy" | "sortDir"> {
  if (model.length === 0) return {};

  if (model.length > 1) {
    // eslint-disable-next-line no-console
    console.warn(
        "Multi-column sort is not supported by the backend; using first sort item only.",
    );
  }

  const first = model[0];

  if (!first) return {};
  if (!isSortableField(first.field)) return {};

  const out: Pick<FtsFunctionControllerListV1ApiArg, "sortBy" | "sortDir"> = {
    sortBy: first.field,
  };

  if (first.sort === "asc" || first.sort === "desc") {
    out.sortDir = first.sort;
  }

  return out;
}

function isSortableField(field: string): field is SortBy {
  return (SORTABLE_FIELDS as readonly string[]).includes(field);
}

function toFiniteNumber(value: unknown): number | null {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function toFiniteNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  const out: number[] = [];

  for (const item of value) {
    const numberValue = Number(item);

    if (Number.isFinite(numberValue)) out.push(numberValue);
  }

  return out;
}

function applyIdFilter(args: ListQueryArgs, item: GridFilterItem): void {
  switch (item.operator) {
    case "=":
    case "equals": {
      if (item.value == null || item.value === "") return;

      const value = toFiniteNumber(item.value);

      if (value !== null) args.ids = [value];

      return;
    }

    case "!=": {
      if (item.value == null || item.value === "") return;

      const value = toFiniteNumber(item.value);

      if (value !== null) args.idNot = value;

      return;
    }

    case ">": {
      if (item.value == null || item.value === "") return;

      const value = toFiniteNumber(item.value);

      if (value !== null) args.idGt = value;

      return;
    }

    case ">=": {
      if (item.value == null || item.value === "") return;

      const value = toFiniteNumber(item.value);

      if (value !== null) args.idGte = value;

      return;
    }

    case "<": {
      if (item.value == null || item.value === "") return;

      const value = toFiniteNumber(item.value);

      if (value !== null) args.idLt = value;

      return;
    }

    case "<=": {
      if (item.value == null || item.value === "") return;

      const value = toFiniteNumber(item.value);

      if (value !== null) args.idLte = value;

      return;
    }

    case "isAnyOf": {
      const ids = toFiniteNumberArray(item.value);

      if (ids.length > 0) args.ids = ids;

      return;
    }

    default:
      return;
  }
}

function applyDictionaryFilter(
    args: ListQueryArgs,
    item: GridFilterItem,
): void {
  if (item.operator !== "isAnyOf") return;
  if (!Array.isArray(item.value) || item.value.length === 0) return;

  const param = DICTIONARY_FIELD_TO_PARAM[item.field];

  if (!param) return;

  const ids = toFiniteNumberArray(item.value);

  if (ids.length > 0) {
    args[param] = ids;
  }
}
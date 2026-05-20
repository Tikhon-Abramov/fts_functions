import type {
  GridFilterItem,
  GridFilterModel,
  GridSortModel,
} from "@mui/x-data-grid";
import type { FtsFunctionControllerListV1ApiArg } from "src/shared/api/ftsFunctionsApi";

import { FtsFunctionField } from "src/entities/fts-function/model";

// ---------- types ----------

export type ListQueryArgs = Partial<FtsFunctionControllerListV1ApiArg>;

type SortBy = NonNullable<FtsFunctionControllerListV1ApiArg["sortBy"]>;

// ---------- constants ----------

// Backend sortable fields. Anything not in this set is silently dropped so the
// translator never produces an invalid sortBy.
const SORTABLE_FIELDS: readonly SortBy[] = ["createdAt", "updatedAt", "id"];

/**
 * Dictionary-type column fields that accept `isAnyOf` and the backend `*Ids`
 * query param they map to. `centralization` has no FK filter endpoint so it
 * is intentionally absent.
 *
 * Class 2 — string-literal union promoted to a const-as-const enum-object so
 * every reference shares one symbol.
 */
export const DICTIONARY_PARAM = {
  COMPETENCY_CENTER_IDS: "competencyCenterIds",
  FTS_FUNCTION_NAME_IDS: "ftsFunctionNameIds",
  FTS_FUNCTION_MARKER_IDS: "ftsFunctionMarkerIds",
  CURATOR_CENTRAL_OFFICE_IDS: "curatorCentralOfficeIds",
  MANAGER_INTERREGIONAL_INSPECTION_IDS: "managerInterregionalInspectionIds",
} as const;

export type DictionaryParam =
  (typeof DICTIONARY_PARAM)[keyof typeof DICTIONARY_PARAM];

// Class 27 — keys are `FunctionRecord` field names, routed through
// `FtsFunctionField` so every domain-id reference shares one symbol.
const DICTIONARY_FIELD_TO_PARAM: Readonly<Record<string, DictionaryParam>> = {
  [FtsFunctionField.COMPETENCE_CENTER]: DICTIONARY_PARAM.COMPETENCY_CENTER_IDS,
  [FtsFunctionField.NAME]: DICTIONARY_PARAM.FTS_FUNCTION_NAME_IDS,
  [FtsFunctionField.MARKER]: DICTIONARY_PARAM.FTS_FUNCTION_MARKER_IDS,
  [FtsFunctionField.CURATOR_CA]: DICTIONARY_PARAM.CURATOR_CENTRAL_OFFICE_IDS,
  [FtsFunctionField.MANAGER_MIUDOL]:
    DICTIONARY_PARAM.MANAGER_INTERREGIONAL_INSPECTION_IDS,
};

// ---------- functions ----------

/**
 * Translate a DataGrid filter model into backend query params.
 *
 * Pure — consumes a `GridFilterModel` plus no other inputs and returns a
 * fresh `ListQueryArgs`. Each id-filter operator maps to a dedicated query
 * field (`ids`, `idNot`, `idGt`, `idGte`, `idLt`, `idLte`). Dictionary
 * filters (`name`, `marker`, …) only accept the `isAnyOf` operator and map
 * to their `*Ids[]` query params.
 */
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

/**
 * Translate a DataGrid sort model into `{sortBy, sortDir}`.
 *
 * Pure. Backend currently supports single-column sort only; we take the
 * first item and emit a warning for any extras. Unsupported sort fields are
 * dropped silently — and we drop the accompanying `sortDir` with them, so
 * we never emit a half-state (`sortDir=asc` with no `sortBy`) which would
 * silently flip the default cursor direction without the user noticing.
 *
 * TODO(multi-sort): emit `sortBy`/`sortDir` as parallel arrays once the
 * backend can build a Prisma `orderBy[]` and a cursor predicate that
 * tie-breaks across multiple columns. The cursor encoding (single
 * createdAt+updatedAt+id triple) and the raw-SQL date-cursor predicate in
 * `FtsFunctionService.buildCursorPredicate` would both need a redesign;
 * deferred to keep this DataGridPro upgrade focused on the infinite-scroll
 * fix.
 */
export function translateSortModel(
  model: GridSortModel,
): Pick<ListQueryArgs, "sortBy" | "sortDir"> {
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
  const out: Pick<ListQueryArgs, "sortBy" | "sortDir"> = {
    sortBy: first.field,
  };
  if (first.sort === "asc" || first.sort === "desc") {
    out.sortDir = first.sort;
  }
  return out;
}

// ---------- helpers ----------

function isSortableField(field: string): field is SortBy {
  return (SORTABLE_FIELDS as readonly string[]).includes(field);
}

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toFiniteNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const out: number[] = [];
  for (const v of value) {
    const n = Number(v);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/**
 * Apply a numeric-`id` filter item to the accumulating args object.
 *
 * Handles `=`/`equals`, `!=`, `>`, `>=`, `<`, `<=`, and `isAnyOf`. Operators
 * the backend has no `id*` query field for (`isEmpty`, `isNotEmpty`, plus
 * any future Pro-only number op) fall through to a clean no-op — id is a
 * non-nullable PK so emptiness tests are meaningless anyway, and silently
 * dropping is preferable to emitting a malformed query that the backend
 * would reject with VALIDATION_ERROR.
 */
function applyIdFilter(args: ListQueryArgs, item: GridFilterItem): void {
  switch (item.operator) {
    case "=":
    case "equals": {
      if (item.value == null || item.value === "") return;
      const n = toFiniteNumber(item.value);
      if (n !== null) args.ids = [n];
      return;
    }
    case "!=": {
      if (item.value == null || item.value === "") return;
      const n = toFiniteNumber(item.value);
      if (n !== null) args.idNot = n;
      return;
    }
    case ">": {
      if (item.value == null || item.value === "") return;
      const n = toFiniteNumber(item.value);
      if (n !== null) args.idGt = n;
      return;
    }
    case ">=": {
      if (item.value == null || item.value === "") return;
      const n = toFiniteNumber(item.value);
      if (n !== null) args.idGte = n;
      return;
    }
    case "<": {
      if (item.value == null || item.value === "") return;
      const n = toFiniteNumber(item.value);
      if (n !== null) args.idLt = n;
      return;
    }
    case "<=": {
      if (item.value == null || item.value === "") return;
      const n = toFiniteNumber(item.value);
      if (n !== null) args.idLte = n;
      return;
    }
    case "isAnyOf": {
      const ids = toFiniteNumberArray(item.value);
      if (ids.length > 0) args.ids = ids;
      return;
    }
    case "isEmpty":
    case "isNotEmpty":
      // Id is a non-nullable PK — emptiness tests don't translate to any
      // backend filter. No-op rather than emitting a malformed query.
      return;
    default:
      return;
  }
}

/**
 * Apply an `isAnyOf` dictionary filter (name, marker, competenceCenter, etc.)
 * to the accumulating args object. No-op for unsupported fields/operators.
 */
function applyDictionaryFilter(
  args: ListQueryArgs,
  item: GridFilterItem,
): void {
  if (item.operator !== "isAnyOf") return;
  if (!Array.isArray(item.value) || item.value.length === 0) return;
  const param = DICTIONARY_FIELD_TO_PARAM[item.field];
  if (!param) return;
  const ids = toFiniteNumberArray(item.value);
  // The API accepts `(string | number)[]`, but we normalise to numbers so
  // that the produced args object is stable and type-narrow. All
  // DictionaryParam keys on ListQueryArgs share the same value shape.
  args[param] = ids;
}

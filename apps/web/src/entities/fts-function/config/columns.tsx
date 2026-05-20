/**
 * Schema-driven `GridColDef[]` factory for the FTS-function registry.
 *
 * Each column is defined by its own `*Column(deps)` builder so the orchestrator
 * (`home.tsx`) reads as a single declarative array. Cell renderers come from
 * `shared/ui/grid-cells/*` — this file binds them to specific columns and
 * passes the (i18n + theme + dictionary) dependencies.
 *
 * Adding a new column = add one `*Column(deps)` helper + reference it in the
 * exported list. No other file changes.
 */
import type { Theme } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { TypeLookupByName } from "src/entities/fts-function/hooks/colors/useTypeColorLookup";
import type { SelectOption } from "src/entities/fts-function/hooks/data/useDictionary";
import type { FunctionRecord } from "src/entities/fts-function/types";

import { Box } from "@mui/material";
import { getGridSingleSelectOperators } from "@mui/x-data-grid";
import { FtsFunctionField } from "src/entities/fts-function/model";
import { I18N } from "src/shared/i18n";
import { ChipListCell } from "src/shared/ui/grid-cells/ChipListCell";
import { RowActionsCell } from "src/shared/ui/grid-cells/RowActionsCell";
import {
  TextWrapCell,
  TextWrapCellAlign,
} from "src/shared/ui/grid-cells/TextWrapCell";
import { TypeChip } from "src/shared/ui/TypeChip";

import { Category } from "@registry/shared/enums";

// ---------- types ----------

export type ColumnDeps = {
  t: TFunction;
  theme: Theme;
  optionsByCategory: Readonly<Record<Category, SelectOption[]>>;
  /** Display name for the FTS_FUNCTION_MARKER "DEBT_SETTLEMENT" code, if any.
   *  Used as a heuristic-color fallback when the Type row carries no `color`. */
  markerDebtSettlementName: string | undefined;
  lookupTypeByName: TypeLookupByName;
  /** Id of the function currently open in the form panel above the table,
   *  or `undefined` if no row is being edited. Used to render the edit icon
   *  in an active state on the corresponding row. */
  editingId: number | undefined;
  onEdit: (id: number) => void;
  onCloseEdit: () => void;
  onDelete: (id: number) => void;
  onOpenDetails: (id: number) => void;
};

// ---------- module-level constants ----------

// Only the `isAnyOf` filter op is meaningful on ID-backed singleSelect columns
// (the backend takes an array of FK ids; equality "is" maps to the same shape
// with one element, so we hide it to keep the UX consistent).
const SINGLE_SELECT_IS_ANY_OF_OPS = getGridSingleSelectOperators().filter(
  (op) => op.value === "isAnyOf",
);

const ID_COLUMN_WIDTH = 64;
const ACTIONS_COLUMN_WIDTH = 108;
const NAME_COLUMN_MIN_WIDTH = 240;
const MARKER_COLUMN_MIN_WIDTH = 140;
const STRATEGY_COLUMN_MIN_WIDTH = 140;
const CENTRALIZATION_COLUMN_MIN_WIDTH = 100;
const COMPETENCY_COLUMN_MIN_WIDTH = 200;
const PEOPLE_COLUMN_MIN_WIDTH = 140;

const CENTRALIZATION_YES_CODE = "YES";
const MARKER_DEBT_SETTLEMENT_CODE = "DEBT_SETTLEMENT";

// ---------- per-column builders ----------

function idColumn({ t, theme }: ColumnDeps): GridColDef<FunctionRecord> {
  const c = theme.custom;
  return {
    field: FtsFunctionField.ID,
    headerName: "ID",
    width: ID_COLUMN_WIDTH,
    align: "center",
    headerAlign: "center",
    sortable: true,
    filterable: true,
    type: "number",
    valueFormatter: (value: unknown) => (value == null ? "" : String(value)),
    renderCell: (params: GridRenderCellParams<FunctionRecord>) => (
      <Box sx={{ color: c.textMuted, fontSize: "0.72rem" }}>
        {String(params.row.id)}
      </Box>
    ),
  };
}

function actionsColumn(deps: ColumnDeps): GridColDef<FunctionRecord> {
  // `onDelete` / `onEdit` / `onOpenDetails` are PROPS received by this
  // function (deps is the props object); the agario standard requires `onX`
  // names for received callbacks. The naming-convention rule can't tell
  // destructured parameters from local consts, so we silence it here.

  const { t, theme, editingId, onDelete, onEdit, onCloseEdit, onOpenDetails } =
    deps;
  const c = theme.custom;
  const labels = {
    delete: "Удалить",
    edit: "Редактировать функцию",
    editClose: "Закрыть карточку редактирования",
    details: "Детализация",
  };
  const palette = {
    textMuted: c.textMuted,
    dangerHover: c.dangerHover,
    accentBlue: c.accentBlue,
    detailBtnHover: c.detailBtnHover,
  };
  return {
    field: FtsFunctionField.ACTIONS,
    headerName: "Действия",
    width: ACTIONS_COLUMN_WIDTH,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: (params: GridRenderCellParams<FunctionRecord>) => (
      <RowActionsCell
        id={Number(params.row.id)}
        palette={palette}
        labels={labels}
        isEditing={editingId === Number(params.row.id)}
        onDelete={onDelete}
        onEdit={onEdit}
        onCloseEdit={onCloseEdit}
        onOpenDetails={onOpenDetails}
      />
    ),
  };
}

function nameColumn({
  t,
  theme,
  optionsByCategory,
}: ColumnDeps): GridColDef<FunctionRecord> {
  const c = theme.custom;
  return {
    field: FtsFunctionField.NAME,
    headerName: "Наименование",
    flex: 2,
    minWidth: NAME_COLUMN_MIN_WIDTH,
    type: "singleSelect",
    valueOptions: optionsByCategory[Category.FTS_FUNCTION_NAME],
    filterOperators: SINGLE_SELECT_IS_ANY_OF_OPS,
    sortable: false,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => (
      <TextWrapCell sx={{ fontWeight: 500, color: c.textPrimary }}>
        {String(params.value ?? "")}
      </TextWrapCell>
    ),
  };
}

function markerColumn(deps: ColumnDeps): GridColDef<FunctionRecord> {
  const {
    t,
    theme,
    optionsByCategory,
    lookupTypeByName,
    markerDebtSettlementName,
  } = deps;
  const c = theme.custom;
  return {
    field: FtsFunctionField.MARKER,
    headerName: "Маркер",
    flex: 1,
    minWidth: MARKER_COLUMN_MIN_WIDTH,
    type: "singleSelect",
    valueOptions: optionsByCategory[Category.FTS_FUNCTION_MARKER],
    filterOperators: SINGLE_SELECT_IS_ANY_OF_OPS,
    sortable: false,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => {
      const value = params.value as string | undefined;
      const tp = lookupTypeByName(Category.FTS_FUNCTION_MARKER, value);
      const fallback =
        value === markerDebtSettlementName ? c.markerGreen : c.markerPink;
      const resolved = tp?.color ?? fallback;
      return (
        <TextWrapCell sx={{ fontSize: "0.72rem", color: resolved }}>
          {value ?? ""}
        </TextWrapCell>
      );
    },
  };
}

function strategyProjectsColumn({
  t,
  theme,
  lookupTypeByName,
}: ColumnDeps): GridColDef<FunctionRecord> {
  const c = theme.custom;
  // Resolve each DTI's colour through the cached (category, name) Map. The
  // dictionary already includes FTS_DTI rows, so this matches the dot colour
  // shown in the form-panel `DtiMultiSelect` dropdown for the same item.
  const colorFor = (name: string): string =>
    lookupTypeByName(Category.FTS_DTI, name)?.color ?? c.strategyChipColor;
  return {
    field: FtsFunctionField.STRATEGY_PROJECTS,
    headerName: "Стратегия Д",
    flex: 1.2,
    minWidth: STRATEGY_COLUMN_MIN_WIDTH,
    align: "left",
    headerAlign: "left",
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<FunctionRecord>) => (
      <ChipListCell
        values={params.value as string[] | undefined}
        borderColor={c.strategyChipBg}
        textColor={c.strategyChipColor}
        colorFor={colorFor}
      />
    ),
  };
}

function centralizationColumn(deps: ColumnDeps): GridColDef<FunctionRecord> {
  const { t, theme, optionsByCategory, lookupTypeByName } = deps;
  const c = theme.custom;
  return {
    field: FtsFunctionField.CENTRALIZATION,
    headerName: "Центр. функ.",
    flex: 0.7,
    minWidth: CENTRALIZATION_COLUMN_MIN_WIDTH,
    type: "singleSelect",
    valueOptions: optionsByCategory[Category.FTS_CENTRALIZATION],
    sortable: false,
    filterable: false,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const value = (params.value as string | undefined) ?? "";
      const tp = lookupTypeByName(Category.FTS_CENTRALIZATION, value);
      const fallback =
        tp?.code === CENTRALIZATION_YES_CODE ? c.accentBlue : c.textSecondary;
      return (
        <TypeChip
          code={tp?.code}
          name={value}
          color={tp?.color}
          fallbackColor={fallback}
        />
      );
    },
  };
}

function competenceCenterColumn({
  t,
  theme,
  optionsByCategory,
}: ColumnDeps): GridColDef<FunctionRecord> {
  const c = theme.custom;
  return {
    field: FtsFunctionField.COMPETENCE_CENTER,
    headerName: "Центр комп.",
    flex: 1.8,
    minWidth: COMPETENCY_COLUMN_MIN_WIDTH,
    type: "singleSelect",
    valueOptions: optionsByCategory[Category.FTS_COMPETENCY_CENTER],
    filterOperators: SINGLE_SELECT_IS_ANY_OF_OPS,
    sortable: false,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <TextWrapCell
        align={TextWrapCellAlign.CENTER}
        sx={{ fontSize: "0.72rem", color: c.textBody }}
        data-testid={`cell-competence-center-${params.row.id}`}
      >
        {String(params.value ?? "")}
      </TextWrapCell>
    ),
  };
}

/**
 * People columns are rendered as plain text — they have no `valueOptions`
 * dictionary attached, so the grid would surface a "contains" text filter
 * the backend can't honour. The backend list endpoint accepts FK-id arrays
 * for `curatorCA` / `managerMiudol`, but until those columns are converted
 * to `type: "singleSelect"` with the user dictionary as `valueOptions`
 * (threading `usersAll` through `ColumnDeps`) we hide the filter affordance
 * for all four person columns to keep UX honest. Sorting on people is also
 * unsupported by the backend (`sortBy` only takes id/createdAt/updatedAt).
 */
function makePersonColumn(
  field: keyof FunctionRecord & string,
  headerKey: string,
): (deps: ColumnDeps) => GridColDef<FunctionRecord> {
  return ({ t }) => ({
    field,
    headerName: t(headerKey),
    flex: 1,
    minWidth: PEOPLE_COLUMN_MIN_WIDTH,
    sortable: false,
    filterable: false,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => (
      <TextWrapCell>{String(params.value ?? "")}</TextWrapCell>
    ),
  });
}

const curatorCAColumn = makePersonColumn(
  FtsFunctionField.CURATOR_CA,
  I18N.registry.columns.curatorCA,
);
const nuZnuColumn = makePersonColumn(
  FtsFunctionField.NU_ZNU,
  I18N.registry.columns.nuZnu,
);
const managerMiudolColumn = makePersonColumn(
  FtsFunctionField.MANAGER_MIUDOL,
  I18N.registry.columns.manager,
);
const niZniColumn = makePersonColumn(
  FtsFunctionField.NI_ZNI,
  I18N.registry.columns.niZni,
);

// ---------- public factory ----------

export function createFunctionColumns(
  deps: ColumnDeps,
): Array<GridColDef<FunctionRecord>> {
  return [
    idColumn(deps),
    actionsColumn(deps),
    nameColumn(deps),
    markerColumn(deps),
    strategyProjectsColumn(deps),
    centralizationColumn(deps),
    competenceCenterColumn(deps),
    curatorCAColumn(deps),
    nuZnuColumn(deps),
    managerMiudolColumn(deps),
    niZniColumn(deps),
  ];
}

export { MARKER_DEBT_SETTLEMENT_CODE };

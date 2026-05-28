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
import type {
  GridColDef,
  GridFilterItem,
  GridFilterOperator,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { Ref } from "react";
import type { TypeLookupByName } from "src/entities/fts-function/hooks/colors/useTypeColorLookup";
import type { SelectOption } from "src/entities/fts-function/hooks/data/useDictionary";
import type { FunctionRecord } from "src/entities/fts-function/types";

import {
  Box,
  Checkbox,
  FormControl,
  ListItemText,
  MenuItem,
  Select,
} from "@mui/material";
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
import { UserSlot } from "src/entities/fts-function/hooks/selectors/useUsersBySlot";

export type ColumnDeps = {
  t: TFunction;
  theme: Theme;
  optionsByCategory: Readonly<Record<Category, SelectOption[]>>;
  userOptionsBySlot: Record<UserSlot, SelectOption[]>;  // ← объект-словарь
  markerDebtSettlementName: string | undefined;
  lookupTypeByName: TypeLookupByName;
  editingId: number | undefined;
  onEdit: (id: number) => void;
  onCloseEdit: () => void;
  onDelete: (id: number) => void;
  onOpenDetails: (id: number) => void;
};

type NormalizedFilterOption = {
  value: string | number;
  label: string;
};

type ServerMultiSelectFilterInputProps = {
  item: GridFilterItem;
  applyValue: (item: GridFilterItem) => void;
  focusElementRef?: Ref<HTMLInputElement>;
  options: NormalizedFilterOption[];
};

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

function createServerSingleSelectIsAnyOfOps(
    valueOptions: readonly SelectOption[] | undefined,
): GridFilterOperator[] {
  const normalizedOptions = normalizeFilterOptions(valueOptions);

  return [
    {
      label: "один из",
      value: "isAnyOf",
      getApplyFilterFn: () => null,
      InputComponent: (props) => (
          <ServerMultiSelectFilterInput
              {...(props as Omit<
                  ServerMultiSelectFilterInputProps,
                  "options"
              >)}
              options={normalizedOptions}
          />
      ),
      getValueAsString: (value) => {
        if (!Array.isArray(value)) return "";

        const labelByValue = new Map(
            normalizedOptions.map((option) => [
              String(option.value),
              option.label,
            ]),
        );

        return value
            .map((item) => labelByValue.get(String(item)) ?? String(item))
            .join(", ");
      },
    },
  ];
}

function ServerMultiSelectFilterInput({
                                        item,
                                        applyValue,
                                        focusElementRef,
                                        options,
                                      }: ServerMultiSelectFilterInputProps) {
  const selectedValues = Array.isArray(item.value)
      ? item.value.map(String)
      : [];

  const labelByValue = new Map(
      options.map((option) => [String(option.value), option.label]),
  );

  return (
      <FormControl fullWidth size="small" variant="standard">
        <Select
            multiple
            value={selectedValues}
            inputRef={focusElementRef}
            onChange={(event) => {
              const rawValue = event.target.value;
              const nextStringValues = Array.isArray(rawValue)
                  ? rawValue.map(String)
                  : String(rawValue).split(",");

              const nextValue = nextStringValues.map((selectedValue) => {
                const matched = options.find(
                    (option) => String(option.value) === selectedValue,
                );

                return matched?.value ?? selectedValue;
              });

              applyValue({
                ...item,
                value: nextValue,
              });
            }}
            renderValue={(selected) =>
                selected
                    .map((value) => labelByValue.get(String(value)) ?? String(value))
                    .join(", ")
            }
        >
          {options.map((option) => {
            const optionValue = String(option.value);
            const checked = selectedValues.includes(optionValue);

            return (
                <MenuItem key={optionValue} value={optionValue}>
                  <Checkbox size="small" checked={checked} sx={{ mr: 0.5 }} />

                  <ListItemText
                      primary={option.label}
                      primaryTypographyProps={{ fontSize: "0.78rem" }}
                  />
                </MenuItem>
            );
          })}
        </Select>
      </FormControl>
  );
}

function normalizeFilterOptions(
    valueOptions: readonly SelectOption[] | undefined,
): NormalizedFilterOption[] {
  return (valueOptions ?? []).map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

function idColumn({ theme }: ColumnDeps): GridColDef<FunctionRecord> {
  const c = theme.custom;

  return {
    field: FtsFunctionField.ID,
    headerName: "ID",
    width: ID_COLUMN_WIDTH,
    align: "center",
    headerAlign: "center",
    sortable: true,
    filterable: false,
    disableColumnMenu: true,
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
  const { theme, editingId, onDelete, onEdit, onCloseEdit, onOpenDetails } =
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
                      theme,
                      optionsByCategory,
                    }: ColumnDeps): GridColDef<FunctionRecord> {
  const c = theme.custom;
  const valueOptions = optionsByCategory[Category.FTS_FUNCTION_NAME];

  return {
    field: FtsFunctionField.NAME,
    headerName: "Наименование",
    flex: 2,
    minWidth: NAME_COLUMN_MIN_WIDTH,
    type: "singleSelect",
    valueOptions,
    filterable: true,
    filterOperators: createServerSingleSelectIsAnyOfOps(valueOptions),
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
    theme,
    optionsByCategory,
    lookupTypeByName,
    markerDebtSettlementName,
  } = deps;
  const c = theme.custom;
  const valueOptions = optionsByCategory[Category.FTS_FUNCTION_MARKER];

  return {
    field: FtsFunctionField.MARKER,
    headerName: "Маркер",
    flex: 1,
    minWidth: MARKER_COLUMN_MIN_WIDTH,
    type: "singleSelect",
    valueOptions,
    filterable: true,
    filterOperators: createServerSingleSelectIsAnyOfOps(valueOptions),
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
                                  theme,
                                  optionsByCategory,
                                  lookupTypeByName,
                                }: ColumnDeps): GridColDef<FunctionRecord> {
  const c = theme.custom;
  const valueOptions = optionsByCategory[Category.FTS_DTI];

  const colorFor = (name: string): string =>
      lookupTypeByName(Category.FTS_DTI, name)?.color ?? c.strategyChipColor;

  return {
    field: FtsFunctionField.STRATEGY_PROJECTS,
    headerName: "Стратегия Д",
    flex: 1.2,
    minWidth: STRATEGY_COLUMN_MIN_WIDTH,
    type: "singleSelect",
    valueOptions,
    filterable: true,
    filterOperators: createServerSingleSelectIsAnyOfOps(valueOptions),
    align: "left",
    headerAlign: "left",
    sortable: false,
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
  const { theme, optionsByCategory, lookupTypeByName } = deps;
  const c = theme.custom;
  const valueOptions = optionsByCategory[Category.FTS_CENTRALIZATION];

  return {
    field: FtsFunctionField.CENTRALIZATION,
    headerName: "Центр. функ.",
    flex: 0.7,
    minWidth: CENTRALIZATION_COLUMN_MIN_WIDTH,
    type: "singleSelect",
    valueOptions,
    filterable: true,
    filterOperators: createServerSingleSelectIsAnyOfOps(valueOptions),
    sortable: false,
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
                                  theme,
                                  optionsByCategory,
                                }: ColumnDeps): GridColDef<FunctionRecord> {
  const c = theme.custom;
  const valueOptions = optionsByCategory[Category.FTS_COMPETENCY_CENTER];

  return {
    field: FtsFunctionField.COMPETENCE_CENTER,
    headerName: "Центр комп.",
    flex: 1.8,
    minWidth: COMPETENCY_COLUMN_MIN_WIDTH,
    type: "singleSelect",
    valueOptions,
    filterable: true,
    filterOperators: createServerSingleSelectIsAnyOfOps(valueOptions),
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

function makePersonColumn(
    field: keyof FunctionRecord & string,
    headerKey: string,
    slot: UserSlot,        
): (deps: ColumnDeps) => GridColDef<FunctionRecord> {

  return ({ t, userOptionsBySlot }) => {
    const options = userOptionsBySlot[slot]; 
    return {
      field,
      headerName: t(headerKey),
      flex: 1,
      minWidth: PEOPLE_COLUMN_MIN_WIDTH,
      type: "singleSelect",
      valueOptions: options,
      filterable: true,
      filterOperators: createServerSingleSelectIsAnyOfOps(options),
      sortable: false,
      align: "left",
      headerAlign: "left",
      renderCell: (params) => (
          <TextWrapCell>{String(params.value ?? "")}</TextWrapCell>
      ),
    }
  };
}

const curatorCAColumn = makePersonColumn(
  FtsFunctionField.CURATOR_CA,
  I18N.registry.columns.curatorCA,
  UserSlot.CURATOR_CA,                          // ← curator ЦА
);

const nuZnuColumn = makePersonColumn(
  FtsFunctionField.NU_ZNU,
  I18N.registry.columns.nuZnu,
  UserSlot.DEPT_HEAD_CA,                        // ← начальник ЦА
);

const managerMiudolColumn = makePersonColumn(
  FtsFunctionField.MANAGER_MIUDOL,
  I18N.registry.columns.manager,
  UserSlot.MANAGER_MIUDOL,                      // ← менеджер МИУДОЛ
);

const niZniColumn = makePersonColumn(
  FtsFunctionField.NI_ZNI,
  I18N.registry.columns.niZni,
  UserSlot.DEPT_HEAD_MIUDOL,                    // ← начальник МИУДОЛ
);

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
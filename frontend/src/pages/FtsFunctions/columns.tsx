import type { Ref } from "react";
import { Autocomplete, Box, Checkbox, ListItemText, TextField, useTheme } from "@mui/material";
import type { GridColDef, GridFilterInputValueProps, GridFilterOperator, GridRenderCellParams } from "@mui/x-data-grid-pro";
import type { FtsFunctionItemsResponseDto } from "../../store/ftsFunctionRegistry";
import { useAppDispatch, useAppSelector } from "../../store";
import { selectEditableFtsFunctionId, setDeleteableFtsFunction, setEditableFtsFunction, setSelectedFtsFunction } from "../../store/uiSlice";
import { RowActionsCell } from "../../ui/grid-cells/RowActionsCell";
import { TextWrapCell, TextWrapCellAlign } from "../../ui/grid-cells/TextWrapCell";
import { ChipListCell } from "../../ui/grid-cells/ChipListCell";
import { TypeChip } from "../../ui/TypeChip";
import type { OptionType } from "../../utils/create-options";



type FtsFunctionRow = FtsFunctionItemsResponseDto["data"]["items"][number];

type PersonField = "curatorCentralOffice" | "managerInterregionalInspection" | "departmentHeadCentralOffice" | "departmentHeadInterregionalInspection";

export type GetColumnsProps = {
  ftsFunctionNameOptions: OptionType[];
  ftsFunctionMarkerOptions: OptionType[];
  ftsDtiOptions: OptionType[];
  ftsCentralizationOptions: OptionType[];
  ftsCompetencyCenterOptions: OptionType[];
  centralOfficeCuratorOptions: OptionType[];
  centralOfficeUserOptions: OptionType[];
  interregionalInspectionManagerOptions: OptionType[];
  interregionalInspectionUserOptions: OptionType[];
};

type MultiSelectFilterInputProps = GridFilterInputValueProps & {
  options: OptionType[];
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// Селект с мультивыбором для фильтров колонок
function MultiSelectFilterInput({
  item,
  applyValue,
  focusElementRef,
  options,
}: MultiSelectFilterInputProps) {
  const selectedValues: string[] = Array.isArray(item.value)
    ? item.value.map((v) => String(v))
    : [];

  const selectedOptions = options.filter((o) =>
    selectedValues.includes(String(o.value)),
  );

  const handleChange = (_event: unknown, next: OptionType[]) => {
    applyValue({ ...item, value: next.map((o) => String(o.value)) });
  };

  return (
    <Autocomplete<OptionType, true, false, false>
      multiple
      size="small"
      sx={{ minWidth: 350 }}
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      disableCloseOnSelect
      limitTags={2}
      slotProps={{ listbox: { sx: { maxHeight: 320 } } }}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props as typeof props & { key?: string };
        return (
          <li key={key ?? String(option.value)} {...rest}>
            <Checkbox size="small" checked={selected} sx={{ mr: 1, p: 0.5 }} />
            <ListItemText
              primary={option.label}
              slotProps={{ primary: { sx: { fontSize: "0.82rem" } } }}
            />
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          label="Значение"
          placeholder="Поиск..."
          inputRef={focusElementRef as Ref<HTMLInputElement>}
        />
      )}
    />
  );
}


/// Сборка фильтра колонки
function buildColumnFilter(valueOptions: OptionType[] | undefined): GridFilterOperator<FtsFunctionRow>[] {
  const normalizedOptions = valueOptions ?? [];

  return [
    {
      label: "один из",
      value: "isAnyOf",
      getApplyFilterFn: () => null,
      InputComponent: (props) => (
        <MultiSelectFilterInput
          {...props}
          options={normalizedOptions}
        />
      ),
      getValueAsString: (value) => {
        if (!Array.isArray(value)) return "";
        const labelByValue = new Map(
          normalizedOptions.map((o) => [String(o.value), o.label]),
        );

        return value
          .map((item) => labelByValue.get(String(item)) ?? String(item))
          .join(", ");
      },
    },
  ];
}


/// Сборка колонки "Действия"
function buildActionColumn(id: number, ftsFunctionName: string) {
  const dispatch = useAppDispatch();

  const editableFtsFunctionId = useAppSelector(selectEditableFtsFunctionId);
  const isEditing = (editableFtsFunctionId != null) && (editableFtsFunctionId === id);

  const theme = useTheme();

  return (
    <RowActionsCell
      isEditing={isEditing}
      palette={{
        textMuted: theme.custom.textMuted,
        dangerHover: theme.custom.dangerHover,
        accentBlue: theme.custom.accentBlue,
        detailBtnHover: theme.custom.detailBtnHover,
      }}
      labels={{
        delete: "Удалить",
        edit: "Редактировать функцию",
        editClose: "Закрыть карточку редактирования",
        details: "Детализация",
      }}
      onDelete={() => dispatch(setDeleteableFtsFunction({ id, ftsFunctionName }))}
      onEdit={() => dispatch(setEditableFtsFunction(id))}
      onCloseEdit={() => dispatch(setEditableFtsFunction(null))}
      onOpenDetails={() => dispatch(setSelectedFtsFunction({ id, ftsFunctionName }))}
    />
  );
}


/// Сборка колонок "Куратор ЦА", "НУ / ЗНУ", "Менеджер МИУДОЛ" и "НИ / ЗНИ"
function buildPersonColumn(
  field: PersonField,
  headerName: string,
  options: OptionType[],
): GridColDef<FtsFunctionRow> {
  return {
    field,
    headerName,
    flex: 1,
    minWidth: 150,
    sortable: true,
    filterable: true,
    align: "left",
    headerAlign: "left",
    filterOperators: buildColumnFilter(options),
    renderCell: (params: GridRenderCellParams<FtsFunctionRow>) => (
      <TextWrapCell>
        {params.row[field]?.shortName ?? params.row[field]?.fullName ?? ""}
      </TextWrapCell>
    ),
  };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



/// Колонки таблицы
export const getColumns = (props: GetColumnsProps): Array<GridColDef<FtsFunctionRow>> => [
  {
    field: "id",
    headerName: "ID",
    width: 64,
    align: "center",
    headerAlign: "center",
    sortable: true,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => (
      <Box sx={(theme) => ({ color: theme.custom.textMuted, fontSize: "0.72rem" })}>
        {String(params.row.id)}
      </Box>
    ),
  },
  {
    field: "actions",
    headerName: "Действия",
    width: 108,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const isOtherFtsFunctionName = params.row.ftsFunctionName.code === 'FTS_FUNCTION_OTHER';
      const ftsFunctionName = (isOtherFtsFunctionName && !!params.row.otherFtsFunctionName) 
        ? params.row.otherFtsFunctionName 
        : params.row.ftsFunctionName.name;

      return buildActionColumn(Number(params.row.id), ftsFunctionName)
    },
  },
  {
    field: "ftsFunctionName",
    headerName: "Наименование",
    flex: 2,
    minWidth: 250,
    sortable: true,
    filterable: true,
    align: "left",
    headerAlign: "left",
    filterOperators: buildColumnFilter(props.ftsFunctionNameOptions),
    renderCell: (params) => {
      const isOtherFtsFunctionName = params.row.ftsFunctionName.code === 'FTS_FUNCTION_OTHER';
      const ftsFunctionName = (isOtherFtsFunctionName && !!params.row.otherFtsFunctionName) 
        ? params.row.otherFtsFunctionName 
        : params.row.ftsFunctionName.name;

      return (
        <TextWrapCell sx={(theme) => ({ fontWeight: 500, color: theme.custom.textPrimary })}>
          {ftsFunctionName}
        </TextWrapCell>
      )
    },
  },
  {
    field: "ftsFunctionMarker",
    headerName: "Маркер",
    flex: 1,
    minWidth: 140,
    sortable: true,
    filterable: true,
    align: "left",
    headerAlign: "left",
    filterOperators: buildColumnFilter(props.ftsFunctionMarkerOptions),
    renderCell: (params) => {
      const marker = params.row.ftsFunctionMarker;
      const isDebtSettlement = marker?.code === 'DEBT_SETTLEMENT';

      return (
        <TextWrapCell
          sx={(theme) => ({
            fontSize: "0.72rem",
            color: isDebtSettlement ? theme.custom.markerGreen : theme.custom.markerPink,
          })}
        >
          {marker?.name ?? ""}
        </TextWrapCell>
      );
    },
  },
  {
    field: "dtis",
    headerName: "Стратегия Д",
    flex: 1.2,
    minWidth: 140,
    sortable: false,
    filterable: true,
    align: "left",
    headerAlign: "left",
    filterOperators: buildColumnFilter(props.ftsDtiOptions),
    renderCell: (params) => {
      const theme = useTheme();

      return (
        <ChipListCell
          values={(params.row.dtis ?? []).map((dti) => dti.type.code)}
          borderColor={theme.custom.strategyChipBg}
          textColor={theme.custom.strategyChipColor}
          colorFor={() => theme.custom.strategyChipColor}
        />
      );
    },
  },
  {
    field: "ftsCentralization",
    headerName: "Центр. функ.",
    flex: 0.7,
    minWidth: 120,
    sortable: true,
    filterable: true,
    align: "center",
    headerAlign: "center",
    filterOperators: buildColumnFilter(props.ftsCentralizationOptions),
    renderCell: (params) => {
      const theme = useTheme();
      const centralization = params.row.ftsCentralization;
      const isYes = centralization?.code === 'FTS_CENTRALIZATION_YES';

      return (
        <TypeChip
          code={centralization?.code}
          name={centralization?.name ?? ""}
          fallbackColor={isYes ? theme.custom.accentBlue : theme.custom.textSecondary}
        />
      );
    },
  },
  {
    field: "competencyCenter",
    headerName: "Центр комп.",
    flex: 1.8,
    minWidth: 160,
    sortable: true,
    filterable: true,
    align: "center",
    headerAlign: "center",
    filterOperators: buildColumnFilter(props.ftsCompetencyCenterOptions),
    renderCell: (params) => (
      <TextWrapCell
        align={TextWrapCellAlign.CENTER}
        sx={(theme) => ({ fontSize: "0.72rem", color: theme.custom.textBody })}
      >
        {params.row.competencyCenter?.name ?? ""}
      </TextWrapCell>
    ),
  },
  buildPersonColumn("curatorCentralOffice", "Куратор ЦА", props.centralOfficeCuratorOptions),
  buildPersonColumn("departmentHeadCentralOffice", "НУ / ЗНУ", props.centralOfficeUserOptions),
  buildPersonColumn("managerInterregionalInspection", "Менеджер МИУДОЛ", props.interregionalInspectionManagerOptions),
  buildPersonColumn("departmentHeadInterregionalInspection", "НИ / ЗНИ", props.interregionalInspectionUserOptions),
];

import type { Control, FieldPath } from "react-hook-form";
import type { FunctionFormFields as FunctionFormFieldsType } from "src/entities/fts-function/lib/function-form-schema";
import type {
  TypeResponseDto,
  UserResponseDto,
} from "src/shared/api/ftsFunctionsApi";

import { Controller } from "react-hook-form";
import { Search as SearchIcon } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  useTheme,
} from "@mui/material";
import { UserSlot } from "src/entities/fts-function/hooks/selectors/useUsersBySlot";

import { DtiMultiSelect } from "./DtiMultiSelect";
import { UserSelect, UserSelectName } from "./UserSelect";

export type FunctionFormFieldsProps = {
  control: Control<FunctionFormFieldsType>;
  centralizations: TypeResponseDto[];
  functionNames: TypeResponseDto[];
  markers: TypeResponseDto[];
  competencyCenters: TypeResponseDto[];
  dtis: TypeResponseDto[];
  users: UserResponseDto[];
  firstFieldRef: (node: HTMLDivElement | null) => void;
};

/**
 * The 9-field grid shared by create and edit modes. Each MUI Select is wrapped
 * in an RHF `<Controller>`; field-level error helper text renders when zod
 * rejects the value.
 */
export function FunctionFormFields({
  control,
  centralizations,
  functionNames,
  markers,
  competencyCenters,
  dtis,
  users,
  firstFieldRef,
}: FunctionFormFieldsProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {/* Top section — 3-col grid for the four classification fields */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 2,
        }}
      >
        <TypeSelect
          name={TypeSelectName.FTS_FUNCTION_NAME_ID}
          label={"Наименование функции"}
          options={functionNames}
          control={control}
          testId="create-name-select"
          fullRow
          wrapperRef={firstFieldRef}
        />
        <TypeSelect
          name={TypeSelectName.FTS_FUNCTION_MARKER_ID}
          label={"Маркер функции"}
          options={markers}
          control={control}
          testId="create-marker-select"
        />
        <TypeSelect
          name={TypeSelectName.FTS_CENTRALIZATION_ID}
          label={"Централизация функции"}
          options={centralizations}
          control={control}
          testId="create-centralization-select"
        />
        <TypeSelect
          name={TypeSelectName.COMPETENCY_CENTER_ID}
          label={"Центр компетенций"}
          options={competencyCenters}
          control={control}
          testId="create-competence-center-select"
          wrap
        />
      </Box>

      {/* Bottom section — 2-col split: 4 user selects stacked on the left,
          DTI block on the right. Grid items stretch (default) so the DTI
          column matches the height of the user-select stack. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        <Stack spacing={2}>
          <UserSelect
            name={UserSelectName.CURATOR_CENTRAL_OFFICE_ID}
            label={"Куратор ЦА"}
            slot={UserSlot.CURATOR_CA}
            users={users}
            control={control}
            testId="create-curator-ca-select"
          />
          <UserSelect
            name={UserSelectName.DEPARTMENT_HEAD_CENTRAL_OFFICE_ID}
            label={"НУ/ЗНУ"}
            slot={UserSlot.DEPT_HEAD_CA}
            users={users}
            control={control}
            testId="create-nu-znu-select"
          />
          <UserSelect
            name={UserSelectName.MANAGER_INTERREGIONAL_INSPECTION_ID}
            label={"Менеджер МИУДОЛ"}
            slot={UserSlot.MANAGER_MIUDOL}
            users={users}
            control={control}
            testId="create-manager-miudol-select"
          />
          <UserSelect
            name={UserSelectName.DEPARTMENT_HEAD_INTERREGIONAL_INSPECTION_ID}
            label={"НИ/ЗНИ"}
            slot={UserSlot.DEPT_HEAD_MIUDOL}
            users={users}
            control={control}
            testId="create-ni-zni-select"
          />
        </Stack>
        {/* DTI's content (selected list) must NOT contribute to the grid
            row height — left user-stack alone determines the row, DTI
            stretches to fill it via absolute positioning. */}
        <Box sx={{ position: "relative", minHeight: 0 }}>
          <DtiMultiSelect control={control} dtis={dtis} />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Class 2 — const-as-const for the four `TypeSelect`-bound RHF field names.
 * Co-located with the component since this is the only consumer.
 */
const TypeSelectName = {
  FTS_FUNCTION_NAME_ID: "ftsFunctionNameId",
  FTS_FUNCTION_MARKER_ID: "ftsFunctionMarkerId",
  FTS_CENTRALIZATION_ID: "ftsCentralizationId",
  COMPETENCY_CENTER_ID: "competencyCenterId",
} as const;

type TypeSelectName = (typeof TypeSelectName)[keyof typeof TypeSelectName];

type TypeSelectProps = {
  name: TypeSelectName;
  label: string;
  options: TypeResponseDto[];
  control: Control<FunctionFormFieldsType>;
  testId: string;
  fullRow?: boolean;
  wrap?: boolean;
  wrapperRef?: ((node: HTMLDivElement | null) => void) | undefined;
};

/** Threshold above which a single-value picker becomes a searchable
 * Autocomplete instead of a plain Select. Long option lists are tedious
 * to scroll without filter-as-you-type. */
const SEARCHABLE_THRESHOLD = 10;

function TypeSelect({
  name,
  label,
  options,
  control,
  testId,
  fullRow,
  wrap,
  wrapperRef,
}: TypeSelectProps) {
  const theme = useTheme();
  const c = theme.custom;
  const sxField = {
    "& .MuiOutlinedInput-root": {
      fontSize: "0.82rem",
      bgcolor: c.hoverOverlay,
    },
    "& .MuiInputLabel-root": { fontSize: "0.82rem" },
    ...(fullRow ? { gridColumn: "1 / -1" } : {}),
  };
  const sxSelect = { fontSize: "0.82rem", bgcolor: c.hoverOverlay };
  const sxItem = wrap
    ? { fontSize: "0.78rem", whiteSpace: "normal", maxWidth: 500 }
    : { fontSize: "0.82rem" };

  const isSearchable = options.length > SEARCHABLE_THRESHOLD;

  if (isSearchable) {
    return (
      <Controller<FunctionFormFieldsType, FieldPath<FunctionFormFieldsType>>
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          const valueStr = typeof field.value === "string" ? field.value : "";
          const selectedOption =
            options.find((o) => String(o.id) === valueStr) ?? null;
          return (
            <Box sx={sxField} ref={wrapperRef}>
              <Autocomplete<TypeResponseDto, false, false, false>
                size="small"
                options={options}
                value={selectedOption}
                onChange={(_, next) =>
                  field.onChange(next ? String(next.id) : "")
                }
                onBlur={field.onBlur}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                slotProps={{ listbox: { sx: { maxHeight: 320 } } }}
                renderOption={(props, option) => {
                  const { key, ...rest } = props as typeof props & {
                    key?: string;
                  };
                  return (
                    <li key={key ?? option.id} {...rest}>
                      <Box sx={sxItem}>{option.name}</Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={label}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start" sx={{ ml: 0.5 }}>
                          <SearchIcon
                            sx={{ fontSize: 18, color: c.textMuted }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    inputRef={field.ref}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.82rem",
                        bgcolor: c.hoverOverlay,
                      },
                      "& .MuiInputLabel-root": { fontSize: "0.82rem" },
                    }}
                    data-testid={testId}
                  />
                )}
              />
            </Box>
          );
        }}
      />
    );
  }

  return (
    <Controller<FunctionFormFieldsType, FieldPath<FunctionFormFieldsType>>
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl
          size="small"
          fullWidth
          error={Boolean(fieldState.error)}
          sx={sxField}
          ref={wrapperRef}
        >
          <InputLabel sx={{ fontSize: "0.82rem" }}>{label}</InputLabel>
          <Select
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            label={label}
            sx={sxSelect}
            data-testid={testId}
          >
            {options.map((m) => (
              <MenuItem key={m.id} value={String(m.id)} sx={sxItem}>
                {m.name}
              </MenuItem>
            ))}
          </Select>
          {fieldState.error?.message && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}

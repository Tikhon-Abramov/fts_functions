import type { AddItemFormValues, StepFields } from "../lib/schema";
import type { Theme } from "@mui/material";
import type { Control, FieldPath } from "react-hook-form";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useMemo } from "react";
import { Controller } from "react-hook-form";
import {
  Autocomplete,
  Box,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";
import {
  ACTIONS,
  CATEGORIES,
  COMPLEXITIES,
  PERIODICITIES,
} from "src/entities/fts-function/constants";
import { MAX_PER_CATEGORY } from "src/shared/config/ui";
import { I18N, useTranslation } from "src/shared/i18n";
import { FieldLabel } from "src/shared/ui/form/FieldLabel";
import {
  formInputSx,
  formLabelSx,
  formMenuSx,
  formSelectSx,
} from "src/shared/ui/styles/form";

import { Category } from "@registry/shared/enums";

/**
 * Step-key registry (Class 2). The two RHF object roots that hold per-step
 * form fields. Co-located here because the form's schema shape (`{ s1, s2 }`)
 * is the only meaningful definition.
 */
export const StepKey = {
  S1: "s1",
  S2: "s2",
} as const;
export type StepKey = (typeof StepKey)[keyof typeof StepKey];
type RHFFieldName = `${StepKey}.${keyof StepFields}`;

export type StepTabBodyProps = {
  control: Control<AddItemFormValues>;
  step: StepKey;
  fields: StepFields;
  currentCount: number;
  limitReached: boolean;
  filled: boolean;
  typesAll: TypeResponseDto[];
  theme: Theme;
};

export function StepTabBody({
  control,
  step,
  fields,
  limitReached,
  filled,
  typesAll,
  theme,
}: StepTabBodyProps) {
  const { t } = useTranslation();
  const c = theme.custom;
  // DB-driven `who` options — names from `Type.name` filtered by category.
  const whoOptions = useMemo(
    () =>
      typesAll
        .filter((tt) => tt.category === Category.WHO_PERFORMS_ACTION)
        .map((tt) => tt.name),
    [typesAll],
  );

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        px: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        pb: 1,
      }}
    >
      {limitReached && filled && (
        <Typography
          variant="caption"
          sx={{ color: theme.palette.warning.main, fontSize: "0.68rem" }}
        >
          {t(I18N.addItem.limitReached, {
            limit: MAX_PER_CATEGORY,
            category: findTypeNameByCode(typesAll, fields.category),
          })}
        </Typography>
      )}

      <FieldLabel fontSize="0.58rem" bold>
        {"Основные поля"}
      </FieldLabel>

      <RHFCodeSelect
        control={control}
        name={`${step}.category`}
        label={"Категория"}
        options={CATEGORIES}
        typesAll={typesAll}
        testId={`add-detail-category-${step}`}
        theme={theme}
      />

      <Controller
        control={control}
        name={`${step}.detailText`}
        render={({ field }) => (
          <TextField
            {...field}
            label={"Детализация *"}
            multiline
            rows={2}
            fullWidth
            size="small"
            sx={formInputSx(theme)}
            data-testid={`add-detail-text-${step}`}
          />
        )}
      />

      <RHFAutocomplete
        control={control}
        name={`${step}.who`}
        label={"Кто делает"}
        options={whoOptions}
        testId={`add-detail-who-${step}`}
        theme={theme}
      />

      <RHFCodeSelect
        control={control}
        name={`${step}.actionLabel`}
        label={"Что делать"}
        options={ACTIONS}
        typesAll={typesAll}
        testId={`add-detail-action-${step}`}
        theme={theme}
      />

      <Divider sx={{ borderColor: c.borderLight, my: 0.5 }} />
      <FieldLabel fontSize="0.58rem" bold>
        {"Дополнительные сведения"}
      </FieldLabel>

      <RHFCodeSelect
        control={control}
        name={`${step}.periodicity`}
        label={"Периодичность"}
        options={PERIODICITIES}
        typesAll={typesAll}
        testId={`select-periodicity-${step}`}
        theme={theme}
      />
      <RHFCodeSelect
        control={control}
        name={`${step}.complexity`}
        label={"Сложность"}
        options={COMPLEXITIES}
        typesAll={typesAll}
        testId={`select-complexity-${step}`}
        theme={theme}
      />
      <RHFTextInput
        control={control}
        name={`${step}.artifact`}
        label={"Артефакт"}
        testId={`input-artifact-${step}`}
        theme={theme}
      />
      <RHFTextInput
        control={control}
        name={`${step}.basis`}
        label={"Основание"}
        testId={`input-basis-${step}`}
        theme={theme}
      />
      <RHFTextInput
        control={control}
        name={`${step}.artifactUsage`}
        label={"Как используется артефакт"}
        testId={`input-artifact-usage-${step}`}
        multiline
        theme={theme}
      />
      <RHFTextInput
        control={control}
        name={`${step}.purpose`}
        label={"Зачем выполняется"}
        testId={`input-purpose-${step}`}
        multiline
        theme={theme}
      />
    </Box>
  );
}

// ---- inline RHF helpers (Class 26: take theme/t as props) ----

type RHFCodeSelectProps<T extends string> = {
  control: Control<AddItemFormValues>;
  name: RHFFieldName;
  label: string;
  options: readonly T[];
  typesAll: TypeResponseDto[];
  testId: string;
  theme: Theme;
};

export function RHFCodeSelect<T extends string>({
  control,
  name,
  label,
  options,
  typesAll,
  testId,
  theme,
}: RHFCodeSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name as FieldPath<AddItemFormValues>}
      render={({ field }) => (
        <FormControl size="small" fullWidth>
          <InputLabel sx={formLabelSx(theme)}>{label}</InputLabel>
          <Select
            value={(field.value as string) ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            label={label}
            sx={formSelectSx(theme)}
            MenuProps={formMenuSx(theme)}
            data-testid={testId}
          >
            {options.map((o) => (
              <MenuItem
                key={o}
                value={o}
                sx={{ fontSize: "0.78rem", minHeight: 28, py: 0.25 }}
              >
                {findTypeNameByCode(typesAll, o)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );
}

type RHFTextInputProps = {
  control: Control<AddItemFormValues>;
  name: RHFFieldName;
  label: string;
  testId: string;
  multiline?: boolean;
  theme: Theme;
};

function RHFTextInput({
  control,
  name,
  label,
  testId,
  multiline = false,
  theme,
}: RHFTextInputProps) {
  return (
    <Controller
      control={control}
      name={name as FieldPath<AddItemFormValues>}
      render={({ field }) => (
        <TextField
          {...field}
          value={(field.value as string) ?? ""}
          label={label}
          fullWidth
          size="small"
          multiline={multiline}
          rows={multiline ? 2 : undefined}
          sx={formInputSx(theme)}
          data-testid={testId}
        />
      )}
    />
  );
}

type RHFAutocompleteProps = {
  control: Control<AddItemFormValues>;
  name: RHFFieldName;
  label: string;
  options: readonly string[];
  testId: string;
  theme: Theme;
};

function RHFAutocomplete({
  control,
  name,
  label,
  options,
  testId,
  theme,
}: RHFAutocompleteProps) {
  const c = theme.custom;

  return (
    <Controller
      control={control}
      name={name as FieldPath<AddItemFormValues>}
      render={({ field }) => (
        <Autocomplete
          freeSolo
          options={options}
          value={(field.value as string) ?? ""}
          onChange={(_, v) => field.onChange(v ?? "")}
          onInputChange={(_, v) => field.onChange(v)}
          size="small"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                bgcolor: c.bgMenu,
                color: c.textBody,
                border: `1px solid ${c.borderMain}`,
              },
            },
            listbox: {
              sx: {
                py: 0,
                "& .MuiAutocomplete-option": {
                  minHeight: 28,
                  fontSize: "0.78rem",
                  py: 0.25,
                },
              },
            },
          }}
          renderOption={(props, option) => {
            const { key, ...rest } = props as typeof props & { key?: string };
            return (
              <li key={key ?? option} {...rest}>
                <Tooltip title={option} placement="right">
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.78rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                      display: "block",
                    }}
                  >
                    {option}
                  </Typography>
                </Tooltip>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              sx={formInputSx(theme)}
              data-testid={testId}
            />
          )}
        />
      )}
    />
  );
}

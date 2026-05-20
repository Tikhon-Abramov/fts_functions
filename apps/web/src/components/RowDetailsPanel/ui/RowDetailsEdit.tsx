import type { RowDraft } from "../hooks/useRowDetailsDraft";
import type { Theme } from "@mui/material";
import type { TFunction } from "i18next";
import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useMemo } from "react";
import { Close, Save } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";
import { useTranslation } from "src/shared/i18n";
import {
  formInputSx,
  formLabelSx,
  formMenuSx,
  formSelectSx,
} from "src/shared/ui/styles/form";

import {
  EXTRA_FIELDS,
  type ExtraFieldConfig,
  FieldKind,
  PRIMARY_FIELDS,
} from "../lib/extra-fields";

export const ROW_DETAILS_EDIT_TEST_IDS = {
  CANCEL: "button-cancel-edit",
  SAVE: "button-save-details",
} as const;

export type RowDetailsEditProps = {
  draft: RowDraft;
  typesAll: TypeResponseDto[];
  onChangeField: (key: keyof Row, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function RowDetailsEdit({
  draft,
  typesAll,
  onChangeField,
  onSave,
  onCancel,
}: RowDetailsEditProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: c.textSecondary,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.65rem",
          }}
        >
          {"Редактирование"}
        </Typography>
        <Button
          size="small"
          onClick={onCancel}
          startIcon={<Close sx={{ fontSize: 14 }} />}
          sx={{
            textTransform: "none",
            fontSize: "0.7rem",
            color: c.textSecondary,
          }}
          data-testid={ROW_DETAILS_EDIT_TEST_IDS.CANCEL}
        >
          {"Отмена"}
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: 2,
          pt: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          pb: 1,
        }}
      >
        {[...PRIMARY_FIELDS, ...EXTRA_FIELDS].map((field) => (
          <DraftField
            key={field.key}
            field={field}
            value={(draft[field.key] as string | undefined) ?? ""}
            onChange={(value) => onChangeField(field.key, value)}
            typesAll={typesAll}
            t={t}
            theme={theme}
          />
        ))}
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1.5,
          flexShrink: 0,
          borderTop: `1px solid ${c.borderLight}`,
        }}
      >
        <Button
          variant="contained"
          onClick={onSave}
          fullWidth
          startIcon={<Save sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: "none",
            fontSize: "0.8rem",
            bgcolor: c.saveBtn,
            "&:hover": { bgcolor: c.saveBtnHover },
          }}
          data-testid={ROW_DETAILS_EDIT_TEST_IDS.SAVE}
        >
          {"Сохранить изменения"}
        </Button>
      </Box>
    </Box>
  );
}

// ---- inline helpers (Class 26: take theme/t as props, no useTheme) ----

type DraftFieldProps = {
  field: ExtraFieldConfig;
  value: string;
  onChange: (value: string) => void;
  typesAll: TypeResponseDto[];
  t: TFunction;
  theme: Theme;
};

function DraftField({
  field,
  value,
  onChange,
  typesAll,
  t,
  theme,
}: DraftFieldProps) {
  const c = theme.custom;
  const label = t(field.labelKey);

  if (field.kind === FieldKind.AUTOCOMPLETE_FROM_TYPES) {
    return (
      <AutocompleteField
        field={field}
        label={label}
        value={value}
        onChange={onChange}
        typesAll={typesAll}
        theme={theme}
      />
    );
  }

  if (field.kind === FieldKind.TEXT || field.kind === FieldKind.TEXTAREA) {
    const multiline = field.kind === FieldKind.TEXTAREA;
    return (
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        size="small"
        multiline={multiline}
        rows={multiline ? 2 : undefined}
        sx={formInputSx(theme)}
        data-testid={field.testId}
      />
    );
  }

  // SELECT_CODE — domain-coded fixed options.
  return (
    <FormControl size="small" fullWidth>
      <InputLabel sx={formLabelSx(theme)}>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(String(e.target.value))}
        label={label}
        sx={formSelectSx(theme)}
        MenuProps={formMenuSx(theme)}
        data-testid={field.testId}
      >
        <MenuItem
          value=""
          sx={{
            fontSize: "0.78rem",
            fontStyle: "italic",
            color: c.textDim,
          }}
        >
          {"— не выбрано —"}
        </MenuItem>
        {(field.options ?? []).map((opt) => (
          <MenuItem
            key={opt.value}
            value={opt.value}
            sx={{ fontSize: "0.78rem" }}
          >
            {findTypeNameByCode(typesAll, opt.value)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

type AutocompleteFieldProps = {
  field: ExtraFieldConfig;
  label: string;
  value: string;
  onChange: (value: string) => void;
  typesAll: TypeResponseDto[];
  theme: Theme;
};

function AutocompleteField({
  field,
  label,
  value,
  onChange,
  typesAll,
  theme,
}: AutocompleteFieldProps) {
  const c = theme.custom;
  // DB-driven options: filter the types dictionary by the configured category
  // and use `name` (Russian display text from `Type.name` column) directly.
  // No i18n duplication — admin SQL UPDATE on `type.name` immediately reflects
  // here on the next dictionary refetch.
  const options = useMemo(
    () =>
      typesAll
        .filter((t) => t.category === field.typeCategory)
        .map((t) => t.name),
    [typesAll, field.typeCategory],
  );

  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value}
      onChange={(_, v) => onChange(v ?? "")}
      onInputChange={(_, v) => onChange(v)}
      size="small"
      fullWidth
      componentsProps={{
        paper: {
          sx: {
            bgcolor: c.bgMenu,
            color: c.textBody,
            border: `1px solid ${c.borderMain}`,
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          sx={formInputSx(theme)}
          data-testid={field.testId}
        />
      )}
    />
  );
}

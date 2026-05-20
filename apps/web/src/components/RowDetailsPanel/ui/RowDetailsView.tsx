import type { TFunction } from "i18next";
import type { CustomPalette } from "src/app/App";
import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Divider,
  Typography,
  useTheme,
} from "@mui/material";
import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";
import { FtsFunctionStep, RowField } from "src/entities/fts-function/model";
import { useTranslation } from "src/shared/i18n";
import { FieldLabel } from "src/shared/ui/form/FieldLabel";

import { countFilled, EXTRA_FIELDS } from "../lib/extra-fields";

export type RowDetailsViewProps = {
  row: Row;
  typesAll: TypeResponseDto[];
  onStartEdit: () => void;
};

// Domain-code fields that resolve their display label from `typesAll`.
const DB_LABEL_FIELDS: ReadonlySet<keyof Row> = new Set<keyof Row>([
  RowField.PERIODICITY,
  RowField.COMPLEXITY,
]);

function resolveExtraFieldValue(
  row: Row,
  key: keyof Row,
  typesAll: TypeResponseDto[],
): string | undefined {
  const raw = row[key];
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (DB_LABEL_FIELDS.has(key)) {
    return findTypeNameByCode(typesAll, String(raw));
  }
  return String(raw);
}

export function RowDetailsView({
  row,
  typesAll,
  onStartEdit,
}: RowDetailsViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;
  const isStep1 = row.step === FtsFunctionStep.OBJECT_SELECTION;
  const stepLabel = isStep1 ? "Шаг 1" : "Шаг 2";
  const stepColor = isStep1
    ? theme.palette.primary.main
    : theme.palette.success.main;
  const filledCount = countFilled(row);
  const actionDisplay = row.actionLabel
    ? findTypeNameByCode(typesAll, row.actionLabel)
    : "Не указано";

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
          gap: 1,
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: stepColor,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: c.textSecondary,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: "0.63rem",
            }}
          >
            {stepLabel} {"— Паспорт"}
          </Typography>
          <Chip
            label={`${filledCount}/${EXTRA_FIELDS.length}`}
            size="small"
            variant="outlined"
            sx={{
              height: 18,
              fontSize: "0.58rem",
              bgcolor: c.chipSubtle,
              color: c.textSecondary,
              borderColor: c.borderMedium,
              "& .MuiChip-label": { px: 0.5 },
            }}
          />
        </Box>
        <Button
          size="small"
          onClick={onStartEdit}
          startIcon={<Edit sx={{ fontSize: 14 }} />}
          sx={{
            textTransform: "none",
            fontSize: "0.7rem",
            color: c.accentBlue,
            flexShrink: 0,
          }}
          data-testid="button-edit-details"
        >
          {"Редактировать"}
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 2, pb: 2 }}>
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1.5 }}
        >
          <FieldLabel>{"Категория"}</FieldLabel>
          <Typography
            variant="body2"
            sx={{ color: c.textBody, fontSize: "0.78rem", fontWeight: 500 }}
          >
            {findTypeNameByCode(typesAll, row.category)}
          </Typography>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1.5 }}
        >
          <FieldLabel>{"Детализация"}</FieldLabel>
          <Typography
            variant="body2"
            sx={{ color: c.textBody, fontSize: "0.78rem" }}
          >
            {row.detailText}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 3, mb: 1.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <FieldLabel>{"Кто делает"}</FieldLabel>
            <Typography
              variant="body2"
              sx={{
                color: row.who ? c.textBody : c.textDim,
                fontSize: "0.78rem",
                fontFamily: "monospace",
                fontStyle: row.who ? "normal" : "italic",
              }}
            >
              {row.who || "Не заполнено"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <FieldLabel>{"Что делать"}</FieldLabel>
            <Typography
              variant="body2"
              sx={{ color: c.textBody, fontSize: "0.78rem" }}
            >
              {actionDisplay}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: c.borderLight, my: 1.5 }} />

        <FieldLabel fontSize="0.58rem" bold block>
          {"Дополнительные сведения"}
        </FieldLabel>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
          {EXTRA_FIELDS.map((f) => (
            <ReadField
              key={f.key}
              label={t(f.labelKey)}
              value={resolveExtraFieldValue(row, f.key, typesAll)}
              t={t}
              c={c}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ---- inline helpers (Class 26: take c/t as props, no useTheme) ----

type ReadFieldProps = {
  label: string;
  value: string | undefined;
  t: TFunction;
  c: CustomPalette;
};

function ReadField({ label, value, t, c }: ReadFieldProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <FieldLabel>{label}</FieldLabel>
      <Typography
        variant="body2"
        sx={{
          color: value ? c.textBody : c.textDim,
          fontSize: "0.78rem",
          fontStyle: value ? "normal" : "italic",
        }}
      >
        {value || "Не заполнено"}
      </Typography>
    </Box>
  );
}

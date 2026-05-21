import type { TFunction } from "i18next";
import type { CustomPalette } from "src/app/App";
import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { Edit } from "@mui/icons-material";
import { Box, Button, Chip, Divider, Typography, useTheme } from "@mui/material";

import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";
import {
    isActualActionCategory,
} from "src/entities/fts-function/lib/detail-technology";
import { FtsFunctionStep, RowField } from "src/entities/fts-function/model";
import { useTranslation } from "src/shared/i18n";
import { FieldLabel } from "src/shared/ui/form/FieldLabel";

import {
    countFilled,
    EXTRA_FIELDS,
    getFieldLabel,
    TECHNOLOGY_FIELDS,
} from "../lib/extra-fields";

export type RowDetailsViewProps = {
    row: Row;
    typesAll: TypeResponseDto[];
    onStartEdit: () => void;
};

const DB_LABEL_FIELDS: ReadonlySet<keyof Row> = new Set([
    RowField.PERIODICITY,
    RowField.COMPLEXITY,
    RowField.TECHNOLOGICAL_SOLUTION,
]);

function resolveFieldValue(
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

    const isActualAction = isActualActionCategory(row.category);
    const visibleExtraFields = isActualAction
        ? [...EXTRA_FIELDS, ...TECHNOLOGY_FIELDS]
        : EXTRA_FIELDS;

    const filledCount = countFilled(row, visibleExtraFields);

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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                        label={stepLabel}
                        size="small"
                        sx={{
                            height: 22,
                            bgcolor: stepColor,
                            color: c.textBright,
                            fontSize: "0.68rem",
                            fontWeight: 600,
                        }}
                    />

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
                        {"Паспорт"}
                    </Typography>
                </Box>

                <Button
                    size="small"
                    startIcon={<Edit sx={{ fontSize: 14 }} />}
                    onClick={onStartEdit}
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

            <Box
                sx={{
                    flex: 1,
                    overflow: "auto",
                    px: 2,
                    pt: 1,
                    pb: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                }}
            >
                <ReadField
                    label={"Категория"}
                    value={findTypeNameByCode(typesAll, row.category)}
                    t={t}
                    c={c}
                />

                <ReadField label={"Детализация"} value={row.detailText} t={t} c={c} />

                <ReadField
                    label={"Кто делает"}
                    value={row.who || "Не заполнено"}
                    t={t}
                    c={c}
                />

                <ReadField label={"Что делать"} value={actionDisplay} t={t} c={c} />

                <Divider sx={{ borderColor: c.borderLight, my: 0.5 }} />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FieldLabel fontSize="0.58rem" bold>
                        {"Дополнительные сведения"}
                    </FieldLabel>

                    <Typography
                        variant="caption"
                        sx={{ color: c.textDim, fontSize: "0.62rem" }}
                    >
                        {`Заполнено: ${filledCount}`}
                    </Typography>
                </Box>

                {visibleExtraFields.map((field) => (
                    <ReadField
                        key={field.key}
                        label={getFieldLabel(field, t)}
                        value={resolveFieldValue(row, field.key, typesAll)}
                        t={t}
                        c={c}
                    />
                ))}
            </Box>
        </Box>
    );
}

type ReadFieldProps = {
    label: string;
    value: string | undefined;
    t: TFunction;
    c: CustomPalette;
};

function ReadField({ label, value, c }: ReadFieldProps) {
    return (
        <Box>
            <FieldLabel fontSize="0.58rem">{label}</FieldLabel>

            <Typography
                variant="body2"
                sx={{
                    color: value ? c.textBody : c.textDim,
                    fontSize: "0.78rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                }}
            >
                {value || "Не заполнено"}
            </Typography>
        </Box>
    );
}
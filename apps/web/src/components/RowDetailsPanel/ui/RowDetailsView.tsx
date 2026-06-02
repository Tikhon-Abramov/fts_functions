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
import {
    findTypeByCodeOrName,
    isActualActionCategory,
} from "src/entities/fts-function/lib/detail-technology";
import { FtsFunctionStep } from "src/entities/fts-function/model";
import { useTranslation } from "src/shared/i18n";
import { FieldLabel } from "src/shared/ui/form/FieldLabel";

import {
    countFilled,
    EXTRA_FIELDS,
    type ExtraFieldConfig,
    FieldKind,
    getFieldLabel,
    TECHNOLOGY_FIELDS,
} from "../lib/extra-fields";

export type RowDetailsViewProps = {
    row: Row;
    typesAll: TypeResponseDto[];
    onStartEdit: () => void;
};

function resolveDictionaryValue(
    raw: unknown,
    field: ExtraFieldConfig,
    typesAll: TypeResponseDto[],
): string | undefined {
    if (raw === undefined || raw === null || raw === "") return undefined;

    const value = String(raw);

    if (field.kind === FieldKind.SELECT_CODE) {
        return findTypeNameByCode(typesAll, value);
    }

    if (field.kind === FieldKind.SELECT_TYPE_CODE && field.typeCategory) {
        return findTypeByCodeOrName(typesAll, field.typeCategory, value)?.name ?? value;
    }

    return value;
}

function hasAnyFieldValue(row: Row, fields: readonly ExtraFieldConfig[]): boolean {
    return fields.some((field) => {
        const value = row[field.key];

        return value !== undefined && value !== null && String(value).trim() !== "";
    });
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

    const showTechnologyFields =
        isActualActionCategory(row.category) ||
        hasAnyFieldValue(row, TECHNOLOGY_FIELDS);

    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
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
                <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                            label={stepLabel}
                            size="small"
                            sx={{
                                height: 20,
                                bgcolor: `${stepColor}22`,
                                color: stepColor,
                                fontSize: "0.66rem",
                                fontWeight: 700,
                                borderRadius: 1,
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
                            {"Сведения"}
                        </Typography>
                    </Box>

                    <Typography
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.68rem",
                            mt: 0.5,
                        }}
                    >
                        {`Заполнено дополнительных полей: ${filledCount}`}
                    </Typography>
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

            <Box
                sx={{
                    flex: 1,
                    overflow: "auto",
                    px: 2,
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

                <ReadField
                    label={"Детализация"}
                    value={row.detailText}
                    t={t}
                    c={c}
                />

                <ReadField
                    label={"Кто делает"}
                    value={row.who || undefined}
                    t={t}
                    c={c}
                />

                <Divider sx={{ borderColor: c.borderLight, my: 0.25 }} />

                <FieldLabel fontSize="0.58rem" bold>
                    {"Дополнительные сведения"}
                </FieldLabel>

                {EXTRA_FIELDS.map((field) => (
                    <ReadField
                        key={field.key}
                        label={getFieldLabel(field, t)}
                        value={resolveDictionaryValue(row[field.key], field, typesAll)}
                        t={t}
                        c={c}
                    />
                ))}

                {showTechnologyFields && (
                    <>
                        <Divider sx={{ borderColor: c.borderLight, my: 0.25 }} />

                        <FieldLabel fontSize="0.58rem" bold>
                            {"Технологическое решение"}
                        </FieldLabel>

                        {TECHNOLOGY_FIELDS.map((field) => (
                            <ReadField
                                key={field.key}
                                label={getFieldLabel(field, t)}
                                value={resolveDictionaryValue(row[field.key], field, typesAll)}
                                t={t}
                                c={c}
                            />
                        ))}
                    </>
                )}
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
            <Typography
                variant="caption"
                sx={{
                    display: "block",
                    color: c.textMuted,
                    fontSize: "0.66rem",
                    mb: 0.25,
                }}
            >
                {label}
            </Typography>

            <Typography
                sx={{
                    color: value ? c.textBody : c.textDim,
                    fontSize: "0.8rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                }}
            >
                {value || "Не заполнено"}
            </Typography>
        </Box>
    );
}
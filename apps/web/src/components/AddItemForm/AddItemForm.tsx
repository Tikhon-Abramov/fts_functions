import type {
    FtsFunctionActionType,
    FtsFunctionCategory,
    FtsFunctionComplexity,
    FtsFunctionExecutionFrequency,
} from "src/entities/fts-function/model";
import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link as LinkIcon, Save } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";

import {
    FTS_FUNCTION_STEP_NUMBER,
    FtsFunctionStep,
} from "src/entities/fts-function/model";
import {
    areTechnologyRequiredFieldsFilled,
    isFactualActionCode,
} from "src/entities/fts-function/lib/detail-technology";
import { MAX_PER_CATEGORY } from "src/shared/config/ui";
import { I18N, useTranslation } from "src/shared/i18n";

import {
    type AddItemFormValues,
    emptyStep,
    fieldsToData,
    isStepFilled,
    type StepFields,
} from "./lib/schema";
import { StepTab } from "./ui/StepTab";
import { StepKey, StepTabBody } from "./ui/StepTabBody";

export const ADD_ITEM_FORM_TEST_IDS = {
    SAVE_DUAL: "button-save-dual",
    SAVE_SINGLE: "button-save-single",
    QUICK_LINK: "button-quick-link",
} as const;

export type NewRowData = {
    step: FtsFunctionStep;
    category: FtsFunctionCategory;
    detailText: string;
    who?: string | undefined;
    actionLabel: FtsFunctionActionType | "";
    periodicity?: FtsFunctionExecutionFrequency | "" | undefined;
    complexity?: FtsFunctionComplexity | "" | undefined;
    artifact?: string | undefined;
    basis?: string | undefined;
    artifactUsage?: string | undefined;
    purpose?: string | undefined;
    technologicalSolution?: string | undefined;
    number?: string | undefined;
    responsible?: string | undefined;
    algorithm?: string | undefined;
};

type AddItemFormProps = {
    allRows: Row[];
    typesAll: TypeResponseDto[];
    onSaveSingle: (data: NewRowData) => string;
    onSaveDual: (
        s1: Omit<NewRowData, "step">,
        s2: Omit<NewRowData, "step">,
    ) => void;
    onQuickLink?: (id: string) => void;
    showQuickLink?: boolean;
    dualSaveHint?: string;
};

function countByStepCategory(
    rows: Row[],
    step: FtsFunctionStep,
    cat: FtsFunctionCategory,
): number {
    return rows.filter((r) => r.step === step && r.category === cat).length;
}

function isStepTechnologyValid(
    fields: StepFields,
    typesAll: TypeResponseDto[],
): boolean {
    if (!isFactualActionCode(fields.actionLabel, typesAll)) return true;
    return areTechnologyRequiredFieldsFilled(fields);
}

export default function AddItemForm({
                                        allRows,
                                        typesAll,
                                        onSaveSingle,
                                        onSaveDual,
                                        onQuickLink,
                                        showQuickLink = true,
                                        dualSaveHint = "Оба шага заполнены — будут сохранены вместе со связью",
                                    }: AddItemFormProps) {
    const { t } = useTranslation();
    const theme = useTheme();
    const c = theme.custom;

    const { control, reset, getValues } = useForm<AddItemFormValues>({
        defaultValues: { s1: emptyStep(), s2: emptyStep() },
        shouldUnregister: false,
    });

    const [activeStep, setActiveStep] = useState<FtsFunctionStep>(
        FtsFunctionStep.OBJECT_SELECTION,
    );
    const [lastSavedId, setLastSavedId] = useState<string | null>(null);

    const s1 = useWatch({ control, name: "s1", defaultValue: emptyStep() });
    const s2 = useWatch({ control, name: "s2", defaultValue: emptyStep() });

    const s1Filled = isStepFilled(s1);
    const s2Filled = isStepFilled(s2);
    const bothFilled = s1Filled && s2Filled;

    const s1TechnologyValid = isStepTechnologyValid(s1, typesAll);
    const s2TechnologyValid = isStepTechnologyValid(s2, typesAll);

    const s1Count = countByStepCategory(
        allRows,
        FtsFunctionStep.OBJECT_SELECTION,
        s1.category,
    );

    const s2Count = countByStepCategory(
        allRows,
        FtsFunctionStep.CLUSTERING_IMPACT,
        s2.category,
    );

    const s1LimitReached = s1Count >= MAX_PER_CATEGORY;
    const s2LimitReached = s2Count >= MAX_PER_CATEGORY;

    const canSave = useMemo(() => {
        if (bothFilled) {
            return (
                !s1LimitReached &&
                !s2LimitReached &&
                s1TechnologyValid &&
                s2TechnologyValid
            );
        }

        if (s1Filled) return !s1LimitReached && s1TechnologyValid;
        if (s2Filled) return !s2LimitReached && s2TechnologyValid;

        return false;
    }, [
        bothFilled,
        s1Filled,
        s2Filled,
        s1LimitReached,
        s2LimitReached,
        s1TechnologyValid,
        s2TechnologyValid,
    ]);

    const isStep1 = activeStep === FtsFunctionStep.OBJECT_SELECTION;
    const currentCount = isStep1 ? s1Count : s2Count;

    const handleSelectS1 = useCallback(() => {
        setActiveStep(FtsFunctionStep.OBJECT_SELECTION);
    }, []);

    const handleSelectS2 = useCallback(() => {
        setActiveStep(FtsFunctionStep.CLUSTERING_IMPACT);
    }, []);

    const handleQuickLink = useCallback(() => {
        if (lastSavedId && onQuickLink) onQuickLink(lastSavedId);
    }, [lastSavedId, onQuickLink]);

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();

        const { s1: v1, s2: v2 } = getValues();

        const includeS1Technology = isFactualActionCode(v1.actionLabel, typesAll);
        const includeS2Technology = isFactualActionCode(v2.actionLabel, typesAll);

        const canS1 =
            isStepFilled(v1) &&
            !s1LimitReached &&
            areTechnologyRequiredFieldsFilled(
                includeS1Technology
                    ? v1
                    : {
                        technologicalSolution: "",
                        number: "",
                        responsible: "",
                        algorithm: "",
                    },
            );

        const canS2 =
            isStepFilled(v2) &&
            !s2LimitReached &&
            areTechnologyRequiredFieldsFilled(
                includeS2Technology
                    ? v2
                    : {
                        technologicalSolution: "",
                        number: "",
                        responsible: "",
                        algorithm: "",
                    },
            );

        if (!canS1 && !canS2) return;

        if (canS1 && canS2) {
            onSaveDual(
                fieldsToData(v1, includeS1Technology),
                fieldsToData(v2, includeS2Technology),
            );
            setLastSavedId(null);
        } else {
            const step = canS1
                ? FtsFunctionStep.OBJECT_SELECTION
                : FtsFunctionStep.CLUSTERING_IMPACT;
            const fields = canS1 ? v1 : v2;
            const includeTechnology = canS1
                ? includeS1Technology
                : includeS2Technology;

            const savedId = onSaveSingle({
                step,
                ...fieldsToData(fields, includeTechnology),
            });

            setLastSavedId(showQuickLink ? savedId || null : null);
        }

        reset({ s1: emptyStep(), s2: emptyStep() });
    };

    const saveLabel = bothFilled ? "Сохранить (Шаг 1 + Шаг 2)" : "Сохранить";
    const canShowQuickLink = showQuickLink && Boolean(lastSavedId) && onQuickLink;
    const activeTechnologyValid = isStep1 ? s1TechnologyValid : s2TechnologyValid;

    return (
        <Box
            component="form"
            onSubmit={onSubmit}
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <Box sx={{ p: 2, pb: 1, flexShrink: 0 }}>
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
                    {"Новый элемент"}
                </Typography>
            </Box>

            <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <StepTab
                        step={FtsFunctionStep.OBJECT_SELECTION}
                        activeStep={activeStep}
                        label={"Шаг 1"}
                        filled={s1Filled}
                        onSelect={handleSelectS1}
                        theme={theme}
                    />

                    <StepTab
                        step={FtsFunctionStep.CLUSTERING_IMPACT}
                        activeStep={activeStep}
                        label={"Шаг 2"}
                        filled={s2Filled}
                        onSelect={handleSelectS2}
                        theme={theme}
                    />
                </Box>
            </Box>

            <Box sx={{ display: isStep1 ? "contents" : "none" }}>
                <StepTabBody
                    control={control}
                    step={StepKey.S1}
                    fields={s1 as StepFields}
                    currentCount={s1Count}
                    limitReached={s1LimitReached}
                    filled={s1Filled}
                    typesAll={typesAll}
                    theme={theme}
                />
            </Box>

            <Box sx={{ display: isStep1 ? "none" : "contents" }}>
                <StepTabBody
                    control={control}
                    step={StepKey.S2}
                    fields={s2 as StepFields}
                    currentCount={s2Count}
                    limitReached={s2LimitReached}
                    filled={s2Filled}
                    typesAll={typesAll}
                    theme={theme}
                />
            </Box>

            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    flexShrink: 0,
                    borderTop: `1px solid ${c.borderLight}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                }}
            >
                {bothFilled && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: theme.palette.success.main,
                            fontSize: "0.68rem",
                            textAlign: "center",
                        }}
                    >
                        {dualSaveHint}
                    </Typography>
                )}

                {!activeTechnologyValid && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: theme.palette.warning.main,
                            fontSize: "0.68rem",
                            textAlign: "center",
                        }}
                    >
                        {
                            "Если выбрано технологическое решение, заполните номер ПЗ / АЗ, ответственного и алгоритм срабатывания"
                        }
                    </Typography>
                )}

                <Typography
                    variant="caption"
                    sx={{ color: c.textDim, fontSize: "0.62rem" }}
                >
                    {t(I18N.addItem.inCategoryCount, {
                        step: FTS_FUNCTION_STEP_NUMBER[activeStep],
                        count: currentCount,
                        limit: MAX_PER_CATEGORY,
                    })}
                </Typography>

                <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSave}
                    startIcon={<Save sx={{ fontSize: 16 }} />}
                    sx={{
                        textTransform: "none",
                        fontSize: "0.8rem",
                        bgcolor: c.saveBtn,
                        "&:hover": { bgcolor: c.saveBtnHover },
                        "&.Mui-disabled": { bgcolor: c.borderMain, color: c.textDim },
                    }}
                    data-testid={
                        bothFilled
                            ? ADD_ITEM_FORM_TEST_IDS.SAVE_DUAL
                            : ADD_ITEM_FORM_TEST_IDS.SAVE_SINGLE
                    }
                >
                    {saveLabel}
                </Button>

                {canShowQuickLink && (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleQuickLink}
                        startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
                        sx={{
                            textTransform: "none",
                            fontSize: "0.72rem",
                            borderColor: theme.palette.primary.main,
                            color: c.accentBlue,
                            "&:hover": {
                                borderColor: theme.palette.primary.dark,
                                bgcolor: c.selectedBg,
                            },
                        }}
                        data-testid={ADD_ITEM_FORM_TEST_IDS.QUICK_LINK}
                    >
                        {"Сразу связать"}
                    </Button>
                )}
            </Box>
        </Box>
    );
}
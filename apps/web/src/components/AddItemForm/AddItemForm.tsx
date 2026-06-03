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
import { FtsFunctionStep } from "src/entities/fts-function/model";
import {
  hasTechnologicalSolution,
  isActualActionCategory,
} from "src/entities/fts-function/lib/detail-technology";

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
  algorithmFile?: File | null;
};

type AddItemFormProps = {
  allRows: Row[];
  typesAll: TypeResponseDto[];
  onSaveSingle: (data: NewRowData) => Promise<string>;
  onSaveDual: (
    s1: Omit<NewRowData, "step">,
    s2: Omit<NewRowData, "step">,
  ) => Promise<void>;
  onQuickLink?: (id: string) => void;
  showQuickLink?: boolean;
  dualSaveHint?: string;
};

function isStepTechnologyValid(
  fields: StepFields,
  algorithmFile: File | null,
): boolean {
  if (!isActualActionCategory(fields.category)) return true;
  if (!hasTechnologicalSolution(fields)) return true;

  return Boolean(
    fields.number.trim() &&
      fields.responsible.trim() &&
      (fields.algorithm.trim() || algorithmFile),
  );
}

export default function AddItemForm({
  allRows: _allRows,
  typesAll,
  onSaveSingle,
  onSaveDual,
  onQuickLink,
  showQuickLink = true,
  dualSaveHint = "Оба шага заполнены — будут сохранены вместе со связью",
}: AddItemFormProps) {
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
  const [s1AlgorithmFile, setS1AlgorithmFile] = useState<File | null>(null);
  const [s2AlgorithmFile, setS2AlgorithmFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const s1 = useWatch({ control, name: "s1", defaultValue: emptyStep() });
  const s2 = useWatch({ control, name: "s2", defaultValue: emptyStep() });

  const s1Filled = isStepFilled(s1);
  const s2Filled = isStepFilled(s2);
  const bothFilled = s1Filled && s2Filled;

  const s1TechnologyValid = isStepTechnologyValid(s1, s1AlgorithmFile);
  const s2TechnologyValid = isStepTechnologyValid(s2, s2AlgorithmFile);

  const canSave = useMemo(() => {
    if (saving) return false;
    if (bothFilled) return s1TechnologyValid && s2TechnologyValid;
    if (s1Filled) return s1TechnologyValid;
    if (s2Filled) return s2TechnologyValid;

    return false;
  }, [
    saving,
    bothFilled,
    s1Filled,
    s2Filled,
    s1TechnologyValid,
    s2TechnologyValid,
  ]);

  const isStep1 = activeStep === FtsFunctionStep.OBJECT_SELECTION;

  const handleSelectS1 = useCallback(() => {
    setActiveStep(FtsFunctionStep.OBJECT_SELECTION);
  }, []);

  const handleSelectS2 = useCallback(() => {
    setActiveStep(FtsFunctionStep.CLUSTERING_IMPACT);
  }, []);

  const handleQuickLink = useCallback(() => {
    if (lastSavedId && onQuickLink) onQuickLink(lastSavedId);
  }, [lastSavedId, onQuickLink]);

  const resetForm = useCallback(() => {
    reset({ s1: emptyStep(), s2: emptyStep() });
    setS1AlgorithmFile(null);
    setS2AlgorithmFile(null);
  }, [reset]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (saving) return;

    void (async () => {
      const { s1: v1, s2: v2 } = getValues();

      const includeS1Technology = isActualActionCategory(v1.category);
      const includeS2Technology = isActualActionCategory(v2.category);

      const canS1 =
        isStepFilled(v1) && isStepTechnologyValid(v1, s1AlgorithmFile);
      const canS2 =
        isStepFilled(v2) && isStepTechnologyValid(v2, s2AlgorithmFile);

      if (!canS1 && !canS2) return;

      setSaving(true);

      try {
        if (canS1 && canS2) {
          await onSaveDual(
            fieldsToData(v1, includeS1Technology, s1AlgorithmFile),
            fieldsToData(v2, includeS2Technology, s2AlgorithmFile),
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
          const algorithmFile = canS1 ? s1AlgorithmFile : s2AlgorithmFile;

          const savedId = await onSaveSingle({
            step,
            ...fieldsToData(fields, includeTechnology, algorithmFile),
          });

          setLastSavedId(showQuickLink ? savedId || null : null);
        }

        resetForm();
      } finally {
        setSaving(false);
      }
    })();
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
          fields={s1}
          filled={s1Filled}
          typesAll={typesAll}
          theme={theme}
          algorithmFile={s1AlgorithmFile}
          onChangeAlgorithmFile={setS1AlgorithmFile}
        />
      </Box>

      <Box sx={{ display: isStep1 ? "none" : "contents" }}>
        <StepTabBody
          control={control}
          step={StepKey.S2}
          fields={s2}
          filled={s2Filled}
          typesAll={typesAll}
          theme={theme}
          algorithmFile={s2AlgorithmFile}
          onChangeAlgorithmFile={setS2AlgorithmFile}
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
              "Если выбрано технологическое решение, заполните номер ПЗ / АЗ, ответственного и прикрепите файл"
            }
          </Typography>
        )}

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
          {saving ? "Сохранение..." : saveLabel}
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

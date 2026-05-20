import type {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
} from "src/entities/fts-function/model";
import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link as LinkIcon, Save } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";
import {
  FTS_FUNCTION_STEP_NUMBER,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
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
};

type AddItemFormProps = {
  allRows: Row[];
  typesAll: TypeResponseDto[];
  onSaveSingle: (data: NewRowData) => string;
  onSaveDual: (
    s1: Omit<NewRowData, "step">,
    s2: Omit<NewRowData, "step">,
  ) => void;
  onQuickLink: (id: string) => void;
};

function countByStepCategory(
  rows: Row[],
  step: FtsFunctionStep,
  cat: FtsFunctionCategory,
): number {
  return rows.filter((r) => r.step === step && r.category === cat).length;
}

export default function AddItemForm({
  allRows,
  typesAll,
  onSaveSingle,
  onSaveDual,
  onQuickLink,
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

  // useWatch can briefly return undefined for nested objects between mount
  // and RHF's defaults propagating; supply explicit fallbacks so consumers
  // never see undefined. Cheaper than guarding every read site.
  const s1 = useWatch({ control, name: "s1", defaultValue: emptyStep() });
  const s2 = useWatch({ control, name: "s2", defaultValue: emptyStep() });

  const s1Filled = isStepFilled(s1);
  const s2Filled = isStepFilled(s2);
  const bothFilled = s1Filled && s2Filled;

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

  // `canSave` is the AddItemForm equivalent of `formState.isValid` from auth
  // forms: at least one step's detailText must be filled (the form's only
  // soft-required field) AND the per-category limit on each filled step
  // must not be reached. The submit button is wired to `disabled={!canSave}`
  // (see Save Button below), matching the auth-form pattern of
  // `disabled={!isValid}`.
  const canSave = useMemo(() => {
    if (bothFilled) return !s1LimitReached && !s2LimitReached;
    if (s1Filled) return !s1LimitReached;
    if (s2Filled) return !s2LimitReached;
    return false;
  }, [bothFilled, s1Filled, s2Filled, s1LimitReached, s2LimitReached]);

  const isStep1 = activeStep === FtsFunctionStep.OBJECT_SELECTION;
  const currentCount = isStep1 ? s1Count : s2Count;

  const handleSelectS1 = useCallback(() => {
    setActiveStep(FtsFunctionStep.OBJECT_SELECTION);
  }, []);
  const handleSelectS2 = useCallback(() => {
    setActiveStep(FtsFunctionStep.CLUSTERING_IMPACT);
  }, []);
  const handleQuickLink = useCallback(() => {
    if (lastSavedId) onQuickLink(lastSavedId);
  }, [lastSavedId, onQuickLink]);

  // We deliberately DON'T use `handleSubmit(callback)` — it gates on RHF's
  // `formState.isValid`, which raced with tab-switch unmounts and silently
  // no-op'd every click. We take a single `getValues()` snapshot, recompute
  // the save gate from THAT snapshot (so the gate and the action can never
  // disagree), and only mutate state on a branch that actually fires.
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { s1: v1, s2: v2 } = getValues();
    const canS1 = isStepFilled(v1) && !s1LimitReached;
    const canS2 = isStepFilled(v2) && !s2LimitReached;
    if (!canS1 && !canS2) return;

    if (canS1 && canS2) {
      onSaveDual(fieldsToData(v1), fieldsToData(v2));
      setLastSavedId(null);
    } else {
      const step = canS1
        ? FtsFunctionStep.OBJECT_SELECTION
        : FtsFunctionStep.CLUSTERING_IMPACT;
      const fields = canS1 ? v1 : v2;
      setLastSavedId(onSaveSingle({ step, ...fieldsToData(fields) }));
    }
    reset({ s1: emptyStep(), s2: emptyStep() });
  };

  const saveLabel = bothFilled ? "Сохранить (Шаг 1 + Шаг 2)" : "Сохранить";

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

      {/* Both step bodies stay mounted permanently; we hide the inactive one
          with `display: none`. Previously we conditionally rendered ONE body
          and swapped its `step` prop on tab change — that caused all the
          inner Controllers to re-bind to the other step's field paths, which
          (combined with RHF's name-change handling) silently dropped the
          inactive step's values, leaving "Save" with stale or empty data. */}
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
            {"Оба шага заполнены — будут сохранены вместе со связью"}
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

        {lastSavedId && (
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

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Dialog, Typography, useTheme } from "@mui/material";
import { Save } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StepTab } from "./StepTab";
import { StepTabBody } from "./StepTabBody";
import { CreateFtsFunctionDetailSchema, type FtsFunctionDetailData } from "./schema";
import { useFtsFunctionDetailControllerCreateV1Mutation } from "../../../../store/ftsFunctionRegistry";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionId } from "../../../../store/uiSlice";
import type { OptionType } from "../../../../utils/create-options";
import { useFileUtils } from "../../../../common/hooks/useFileLinkUtils";



const EMPTY_FORM: FtsFunctionDetailData = {
  ftsFunctionId: Number.NaN,
  ftsFunctionStepId: Number.NaN,
  ftsFunctionCategoryId: Number.NaN,
  ftsFunctionComplexityId: null,
  ftsFunctionExecutionFrequencyId: null,
  whoPerformsActionId: Number.NaN,
  technologicalSolutionId: null,
  responsibleId: null,
  ftsFunctionDetails: "",
  actionsСompleteness: "",
  actionsEffectiveness: "",
  basis: "",
  artifact: "",
  artifactUsage: "",
  number: "",
  algorithm: "",
};

// Коды-справочники для условной логики (приходят в OptionType.code).
const ACTUAL_ACTION_CODE = "ACTUAL_ACTION";
const TASK_SOLUTION_CODES = new Set(["AUTOMATIC_TASK", "USER_TASK"]);

type FtsFunctionDetailFormModalProps = {
  open: boolean;
  onClose: () => void;
  options: {
    ftsFunctionStepOptions: OptionType[];
    ftsFunctionCategoryOptions: OptionType[];
    ftsFunctionComplexityOptions: OptionType[];
    ftsFunctionExecutionFrequencyOptions: OptionType[];
    whoPerformsActionOptions: OptionType[];
    ftsFunctionActionTypeOptions: OptionType[];
    ftsFunctionEffectivenessOptions: OptionType[];
    technologicalSolutionOptions: OptionType[];
    feedbackSourceOptions: OptionType[];
    ftsMethodologyStatusOptions: OptionType[];
    responsibleOptions: OptionType[];
  };
};

export function FtsFunctionDetailFormModal({
  open,
  onClose,
  options,
}: FtsFunctionDetailFormModalProps) {
  const theme = useTheme();
  const c = theme.custom;

  const selectedFtsFunctionId = useAppSelector(selectSelectedFtsFunctionId);

  // Файл алгоритма (один; «текст ИЛИ файл») — грузим после создания детализации.
  const [algorithmFile, setAlgorithmFile] = useState<File | null>(null);
  const { uploadFile } = useFileUtils();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isValid, isSubmitting },
  } = useForm<FtsFunctionDetailData>({
    resolver: zodResolver(CreateFtsFunctionDetailSchema),
    mode: "onChange",
    defaultValues: EMPTY_FORM,
  });

  const [createFtsFunctionDetail, { isLoading: isCreating }] = useFtsFunctionDetailControllerCreateV1Mutation();
  const submitting = isSubmitting || isCreating;

  // ============ Привязка ftsFunctionId / сброс при закрытии ============
  useEffect(() => {
    if (selectedFtsFunctionId) {
      setValue("ftsFunctionId", selectedFtsFunctionId, { shouldValidate: true });
    }
  }, [selectedFtsFunctionId, setValue, open]);

  useEffect(() => {
    if (!open) {
      reset(EMPTY_FORM);
      setAlgorithmFile(null);
    }
  }, [open, reset]);

  // ============ Шаги (таб → ftsFunctionStepId по индексу опций) ============
  const stepOptions = options.ftsFunctionStepOptions;
  const [activeStep, setActiveStep] = useState<"OBJECT_SELECTION" | "CLUSTERING_IMPACT">(
    "OBJECT_SELECTION",
  );
  const isStep1 = activeStep === "OBJECT_SELECTION";
  const stepId = isStep1 ? stepOptions[0]?.value : stepOptions[1]?.value;

  useEffect(() => {
    if (stepId != null) {
      setValue("ftsFunctionStepId", stepId, { shouldValidate: true, shouldDirty: true });
    }
  }, [stepId, setValue, open]);

  // ============ Условия по кодам справочников ============
  const categoryId = watch("ftsFunctionCategoryId");
  const technologicalSolutionId = watch("technologicalSolutionId");
  const number = watch("number");
  const responsibleId = watch("responsibleId");


  const categoryCode = options.ftsFunctionCategoryOptions.find(
    (option) => option.value === categoryId,
  )?.code;
  const technologyCode = options.technologicalSolutionOptions.find(
    (option) => option.value === technologicalSolutionId,
  )?.code;

  const showTechnology = categoryCode === ACTUAL_ACTION_CODE;
  const taskFieldsRequired = Boolean(technologyCode && TASK_SOLUTION_CODES.has(technologyCode));

  // Для типа-«задание» требуем «Номер» и «Ответственный».
  const technologyValid =
    !taskFieldsRequired ||
    (Boolean(number && number.trim()) && responsibleId != null && !Number.isNaN(responsibleId));

  const canSave = isValid && technologyValid && !submitting;

  // ============ Отправка ============
  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await createFtsFunctionDetail({ createFtsFunctionDetailDto: values }).unwrap();
      const newId = Number(result.data.id);

      if (algorithmFile && !Number.isNaN(newId)) {
        try {
          await uploadFile({ ftsFunctionDetailId: newId, file: algorithmFile });
        } catch (fileError) {
          console.error("Не удалось загрузить файл алгоритма:", fileError);
        }
      }

      reset(EMPTY_FORM);
      setAlgorithmFile(null);
      onClose();
    } catch (error) {
      // Глобальный обработчик ошибок (baseQuery) уже показывает тост.
      console.error("Не удалось создать детализацию:", error);
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            bgcolor: c.bgPaper,
            color: c.textBody,
            border: `1px solid ${c.borderMain}`,
            maxHeight: "90vh",
          },
        },
      }}
    >
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {/* Шапка */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${c.borderLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography sx={{ color: c.textPrimary, fontSize: "1rem", fontWeight: 700 }}>
            {"Новый элемент"}
          </Typography>

          <Button
            type="submit"
            variant="contained"
            disabled={!canSave}
            startIcon={
              submitting ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : <Save sx={{ fontSize: 16 }} />
            }
            sx={{
              textTransform: "none",
              fontSize: "0.8rem",
              bgcolor: c.saveBtn,
              "&:hover": { bgcolor: c.saveBtnHover },
              "&.Mui-disabled": { bgcolor: c.borderMain, color: c.textDim },
            }}
          >
            {submitting ? "Сохранение..." : "Сохранить"}
          </Button>
        </Box>

        {/* Табы шагов */}
        <Box sx={{ px: 2, pt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
          <StepTab
            step="OBJECT_SELECTION"
            activeStep={activeStep}
            label="Шаг 1"
            filled={false}
            onSelect={() => setActiveStep("OBJECT_SELECTION")}
            theme={theme}
          />
          <StepTab
            step="CLUSTERING_IMPACT"
            activeStep={activeStep}
            label="Шаг 2"
            filled={false}
            onSelect={() => setActiveStep("CLUSTERING_IMPACT")}
            theme={theme}
          />
        </Box>

        {/* Тело шага */}
        <Box sx={{ minHeight: 0, overflow: "auto" }}>
          <StepTabBody
            control={control}
            options={options}
            showTechnology={showTechnology}
            taskFieldsRequired={taskFieldsRequired}
            theme={theme}
            algorithmFile={algorithmFile}
            onChangeAlgorithmFile={setAlgorithmFile}
          />
        </Box>
      </Box>
    </Dialog>
  );
}

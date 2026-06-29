import { useState } from "react";
import { Box, Button, CircularProgress, Typography, useTheme } from "@mui/material";
import { Save } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFileUtils } from "../../../../common/hooks/useFileLinkUtils";
import {
  CreateFtsFunctionDetailSchema,
  type FtsFunctionDetailData,
} from "../FtsFunctionDetailFormModal/schema";
import { StepTabBody } from "../FtsFunctionDetailFormModal/StepTabBody";
import {
  useFtsFunctionDetailControllerUpdateV1Mutation,
  type FtsFunctionDetailBaseResponseDto,
} from "../../../../store/ftsFunctionRegistry";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionId } from "../../../../store/uiSlice";
import type { OptionType } from "../../../../utils/create-options";

type DetailData = FtsFunctionDetailBaseResponseDto["data"];

type FtsFunctionDetailInfoEditProps = {
  detail: DetailData;
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
  onCancel: () => void;
  onSaved: () => void;
};

const ACTUAL_ACTION_CODE = "ACTUAL_ACTION";
const TASK_SOLUTION_CODES = new Set(["AUTOMATIC_TASK", "USER_TASK"]);

/** Загруженная деталь (вложенные типы) → значения формы (числовые id). */
function toFormValues(detail: DetailData): Omit<FtsFunctionDetailData, "ftsFunctionId"> {
  return {
    ftsFunctionStepId: detail.ftsFunctionStep.id,
    ftsFunctionCategoryId: detail.ftsFunctionCategory.id,
    ftsFunctionComplexityId: detail.ftsFunctionComplexity?.id ?? null,
    ftsFunctionExecutionFrequencyId: detail.ftsFunctionExecutionFrequency?.id ?? null,
    whoPerformsActionId: detail.whoPerformsAction!.id,
    technologicalSolutionId: detail.technologicalSolution?.id ?? null,
    responsibleId: detail.responsible?.id ?? null,
    ftsFunctionDetails: detail.ftsFunctionDetails,
    actionsСompleteness: detail.actionsСompleteness ?? "",
    actionsEffectiveness: detail.actionsEffectiveness ?? "",
    basis: detail.basis ?? "",
    artifact: detail.artifact ?? "",
    artifactUsage: detail.artifactUsage ?? "",
    number: detail.number ?? "",
    algorithm: detail.algorithm ?? "",
  };
}

export function FtsFunctionDetailInfoEdit({
  detail,
  options,
  onCancel,
  onSaved,
}: FtsFunctionDetailInfoEditProps) {
  const theme = useTheme();
  const c = theme.custom;

  const { uploadFile, downloadFile, deleteFile } = useFileUtils();

  // ftsFunctionId нет в detail и он не нужен для update (вырезается перед отправкой),
  // но обязателен в create-схеме — берём реальный id выбранной функции, чтобы форма
  // прошла валидацию и сохранение сработало.
  const selectedFtsFunctionId = useAppSelector(selectSelectedFtsFunctionId);

  // Файл алгоритма (один; «текст ИЛИ файл»).
  const [algorithmFile, setAlgorithmFile] = useState<File | null>(null);
  const [removedExistingFileKey, setRemovedExistingFileKey] = useState<string | null>(null);

  const existingFile = detail.algorithmFiles[0] ?? null;
  const existingFileName =
    existingFile && !algorithmFile && removedExistingFileKey !== existingFile.objectKey
      ? existingFile.originalName
      : null;

  const { control, handleSubmit, watch } = useForm<FtsFunctionDetailData>({
    resolver: zodResolver(CreateFtsFunctionDetailSchema),
    mode: "onChange",
    defaultValues: {
      ...toFormValues(detail),
      ftsFunctionId: selectedFtsFunctionId ?? Number.NaN,
    },
  });

  const [updateFtsFunctionDetail, { isLoading: isUpdating }] =
    useFtsFunctionDetailControllerUpdateV1Mutation();

  // ============ Условия по кодам справочников ============
  const categoryId = watch("ftsFunctionCategoryId");
  const technologicalSolutionId = watch("technologicalSolutionId");
  const number = watch("number");
  const responsibleId = watch("responsibleId");
  const ftsFunctionDetails = watch("ftsFunctionDetails");

  const categoryCode = options.ftsFunctionCategoryOptions.find(
    (option) => option.value === categoryId,
  )?.code;
  const technologyCode = options.technologicalSolutionOptions.find(
    (option) => option.value === technologicalSolutionId,
  )?.code;

  const showTechnology = categoryCode === ACTUAL_ACTION_CODE;
  const taskFieldsRequired = Boolean(technologyCode && TASK_SOLUTION_CODES.has(technologyCode));

  const technologyValid =
    !taskFieldsRequired ||
    (Boolean(number && number.trim()) && responsibleId != null && !Number.isNaN(responsibleId));

  // ftsFunctionId в форме невалиден (NaN) и в update не нужен, поэтому проверяем
  // обязательные поля вручную: наименование, категория, шаг, условия тех. блока.
  const categoryValid = typeof categoryId === "number" && !Number.isNaN(categoryId);
  const canSave =
    Boolean(ftsFunctionDetails && ftsFunctionDetails.trim()) &&
    categoryValid &&
    technologyValid &&
    !isUpdating;

  // ============ Сохранение (обновление детализации) ============
  const onSubmit = handleSubmit(async (values) => {
    const { ftsFunctionId: _ignored, ...updateDto } = values;

    try {
      await updateFtsFunctionDetail({
        id: String(detail.id),
        updateFtsFunctionDetailDto: updateDto,
      }).unwrap();

      const detailId = Number(detail.id);

      // Существующий файл заменили или сняли → удаляем его.
      const shouldDeleteExisting =
        existingFile &&
        (removedExistingFileKey === existingFile.objectKey || algorithmFile != null);

      if (shouldDeleteExisting) {
        try {
          await deleteFile({ id: existingFile.objectKey });
        } catch (fileError) {
          console.error("Не удалось удалить файл алгоритма:", fileError);
        }
      }

      // Загружаем новый файл, если выбран.
      if (algorithmFile && !Number.isNaN(detailId)) {
        try {
          await uploadFile({ ftsFunctionDetailId: detailId, file: algorithmFile });
        } catch (fileError) {
          console.error("Не удалось загрузить файл алгоритма:", fileError);
        }
      }

      onSaved();
    } catch (error) {
      // Глобальный обработчик ошибок (baseQuery) уже показывает тост.
      console.error("Не удалось обновить детализацию:", error);
    }
  });

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: c.bgSurface,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${c.borderLight}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Box>
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
            {"Редактирование сведений"}
          </Typography>

          {!technologyValid && (
            <Typography sx={{ color: theme.palette.warning.main, fontSize: "0.68rem", mt: 0.5 }}>
              {"Для выбранного типа решения заполните «Номер» и «Ответственный»."}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Button
            size="small"
            onClick={onCancel}
            disabled={isUpdating}
            sx={{ textTransform: "none", fontSize: "0.72rem", color: c.textSecondary }}
          >
            {"Отмена"}
          </Button>

          <Button
            type="submit"
            size="small"
            variant="contained"
            disabled={!canSave}
            startIcon={
              isUpdating ? (
                <CircularProgress size={14} sx={{ color: "inherit" }} />
              ) : (
                <Save sx={{ fontSize: 14 }} />
              )
            }
            sx={{
              textTransform: "none",
              fontSize: "0.72rem",
              bgcolor: c.saveBtn,
              "&:hover": { bgcolor: c.saveBtnHover },
              "&.Mui-disabled": { bgcolor: c.borderMain, color: c.textDim },
            }}
          >
            {isUpdating ? "Сохранение..." : "Сохранить"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <StepTabBody
          control={control}
          options={options}
          showTechnology={showTechnology}
          taskFieldsRequired={taskFieldsRequired}
          theme={theme}
          algorithmFile={algorithmFile}
          onChangeAlgorithmFile={setAlgorithmFile}
          existingAlgorithmFileName={existingFileName}
          onDownloadAlgorithmFile={
            existingFile
              ? () =>
                  void downloadFile({
                    objectKey: existingFile.objectKey,
                    fileName: existingFile.originalName ?? undefined,
                  }).catch((error) =>
                    console.error("Не удалось скачать файл алгоритма:", error),
                  )
              : undefined
          }
          onRemoveExistingAlgorithmFile={
            existingFile ? () => setRemovedExistingFileKey(existingFile.objectKey) : undefined
          }
        />
      </Box>
    </Box>
  );
}

import type { Theme } from "@mui/material";
import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useController, useWatch, type Control, type FieldPath } from "react-hook-form";
import { FieldLabel } from "../../../../components/FieldLabel";
import { FileAttachmentInput } from "../../../../components/FileAttachmentInput";
import type { OptionType } from "../../../../utils/create-options";
import type { FtsFunctionDetailData } from "./schema";
import { useEffect, useMemo, useRef, type Ref } from "react";

type StepTabBodyOptions = {
  ftsFunctionCategoryOptions: OptionType[];
  whoPerformsActionOptions: OptionType[];
  personPerformingActionOptions: OptionType[];
  ftsFunctionComplexityOptions: OptionType[];
  ftsFunctionExecutionFrequencyOptions: OptionType[];
  ftsFunctionActionTypeOptions: OptionType[];
  ftsFunctionEffectivenessOptions: OptionType[];
  technologicalSolutionOptions: OptionType[];
  responsibleOptions: OptionType[];
};

type StepTabBodyProps = {
  control: Control<FtsFunctionDetailData>;
  options: StepTabBodyOptions;
  showTechnology: boolean;
  taskFieldsRequired: boolean;
  theme: Theme;
  algorithmFile: File | null;
  onChangeAlgorithmFile: (file: File | null) => void;
  existingAlgorithmFileName?: string | null;
  onDownloadAlgorithmFile?: () => void;
  onRemoveExistingAlgorithmFile?: () => void;
};

export function StepTabBody({
  control,
  options,
  showTechnology,
  taskFieldsRequired,
  theme,
  algorithmFile,
  onChangeAlgorithmFile,
  existingAlgorithmFileName,
  onDownloadAlgorithmFile,
  onRemoveExistingAlgorithmFile,
}: StepTabBodyProps) {
  const c = theme.custom;

  const technologicalSolutionId = useWatch({ control, name: "technologicalSolutionId" });
  const technologySelected =
    technologicalSolutionId != null && !Number.isNaN(technologicalSolutionId);

  // Алгоритм теперь только файл (текстовое поле убрано, поля algorithm в форме нет).
  const hasAlgorithmFile = Boolean(algorithmFile) || Boolean(existingAlgorithmFileName);

  const personPerformingActionId = useWatch({ control, name: "personPerformingActionId" });
  const personPerformingActionCode = useMemo(() => (
    options.personPerformingActionOptions.find(({ value }) => value === personPerformingActionId)?.code
  ), [personPerformingActionId, options])

  // Очищаем «Иное лицо», когда выбрано лицо, отличное от OTHER_PERSON.
  // setValue сюда не передан, поэтому берём onChange поля через useController.
  const { field: otherPersonField } = useController({
    control,
    name: "otherPersonPerformingAction",
  });
  const otherPersonInputRef = useRef<HTMLInputElement>(null);
  const didMountRef = useRef(false);

  useEffect(() => {
    // Пропускаем первый прогон (маунт) — реагируем только на смену значения пользователем.
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (personPerformingActionCode === "OTHER_PERSON") {
      otherPersonInputRef.current?.focus();
    } else if (otherPersonField.value) {
      otherPersonField.onChange("");
    }
  }, [personPerformingActionCode]);


  
  const renderSelect = (
    name: FieldPath<FtsFunctionDetailData>,
    label: string,
    opts: OptionType[],
    cfg?: { allowEmpty?: boolean; disabled?: boolean },
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormControl
          size="small"
          fullWidth
          disabled={cfg?.disabled}
          error={Boolean(fieldState.error)}
        >
          <InputLabel
            sx={{
              color: c.textMuted,
              fontSize: "0.72rem",
              "&.Mui-focused": { color: theme.palette.primary.main },
            }}
          >
            {label}
          </InputLabel>
          <Select
            value={field.value ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              field.onChange(raw === "" ? null : Number(raw));
            }}
            label={label}
            sx={{
              bgcolor: c.bgInput,
              color: c.textBody,
              fontSize: "0.78rem",
              "& fieldset": { borderColor: c.borderMedium },
              "&:hover fieldset": { borderColor: c.borderHover },
              "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
              "& .MuiSelect-icon": { color: c.textMuted },
            }}
            MenuProps={{
              slotProps: {
                paper: {
                  sx: {
                    bgcolor: c.bgMenu,
                    color: c.textBody,
                    maxHeight: 200,
                    border: `1px solid ${c.borderMain}`,
                    "& .MuiMenuItem-root": {
                      "&:hover": { bgcolor: c.hoverOverlayStrong },
                      "&.Mui-selected": { bgcolor: c.selectedBg },
                    },
                  },
                },
              },
            }}
          >
            {cfg?.allowEmpty && (
              <MenuItem
                value=""
                sx={{ fontSize: "0.78rem", fontStyle: "italic", color: c.textDim }}
              >
                {"— не выбрано —"}
              </MenuItem>
            )}
            {opts.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ fontSize: "0.78rem" }}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );

  const renderText = (
    name: FieldPath<FtsFunctionDetailData>,
    label: string,
    cfg?: { multiline?: boolean; disabled?: boolean; inputRef?: Ref<HTMLInputElement> },
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          value={field.value ?? ""}
          onChange={(event) => field.onChange(event.target.value)}
          onBlur={field.onBlur}
          label={label}
          fullWidth
          size="small"
          inputRef={cfg?.inputRef}
          disabled={cfg?.disabled}
          multiline={cfg?.multiline}
          rows={cfg?.multiline ? 2 : undefined}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: c.bgInput,
              color: c.textBody,
              fontSize: "0.78rem",
              "& fieldset": { borderColor: c.borderMedium },
              "&:hover fieldset": { borderColor: c.borderHover },
              "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
            },
            "& .MuiInputLabel-root": { color: c.textMuted, fontSize: "0.72rem" },
            "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main },
          }}
        />
      )}
    />
  );

  return (
    <Box sx={{ containerType: "inline-size", minWidth: 0 }}>
      <Box
        sx={{
          p: 2,
          display: "grid",
          gridTemplateColumns: "1fr",
          "@container (min-width: 700px)": {
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          },
          gap: 1.4,
        }}
      >
        <Box sx={{ gridColumn: "1 / -1" }}>
          <FieldLabel fontSize="0.62rem" bold>
            {"Основные поля"}
          </FieldLabel>
        </Box>

        {renderSelect("ftsFunctionCategoryId", "Категория", options.ftsFunctionCategoryOptions)}
        {renderSelect("whoPerformsActionId", "Кто делает", options.whoPerformsActionOptions, {
          allowEmpty: true,
        })}

        <Box sx={{ gridColumn: "1 / -1" }}>
          {renderText("ftsFunctionDetails", "Наименование действия", { multiline: true })}
        </Box>

        <Box sx={{ gridColumn: "1 / -1" }}>
          <Divider sx={{ borderColor: c.borderLight, my: 0.5 }} />
          <FieldLabel fontSize="0.62rem" bold>
            {"Дополнительные сведения"}
          </FieldLabel>
        </Box>

        {renderSelect(
          "ftsFunctionExecutionFrequencyId",
          "Периодичность",
          options.ftsFunctionExecutionFrequencyOptions,
          { allowEmpty: true },
        )}
        {renderSelect("ftsFunctionComplexityId", "Сложность", options.ftsFunctionComplexityOptions, {
          allowEmpty: true,
        })}
        {renderText("artifact", "Артефакт")}
        {renderText("basis", "Нормативное основание")}

        <Box sx={{ gridColumn: "1 / -1" }}>
          {renderText("artifactUsage", "Как используется артефакт", { multiline: true })}
        </Box>
        {renderSelect("personPerformingActionId", "Лицо, выполняющее действие", options.personPerformingActionOptions, {
          allowEmpty: true,
        })}
        {
        renderText("otherPersonPerformingAction", "Иное лицо, выполняющее действие", {
            disabled: personPerformingActionCode !== 'OTHER_PERSON',
            inputRef: otherPersonInputRef,
          }
        )}
        <Box sx={{ gridColumn: "1 / -1" }}>
          {renderText(
            "actionsСompleteness",
            "Полнота действий — метрика полноты отработки объектов",
            { multiline: true },
          )}
        </Box>

        <Box sx={{ gridColumn: "1 / -1" }}>
          {renderText("actionsEffectiveness", "Эффективность действий КПЭ", { multiline: true })}
        </Box>
        {showTechnology && (
          <>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Divider sx={{ borderColor: c.borderLight, my: 0.5 }} />
              <FieldLabel fontSize="0.62rem" bold>
                {"Технологическое решение"}
              </FieldLabel>
            </Box>

            <Box sx={{ gridColumn: "1 / -1" }}>
              {renderSelect(
                "technologicalSolutionId",
                "Технологическое решение",
                options.technologicalSolutionOptions,
                { allowEmpty: true },
              )}
            </Box>

            {renderText("number", `Номер${taskFieldsRequired ? " *" : ""}`, {
              disabled: !taskFieldsRequired,
            })}

            {renderSelect(
              "responsibleId",
              `Ответственный${taskFieldsRequired ? " *" : ""}`,
              options.responsibleOptions,
              { allowEmpty: true, disabled: !taskFieldsRequired },
            )}

            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography
                variant="caption"
                sx={{ display: "block", color: c.textMuted, fontSize: "0.66rem", mb: 0.5 }}
              >
                Файл
              </Typography>

              <FileAttachmentInput
                selectedFile={algorithmFile}
                fileName={existingAlgorithmFileName ?? undefined}
                disabled={!technologySelected}
                onChangeFile={onChangeAlgorithmFile}
                onDownloadFile={onDownloadAlgorithmFile}
              />

              {hasAlgorithmFile && (
                <Button
                  size="small"
                  onClick={() => {
                    onChangeAlgorithmFile(null);
                    onRemoveExistingAlgorithmFile?.();
                  }}
                  sx={{
                    mt: 0.5,
                    textTransform: "none",
                    fontSize: "0.7rem",
                    color: theme.palette.error.main,
                    px: 0,
                    minWidth: 0,
                  }}
                >
                  {"Удалить файл из поля"}
                </Button>
              )}
            </Box>

            {technologySelected && !hasAlgorithmFile && (
              <Typography
                sx={{
                  gridColumn: "1 / -1",
                  color: theme.palette.warning.main,
                  fontSize: "0.7rem",
                }}
              >
                {"Прикрепите файл."}
              </Typography>
            )}

            {taskFieldsRequired && (
              <Typography
                sx={{
                  gridColumn: "1 / -1",
                  color: theme.palette.warning.main,
                  fontSize: "0.7rem",
                }}
              >
                {"Для выбранного типа решения заполните «Номер» и «Ответственный»."}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

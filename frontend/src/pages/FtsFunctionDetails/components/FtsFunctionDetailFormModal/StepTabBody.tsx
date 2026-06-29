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
import { Controller, useWatch, type Control, type FieldPath } from "react-hook-form";
import { FieldLabel } from "../../../../components/FieldLabel";
import { FileAttachmentInput } from "../../../../components/FileAttachmentInput";
import type { OptionType } from "../../../../utils/create-options";
import type { FtsFunctionDetailData } from "./schema";

type StepTabBodyOptions = {
  ftsFunctionCategoryOptions: OptionType[];
  whoPerformsActionOptions: OptionType[];
  ftsFunctionComplexityOptions: OptionType[];
  ftsFunctionExecutionFrequencyOptions: OptionType[];
  ftsFunctionActionTypeOptions: OptionType[]; /////////////
  ftsFunctionEffectivenessOptions: OptionType[]; //////////
  technologicalSolutionOptions: OptionType[];
  responsibleOptions: OptionType[];
};

type StepTabBodyProps = {
  control: Control<FtsFunctionDetailData>;
  options: StepTabBodyOptions;
  /** Категория = «Фактическое действие» → показываем блок тех. решения. */
  showTechnology: boolean;
  /** Тип-«задание» → «Номер»/«Ответственный» обязательны и доступны. */
  taskFieldsRequired: boolean;
  theme: Theme;
  /** Новый выбранный файл алгоритма (поднят в родитель — грузится при сабмите). */
  algorithmFile: File | null;
  onChangeAlgorithmFile: (file: File | null) => void;
  /** Имя уже сохранённого файла (режим редактирования) — для показа/скачивания. */
  existingAlgorithmFileName?: string | null;
  onDownloadAlgorithmFile?: () => void;
  /** Пометить существующий файл к удалению (замена / очистка / ввод текста). */
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

  // ============ Рендер-хелперы (Controller на FtsFunctionDetailData) ============
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
    cfg?: { multiline?: boolean; disabled?: boolean },
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

            <Controller
              control={control}
              name="algorithm"
              render={({ field }) => {
                const text = String(field.value ?? "");
                const hasText = Boolean(text.trim());
                const hasFile = Boolean(algorithmFile) || Boolean(existingAlgorithmFileName);

                const handleTextChange = (value: string) => {
                  field.onChange(value);
                  if (value.trim()) {
                    onChangeAlgorithmFile(null);
                    onRemoveExistingAlgorithmFile?.();
                  }
                };

                const handleFileChange = (file: File | null) => {
                  onChangeAlgorithmFile(file);
                  if (file) field.onChange("");
                };

                return (
                  <>
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <TextField
                        value={text}
                        label="Алгоритм — текст"
                        onChange={(event) => handleTextChange(event.target.value)}
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        disabled={!technologySelected || hasFile}
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

                      {hasFile && (
                        <Typography sx={{ color: c.textMuted, fontSize: "0.68rem", mt: 0.5 }}>
                          {"Текст недоступен, потому что выбран файл. Чтобы ввести текст, удалите файл."}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <Typography
                        variant="caption"
                        sx={{ display: "block", color: c.textMuted, fontSize: "0.66rem", mb: 0.5 }}
                      >
                        {"Алгоритм — файл"}
                      </Typography>

                      <FileAttachmentInput
                        selectedFile={algorithmFile}
                        fileName={existingAlgorithmFileName ?? undefined}
                        disabled={!technologySelected || hasText}
                        onChangeFile={handleFileChange}
                        onDownloadFile={onDownloadAlgorithmFile}
                      />

                      {hasText && (
                        <Typography sx={{ color: c.textMuted, fontSize: "0.68rem", mt: 0.5 }}>
                          {"Файл недоступен, потому что заполнен текст. Чтобы прикрепить файл, очистите текстовое поле."}
                        </Typography>
                      )}

                      {hasFile && !hasText && (
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

                    {technologySelected && !hasText && !hasFile && (
                      <Typography
                        sx={{
                          gridColumn: "1 / -1",
                          color: theme.palette.warning.main,
                          fontSize: "0.7rem",
                        }}
                      >
                        {"Введите текст или прикрепите файл."}
                      </Typography>
                    )}
                  </>
                );
              }}
            />

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

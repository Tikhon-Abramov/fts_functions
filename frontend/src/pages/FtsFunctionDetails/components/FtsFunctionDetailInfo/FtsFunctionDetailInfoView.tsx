import { useState } from "react";
import { Edit } from "@mui/icons-material";
import { Box, Button, Chip, Divider, Typography, useTheme } from "@mui/material";
import type { FtsFunctionDetailBaseResponseDto } from "../../../../store/ftsFunctionRegistry";
import { FieldLabel } from "../../../../components/FieldLabel";
import { FileAttachmentInput } from "../../../../components/FileAttachmentInput";
import { useFileUtils } from "../../../../common/hooks/useFileLinkUtils";

type DetailData = FtsFunctionDetailBaseResponseDto["data"];

type FtsFunctionDetailInfoViewProps = {
  detail: DetailData;
  onStartEdit: () => void;
};

const ACTUAL_ACTION_CODE = "ACTUAL_ACTION";
const OBJECT_SELECTION_CODE = "OBJECT_SELECTION";

function countFilled(detail: DetailData): number {
  const values = [
    detail.ftsFunctionExecutionFrequency?.name,
    detail.ftsFunctionComplexity?.name,
    detail.artifact,
    detail.basis,
    detail.artifactUsage,
    detail.actionsСompleteness,
    detail.actionsEffectiveness,
    detail.technologicalSolution?.name,
    detail.number,
    detail.responsible?.name,
    detail.algorithm,
  ];

  return values.filter((value) => value != null && String(value).trim() !== "").length;
}

export function FtsFunctionDetailInfoView({ detail, onStartEdit }: FtsFunctionDetailInfoViewProps) {
  const theme = useTheme();
  const c = theme.custom;

  const isStep1 = detail.ftsFunctionStep.code === OBJECT_SELECTION_CODE;
  const stepLabel = isStep1 ? "Шаг 1" : "Шаг 2";
  const stepColor = isStep1 ? theme.palette.primary.main : theme.palette.success.main;

  const filledCount = countFilled(detail);
  const showTechnology = detail.ftsFunctionCategory.code === ACTUAL_ACTION_CODE;

  // Файл алгоритма (один) — скачивание через тот же хук, что и в форме.
  const { downloadFile } = useFileUtils();
  const [isDownloading, setIsDownloading] = useState(false);
  const algorithmFile = detail.algorithmFiles[0] ?? null;

  const handleDownloadAlgorithmFile = () => {
    if (!algorithmFile) return;

    setIsDownloading(true);
    void downloadFile({
      objectKey: algorithmFile.objectKey,
      fileName: algorithmFile.originalName ?? undefined,
    })
      .catch((error) => console.error("Не удалось скачать файл алгоритма:", error))
      .finally(() => setIsDownloading(false));
  };

  return (
    <Box
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
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

          <Typography sx={{ color: c.textMuted, fontSize: "0.68rem", mt: 0.5 }}>
            {`Заполнено дополнительных полей: ${filledCount}`}
          </Typography>
        </Box>

        <Button
          size="small"
          onClick={onStartEdit}
          startIcon={<Edit sx={{ fontSize: 14 }} />}
          sx={{ textTransform: "none", fontSize: "0.7rem", color: c.accentBlue, flexShrink: 0 }}
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
        <ReadField label="Категория" value={detail.ftsFunctionCategory.name} c={c} />
        <ReadField label="Наименование действия" value={detail.ftsFunctionDetails} c={c} />
        <ReadField label="Кто делает" value={detail.whoPerformsAction?.name} c={c} />

        <Divider sx={{ borderColor: c.borderLight, my: 0.25 }} />
        <FieldLabel fontSize="0.58rem" bold>
          {"Дополнительные сведения"}
        </FieldLabel>

        <ReadField label="Периодичность" value={detail.ftsFunctionExecutionFrequency?.name} c={c} />
        <ReadField label="Сложность" value={detail.ftsFunctionComplexity?.name} c={c} />
        <ReadField label="Артефакт" value={detail.artifact} c={c} />
        <ReadField label="Нормативное основание" value={detail.basis} c={c} />
        <ReadField label="Как используется артефакт" value={detail.artifactUsage} c={c} />
        <ReadField
          label="Полнота действий — метрика полноты отработки объектов"
          value={detail.actionsСompleteness}
          c={c}
        />
        <ReadField label="Эффективность действий КПЭ" value={detail.actionsEffectiveness} c={c} />

        {showTechnology && (
          <>
            <Divider sx={{ borderColor: c.borderLight, my: 0.25 }} />
            <FieldLabel fontSize="0.58rem" bold>
              {"Технологическое решение"}
            </FieldLabel>

            <ReadField
              label="Технологическое решение"
              value={detail.technologicalSolution?.name}
              c={c}
            />
            <ReadField label="Номер" value={detail.number} c={c} />
            <ReadField label="Ответственный" value={detail.responsible?.name} c={c} />
            <ReadField label="Результат отработки — текст" value={detail.algorithm} c={c} />

            <Box>
              <Typography
                variant="caption"
                sx={{ display: "block", color: c.textMuted, fontSize: "0.66rem", mb: 0.25 }}
              >
                {"Результат отработки — файл"}
              </Typography>
              <FileAttachmentInput
                readOnly
                fileName={algorithmFile?.originalName ?? undefined}
                isDownloading={isDownloading}
                onChangeFile={() => {}}
                onDownloadFile={algorithmFile ? handleDownloadAlgorithmFile : undefined}
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

type ReadFieldProps = {
  label: string;
  value: string | null | undefined;
  c: { textMuted: string; textBody: string; textDim: string };
};

function ReadField({ label, value, c }: ReadFieldProps) {
  const hasValue = Boolean(value && String(value).trim());

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ display: "block", color: c.textMuted, fontSize: "0.66rem", mb: 0.25 }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: hasValue ? c.textBody : c.textDim,
          fontSize: "0.8rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {hasValue ? value : "Не заполнено"}
      </Typography>
    </Box>
  );
}

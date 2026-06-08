import type {
  DetailAction,
  DetailActionFeedbackFormInput,
  DetailActionFormInput,
  Row,
} from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { Add, Close, DeleteOutline, Edit, Save } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  useConstantControllerGetTypesV1Query,
  useFtsFunctionControllerUpdateActionV1Mutation,
} from "src/shared/api/ftsFunctionsApi";
import { DICTIONARY_QUERY_OPTIONS } from "src/shared/api/query-options";
import {
  formInputSx,
  formLabelSx,
  formMenuSx,
  formSelectSx,
} from "src/shared/ui/styles/form";

type ActionPanelProps = {
  row: Row | null;
  typesAll: TypeResponseDto[];
  onCreateAction: (
    detailId: string,
    input: DetailActionFormInput & Partial<DetailActionFeedbackFormInput>,
  ) => Promise<DetailAction | null>;
  onDeleteAction: (actionId: string) => Promise<boolean>;
};

const TYPE_CATEGORY = {
  ACTION_STATUS: "ACTION_STATUS",
  FEEDBACK_SOURCE: "FEEDBACK_SOURCE",
  FEEDBACK_QUALITY_METRICS: "FEEDBACK_QUALITY_METRICS",
  FTS_METHODOLOGY_STATUS: "FTS_METHODOLOGY_STATUS",
} as const;

const EMPTY_FORM: DetailActionFormInput = {
  description: "",
  statusId: "",
};

const EMPTY_FEEDBACK_FORM: DetailActionFeedbackFormInput = {
  feedbackSourceIds: [],
  feedbackQualityMetricId: "",
  ftsMethodologyStatusId: "",
  problemDescription: "",
  initiatorRequisites: "",
  deadline: "",
  initiatorAcceptance: "",
};

type ActionUpdateDto = Record<string, unknown>;

function mergeOptionsByCategory(
  baseTypes: TypeResponseDto[],
  loadedTypes: TypeResponseDto[],
  category: string,
): TypeResponseDto[] {
  const map = new Map<number, TypeResponseDto>();

  for (const item of baseTypes) {
    if (item.category === category) {
      map.set(item.id, item);
    }
  }

  for (const item of loadedTypes) {
    if (item.category === category) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}

function getStatusLabel(
  action: DetailAction,
  statusOptions: TypeResponseDto[],
): string {
  if (action.statusName) return action.statusName;

  if (action.statusId) {
    const found = statusOptions.find(
      (status) => String(status.id) === String(action.statusId),
    );

    if (found) return found.name;
  }

  if (action.statusCode) return action.statusCode;

  return "Статус не указан";
}

function isFormValid(form: DetailActionFormInput): boolean {
  return form.description.trim().length > 0 && form.statusId.trim().length > 0;
}

function sortActions(actions: DetailAction[]): DetailAction[] {
  return [...actions].sort((a, b) => Number(b.id) - Number(a.id));
}

function hasActionFeedback(input: DetailActionFeedbackFormInput): boolean {
  return Boolean(
    input.feedbackSourceIds.length ||
      input.feedbackQualityMetricId ||
      input.ftsMethodologyStatusId ||
      input.problemDescription.trim() ||
      input.initiatorRequisites.trim() ||
      input.deadline.trim() ||
      input.initiatorAcceptance.trim(),
  );
}

function normalizeDateForInput(value: string | undefined): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function actionToFeedbackForm(
  action: DetailAction | null,
): DetailActionFeedbackFormInput {
  if (!action) return EMPTY_FEEDBACK_FORM;

  return {
    feedbackSourceIds: action.feedbackSourceIds ?? [],
    feedbackQualityMetricId: action.feedbackQualityMetricId ?? "",
    ftsMethodologyStatusId: action.ftsMethodologyStatusId ?? "",
    problemDescription: action.problemDescription ?? "",
    initiatorRequisites: action.initiatorRequisites ?? "",
    deadline: normalizeDateForInput(action.deadline),
    initiatorAcceptance: action.initiatorAcceptance ?? "",
  };
}

function normalizeActionFromApi(
  raw: unknown,
  fallback?: Partial<DetailAction>,
): DetailAction {
  const action = raw as {
    id?: number | string;
    ftsFunctionDetailId?: number | string;
    statusId?: number | string | null;
    status?: TypeResponseDto | null;
    description?: string | null;
    feedbackSources?: Array<{ feedbackSource?: TypeResponseDto | null }>;
    feedbackQualityMetricsId?: number | string | null;
    feedbackQualityMetrics?: TypeResponseDto | null;
    ftsMethodologyStatusId?: number | string | null;
    ftsMethodologyStatus?: TypeResponseDto | null;
    problemDescription?: string | null;
    initiatorRequisites?: string | null;
    deadline?: string | Date | null;
    initiatorAcceptance?: string | null;
  };

  return {
    id: String(action.id ?? fallback?.id ?? ""),
    ftsFunctionDetailId:
      action.ftsFunctionDetailId === undefined
        ? fallback?.ftsFunctionDetailId
        : String(action.ftsFunctionDetailId),
    statusId:
      action.statusId === undefined || action.statusId === null
        ? fallback?.statusId ?? null
        : String(action.statusId),
    statusCode: action.status?.code ?? fallback?.statusCode ?? "",
    statusName: action.status?.name ?? fallback?.statusName ?? "",
    description: action.description ?? fallback?.description ?? "",
    feedbackSourceIds:
      action.feedbackSources
        ?.map((item) => String(item.feedbackSource?.id ?? ""))
        .filter(Boolean) ??
      fallback?.feedbackSourceIds ??
      [],
    feedbackQualityMetricId:
      action.feedbackQualityMetricsId === undefined ||
      action.feedbackQualityMetricsId === null
        ? fallback?.feedbackQualityMetricId ?? null
        : String(action.feedbackQualityMetricsId),
    feedbackQualityMetricName:
      action.feedbackQualityMetrics?.name ??
      fallback?.feedbackQualityMetricName ??
      "",
    ftsMethodologyStatusId:
      action.ftsMethodologyStatusId === undefined ||
      action.ftsMethodologyStatusId === null
        ? fallback?.ftsMethodologyStatusId ?? null
        : String(action.ftsMethodologyStatusId),
    ftsMethodologyStatusName:
      action.ftsMethodologyStatus?.name ??
      fallback?.ftsMethodologyStatusName ??
      "",
    problemDescription:
      action.problemDescription ?? fallback?.problemDescription ?? "",
    initiatorRequisites:
      action.initiatorRequisites ?? fallback?.initiatorRequisites ?? "",
    deadline:
      action.deadline === undefined || action.deadline === null
        ? fallback?.deadline ?? ""
        : String(action.deadline),
    initiatorAcceptance:
      action.initiatorAcceptance ?? fallback?.initiatorAcceptance ?? "",
  };
}

function toPositiveNumber(value: string): number | null {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function toIsoDeadline(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T00:00:00.000Z`
    : trimmed;
}

function buildActionFeedbackDto(
  feedback: DetailActionFeedbackFormInput,
): ActionUpdateDto {
  return {
    feedbackSourceIds: feedback.feedbackSourceIds
      .map(toPositiveNumber)
      .filter((id): id is number => id !== null),
    feedbackQualityMetricsId: toPositiveNumber(
      feedback.feedbackQualityMetricId,
    ),
    ftsMethodologyStatusId: toPositiveNumber(
      feedback.ftsMethodologyStatusId,
    ),
    problemDescription: toNullableText(feedback.problemDescription),
    initiatorRequisites: toNullableText(feedback.initiatorRequisites),
    deadline: toIsoDeadline(feedback.deadline),
    initiatorAcceptance: toNullableText(feedback.initiatorAcceptance),
  };
}

export function ActionPanel({
  row,
  typesAll,
  onCreateAction,
  onDeleteAction,
}: ActionPanelProps) {
  const theme = useTheme();
  const c = theme.custom;

  const { data: actionStatusTypes = [] } = useConstantControllerGetTypesV1Query(
    { categories: [TYPE_CATEGORY.ACTION_STATUS] },
    DICTIONARY_QUERY_OPTIONS,
  );

  const { data: feedbackSourceTypes = [] } =
    useConstantControllerGetTypesV1Query(
      { categories: [TYPE_CATEGORY.FEEDBACK_SOURCE] },
      DICTIONARY_QUERY_OPTIONS,
    );

  const { data: feedbackQualityMetricTypes = [] } =
    useConstantControllerGetTypesV1Query(
      { categories: [TYPE_CATEGORY.FEEDBACK_QUALITY_METRICS] },
      DICTIONARY_QUERY_OPTIONS,
    );

  const { data: methodologyStatusTypes = [] } =
    useConstantControllerGetTypesV1Query(
      { categories: [TYPE_CATEGORY.FTS_METHODOLOGY_STATUS] },
      DICTIONARY_QUERY_OPTIONS,
    );

  const [updateActionMutation] =
    useFtsFunctionControllerUpdateActionV1Mutation();

  const statusOptions = useMemo(
    () =>
      mergeOptionsByCategory(
        typesAll,
        actionStatusTypes,
        TYPE_CATEGORY.ACTION_STATUS,
      ),
    [typesAll, actionStatusTypes],
  );

  const feedbackSourceOptions = useMemo(
    () =>
      mergeOptionsByCategory(
        typesAll,
        feedbackSourceTypes,
        TYPE_CATEGORY.FEEDBACK_SOURCE,
      ),
    [typesAll, feedbackSourceTypes],
  );

  const feedbackQualityMetricOptions = useMemo(
    () =>
      mergeOptionsByCategory(
        typesAll,
        feedbackQualityMetricTypes,
        TYPE_CATEGORY.FEEDBACK_QUALITY_METRICS,
      ),
    [typesAll, feedbackQualityMetricTypes],
  );

  const methodologyStatusOptions = useMemo(
    () =>
      mergeOptionsByCategory(
        typesAll,
        methodologyStatusTypes,
        TYPE_CATEGORY.FTS_METHODOLOGY_STATUS,
      ),
    [typesAll, methodologyStatusTypes],
  );

  const [actions, setActions] = useState<DetailAction[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<DetailAction | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DetailAction | null>(null);
  const [form, setForm] = useState<DetailActionFormInput>(EMPTY_FORM);
  const [feedbackForm, setFeedbackForm] =
    useState<DetailActionFeedbackFormInput>(EMPTY_FEEDBACK_FORM);
  const [saving, setSaving] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setActions(row?.actions ?? []);
    setDialogOpen(false);
    setSelectedAction(null);
    setDeleteTarget(null);
    setForm(EMPTY_FORM);
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
    setSaving(false);
    setSavingFeedback(false);
    setDeleting(false);
  }, [row?.id, row?.actions]);

  const sortedActions = useMemo(() => sortActions(actions), [actions]);

  const isViewMode = selectedAction !== null;
  const canSave = isFormValid(form) && !saving;
  const canSaveFeedback =
    selectedAction !== null && !savingFeedback && selectedAction.id.length > 0;

  const handleOpenCreate = () => {
    setSelectedAction(null);
    setForm(EMPTY_FORM);
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
    setDialogOpen(true);
  };

  const handleOpenView = (action: DetailAction) => {
    setSelectedAction(action);
    setForm({
      description: action.description,
      statusId: action.statusId ?? "",
    });
    setFeedbackForm(actionToFeedbackForm(action));
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving || savingFeedback) return;

    setDialogOpen(false);
    setSelectedAction(null);
    setForm(EMPTY_FORM);
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
  };

  const handleCreate = async () => {
    if (!row || !canSave) return;

    setSaving(true);

    const created = await onCreateAction(row.id, {
      description: form.description.trim(),
      statusId: form.statusId,
      ...feedbackForm,
    });

    setSaving(false);

    if (!created) return;

    const selectedStatus = statusOptions.find(
      (status) => String(status.id) === String(form.statusId),
    );

    const normalizedCreated: DetailAction = {
      ...created,
      statusId: created.statusId ?? form.statusId,
      statusCode: created.statusCode ?? selectedStatus?.code ?? "",
      statusName: created.statusName ?? selectedStatus?.name ?? "",
    };

    setActions((prev) => [normalizedCreated, ...prev]);
    setDialogOpen(false);
    setSelectedAction(null);
    setForm(EMPTY_FORM);
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
  };

  const handleSaveFeedback = async () => {
    if (!selectedAction?.id || !canSaveFeedback) return;

    setSavingFeedback(true);

    try {
      const updated = await updateActionMutation({
        actionId: Number(selectedAction.id),
        updateActionDto: buildActionFeedbackDto(feedbackForm) as never,
      }).unwrap();

      const normalized = normalizeActionFromApi(updated, {
        ...selectedAction,
        ...feedbackForm,
      });

      setSelectedAction(normalized);
      setActions((prev) =>
        prev.map((action) =>
          action.id === selectedAction.id ? normalized : action,
        ),
      );
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!selectedAction?.id || savingFeedback) return;

    setSavingFeedback(true);

    try {
      const cleared = EMPTY_FEEDBACK_FORM;

      const updated = await updateActionMutation({
        actionId: Number(selectedAction.id),
        updateActionDto: buildActionFeedbackDto(cleared) as never,
      }).unwrap();

      const normalized = normalizeActionFromApi(updated, {
        ...selectedAction,
        ...cleared,
      });

      setFeedbackForm(cleared);
      setSelectedAction(normalized);
      setActions((prev) =>
        prev.map((action) =>
          action.id === selectedAction.id ? normalized : action,
        ),
      );
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;

    setDeleting(true);

    const deleted = await onDeleteAction(deleteTarget.id);

    setDeleting(false);

    if (!deleted) return;

    setActions((prev) =>
      prev.filter((action) => action.id !== deleteTarget.id),
    );
    setDeleteTarget(null);
  };

  if (!row) {
    return (
      <Box
        sx={{
          height: "100%",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          textAlign: "center",
          bgcolor: c.bgSurface,
        }}
      >
        <Typography
          sx={{
            color: c.textMuted,
            fontSize: "0.8rem",
            lineHeight: 1.4,
          }}
        >
          {"Выберите строку детализации, чтобы посмотреть операции."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        bgcolor: c.bgSurface,
        display: "flex",
        flexDirection: "column",
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
        <Box sx={{ minWidth: 0 }}>
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
            {"Операции"}
          </Typography>

          <Typography
            sx={{
              color: c.textMuted,
              fontSize: "0.68rem",
              mt: 0.35,
            }}
          >
            {`Операций: ${actions.length}`}
          </Typography>
        </Box>

        <Button
          size="small"
          onClick={handleOpenCreate}
          startIcon={<Add sx={{ fontSize: 15 }} />}
          sx={{
            textTransform: "none",
            fontSize: "0.72rem",
            color: c.accentBlue,
            flexShrink: 0,
          }}
          data-testid="button-add-action"
        >
          {"Добавить"}
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          px: 2,
          py: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {sortedActions.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              bgcolor: c.bgInput,
              borderColor: c.borderLight,
              color: c.textMuted,
              fontSize: "0.78rem",
              textAlign: "center",
            }}
          >
            {"Операции пока не добавлены."}
          </Paper>
        ) : (
          sortedActions.map((action, index) => (
            <ActionCard
              key={action.id || `${action.description}-${index}`}
              action={action}
              index={index + 1}
              statusLabel={getStatusLabel(action, statusOptions)}
              onClick={() => handleOpenView(action)}
              onDelete={() => setDeleteTarget(action)}
            />
          ))
        )}
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: c.bgSurface,
            color: c.textBody,
            border: `1px solid ${c.borderMain}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${c.borderLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            fontSize: "0.95rem",
            fontWeight: 700,
          }}
        >
          {isViewMode ? "Операция" : "Новая операция"}

          <IconButton
            onClick={handleCloseDialog}
            size="small"
            disabled={saving || savingFeedback}
            sx={{ color: c.textMuted }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1.35,
          }}
        >
          <TextField
            label="Описание операции *"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            disabled={isViewMode || saving}
            multiline
            rows={4}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{
              ...formInputSx(theme),
              "& .MuiInputLabel-root": {
                color: c.textMuted,
                fontSize: "0.72rem",
                bgcolor: c.bgSurface,
                px: 0.5,
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: theme.palette.primary.main,
              },
            }}
            data-testid="action-description"
          />

          <FormControl size="small" fullWidth disabled={isViewMode || saving}>
            <InputLabel sx={formLabelSx(theme)}>
              {"Статус операции *"}
            </InputLabel>

            <Select
              value={form.statusId}
              label="Статус операции *"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  statusId: String(event.target.value),
                }))
              }
              sx={formSelectSx(theme)}
              MenuProps={formMenuSx(theme)}
              data-testid="action-status"
            >
              {statusOptions.map((status) => (
                <MenuItem
                  key={status.id}
                  value={String(status.id)}
                  sx={{ fontSize: "0.78rem" }}
                >
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ borderColor: c.borderLight, my: 0.5 }} />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                color: c.textPrimary,
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              {"Обратная связь операции"}
            </Typography>

            {isViewMode && hasActionFeedback(feedbackForm) && (
              <Button
                size="small"
                onClick={handleDeleteFeedback}
                disabled={savingFeedback}
                sx={{
                  textTransform: "none",
                  fontSize: "0.7rem",
                  color: theme.palette.error.main,
                }}
              >
                {"Удалить обратную связь"}
              </Button>
            )}
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel sx={formLabelSx(theme)}>
              {"Источник обратной связи"}
            </InputLabel>

            <Select
              multiple
              value={feedbackForm.feedbackSourceIds}
              input={<OutlinedInput label="Источник обратной связи" />}
              onChange={(event) => {
                const value = event.target.value;

                setFeedbackForm((prev) => ({
                  ...prev,
                  feedbackSourceIds:
                    typeof value === "string" ? value.split(",") : value,
                }));
              }}
              sx={formSelectSx(theme)}
              MenuProps={formMenuSx(theme)}
              data-testid="action-feedback-source"
              renderValue={(selected) =>
                selected
                  .map(
                    (id) =>
                      feedbackSourceOptions.find(
                        (option) => String(option.id) === String(id),
                      )?.name ?? id,
                  )
                  .join(", ")
              }
            >
              {feedbackSourceOptions.map((source) => (
                <MenuItem
                  key={source.id}
                  value={String(source.id)}
                  sx={{ fontSize: "0.78rem" }}
                >
                  {source.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel sx={formLabelSx(theme)}>
              {"Метрики качества процесса в рамках обратной связи"}
            </InputLabel>

            <Select
              value={feedbackForm.feedbackQualityMetricId}
              label="Метрики качества процесса в рамках обратной связи"
              onChange={(event) =>
                setFeedbackForm((prev) => ({
                  ...prev,
                  feedbackQualityMetricId: String(event.target.value),
                }))
              }
              sx={formSelectSx(theme)}
              MenuProps={formMenuSx(theme)}
              data-testid="action-feedback-quality-metric"
            >
              <MenuItem
                value=""
                sx={{
                  fontSize: "0.78rem",
                  fontStyle: "italic",
                  color: c.textDim,
                }}
              >
                {"— не выбрано —"}
              </MenuItem>

              {feedbackQualityMetricOptions.map((metric) => (
                <MenuItem
                  key={metric.id}
                  value={String(metric.id)}
                  sx={{ fontSize: "0.78rem" }}
                >
                  {metric.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel sx={formLabelSx(theme)}>
              {"Методология позиции ЦА ФНС России"}
            </InputLabel>

            <Select
              value={feedbackForm.ftsMethodologyStatusId}
              label="Методология позиции ЦА ФНС России"
              onChange={(event) =>
                setFeedbackForm((prev) => ({
                  ...prev,
                  ftsMethodologyStatusId: String(event.target.value),
                }))
              }
              sx={formSelectSx(theme)}
              MenuProps={formMenuSx(theme)}
              data-testid="action-feedback-methodology-status"
            >
              <MenuItem
                value=""
                sx={{
                  fontSize: "0.78rem",
                  fontStyle: "italic",
                  color: c.textDim,
                }}
              >
                {"— не выбрано —"}
              </MenuItem>

              {methodologyStatusOptions.map((status) => (
                <MenuItem
                  key={status.id}
                  value={String(status.id)}
                  sx={{ fontSize: "0.78rem" }}
                >
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Описание проблем с указанием источника, метрики способа решения"
            value={feedbackForm.problemDescription}
            onChange={(event) =>
              setFeedbackForm((prev) => ({
                ...prev,
                problemDescription: event.target.value,
              }))
            }
            fullWidth
            size="small"
            multiline
            rows={3}
            sx={formInputSx(theme)}
            data-testid="action-feedback-problem-description"
          />

          <TextField
            label="Реквизиты автора инициативы"
            value={feedbackForm.initiatorRequisites}
            onChange={(event) =>
              setFeedbackForm((prev) => ({
                ...prev,
                initiatorRequisites: event.target.value,
              }))
            }
            fullWidth
            size="small"
            multiline
            rows={2}
            sx={formInputSx(theme)}
            data-testid="action-feedback-initiator-requisites"
          />

          <TextField
            label="Срок реализации доработки"
            type="date"
            value={feedbackForm.deadline}
            onChange={(event) =>
              setFeedbackForm((prev) => ({
                ...prev,
                deadline: event.target.value,
              }))
            }
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={formInputSx(theme)}
            data-testid="action-feedback-deadline"
          />

          <TextField
            label="Акцепт автора инициативы"
            value={feedbackForm.initiatorAcceptance}
            onChange={(event) =>
              setFeedbackForm((prev) => ({
                ...prev,
                initiatorAcceptance: event.target.value,
              }))
            }
            fullWidth
            size="small"
            multiline
            rows={2}
            sx={formInputSx(theme)}
            data-testid="action-feedback-initiator-acceptance"
          />
        </Box>

        <DialogActions
          sx={{
            px: 2,
            py: 1.25,
            borderTop: `1px solid ${c.borderLight}`,
            gap: 1,
          }}
        >
          <Button
            onClick={handleCloseDialog}
            disabled={saving || savingFeedback}
            sx={{
              textTransform: "none",
              fontSize: "0.78rem",
              color: c.textSecondary,
            }}
          >
            {isViewMode ? "Закрыть" : "Отмена"}
          </Button>

          {isViewMode ? (
            <Button
              variant="contained"
              onClick={handleSaveFeedback}
              disabled={!canSaveFeedback}
              startIcon={<Save sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                bgcolor: c.saveBtn,
                "&:hover": { bgcolor: c.saveBtnHover },
              }}
              data-testid="button-save-action-feedback"
            >
              {savingFeedback ? "Сохранение..." : "Сохранить обратную связь"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!canSave}
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                bgcolor: c.saveBtn,
                "&:hover": { bgcolor: c.saveBtnHover },
              }}
              data-testid="button-create-action"
            >
              {saving ? "Сохранение..." : "Создать"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: c.bgSurface,
            color: c.textBody,
            border: `1px solid ${c.borderMain}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "0.95rem",
            fontWeight: 700,
            pb: 0.5,
          }}
        >
          {"Удалить операцию?"}
        </DialogTitle>

        <Box sx={{ px: 3, pb: 1 }}>
          <Typography sx={{ color: c.textMuted, fontSize: "0.8rem" }}>
            {"Операция будет удалена из карточки операции."}
          </Typography>
        </Box>

        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            sx={{
              textTransform: "none",
              fontSize: "0.78rem",
              color: c.textSecondary,
            }}
          >
            {"Отмена"}
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              textTransform: "none",
              fontSize: "0.78rem",
            }}
          >
            {deleting ? "Удаление..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

type ActionCardProps = {
  action: DetailAction;
  index: number;
  statusLabel: string;
  onClick: () => void;
  onDelete: () => void;
};

function ActionCard({
  action,
  index,
  statusLabel,
  onClick,
  onDelete,
}: ActionCardProps) {
  const theme = useTheme();
  const c = theme.custom;
  const canDelete = Boolean(action.id);

  const hasFeedback = Boolean(
    action.feedbackSourceIds?.length ||
      action.feedbackQualityMetricId ||
      action.ftsMethodologyStatusId ||
      action.problemDescription ||
      action.initiatorRequisites ||
      action.deadline ||
      action.initiatorAcceptance,
  );

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.1,
        bgcolor: c.bgInput,
        borderColor: c.borderLight,
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: c.borderHover,
          bgcolor: c.hoverOverlay,
        },
      }}
      data-testid={`action-card-${action.id}`}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: c.textPrimary,
              fontSize: "0.8rem",
              fontWeight: 700,
              mb: 0.35,
            }}
          >
            {`Операция ${index}`}
          </Typography>

          <Chip
            label={statusLabel}
            size="small"
            sx={{
              height: 20,
              maxWidth: "100%",
              bgcolor: c.selectedBg,
              color: c.accentBlue,
              fontSize: "0.65rem",
              fontWeight: 600,
              borderRadius: 1,
            }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          {hasFeedback && (
            <Tooltip title="Есть обратная связь">
              <Edit
                sx={{
                  fontSize: 16,
                  color: c.accentBlue,
                  opacity: 0.8,
                }}
              />
            </Tooltip>
          )}

          <Tooltip title="Удалить операцию">
            <span>
              <IconButton
                size="small"
                disabled={!canDelete}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                sx={{
                  p: 0.25,
                  width: 22,
                  height: 22,
                  color: c.textMuted,
                  opacity: canDelete ? 0.75 : 0.3,
                  flexShrink: 0,
                  "&:hover": {
                    color: theme.palette.error.main,
                    bgcolor: "transparent",
                    opacity: 1,
                  },
                }}
                data-testid={`button-delete-action-${action.id}`}
              >
                <DeleteOutline sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Typography
        sx={{
          color: c.textBody,
          fontSize: "0.78rem",
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          mt: 0.75,
        }}
      >
        {action.description}
      </Typography>
    </Paper>
  );
}

export default ActionPanel;

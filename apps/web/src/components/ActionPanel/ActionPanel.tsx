import type {
  DetailAction,
  DetailActionFeedbackFormInput,
  DetailActionFormInput,
  Row,
} from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import {
  Add,
  Close,
  DeleteOutline,
  Edit,
  FeedbackOutlined,
  Save,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogTitle,
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
import { useConstantControllerGetTypesV1Query } from "src/shared/api/ftsFunctionsApi";
import { DICTIONARY_QUERY_OPTIONS } from "src/shared/api/query-options";
import {
  DETAIL_TYPE_CATEGORY,
  FEEDBACK_DETAIL_LABELS,
} from "src/entities/fts-function/lib/detail-technology";
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
    input: DetailActionFormInput,
  ) => Promise<DetailAction | null>;
  onUpdateAction: (
    actionId: string,
    input: Partial<DetailActionFormInput & DetailActionFeedbackFormInput>,
  ) => Promise<DetailAction | null>;
  onDeleteAction: (actionId: string) => Promise<boolean>;
};

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

function mergeOptions(
  category: string,
  baseTypes: TypeResponseDto[],
  loadedTypes: TypeResponseDto[],
): TypeResponseDto[] {
  const map = new Map<number, TypeResponseDto>();

  for (const item of baseTypes) {
    if (item.category === category) map.set(item.id, item);
  }

  for (const item of loadedTypes) {
    if (item.category === category) map.set(item.id, item);
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

function hasActionFeedback(action: DetailAction | null): boolean {
  if (!action) return false;

  return Boolean(
    action.feedbackSourceIds.length ||
      action.feedbackQualityMetricId ||
      action.ftsMethodologyStatusId ||
      action.problemDescription?.trim() ||
      action.initiatorRequisites?.trim() ||
      action.deadline?.trim() ||
      action.initiatorAcceptance?.trim(),
  );
}

function isFeedbackFormFilled(form: DetailActionFeedbackFormInput): boolean {
  return Boolean(
    form.feedbackSourceIds.length &&
      form.feedbackQualityMetricId.trim() &&
      form.ftsMethodologyStatusId.trim() &&
      form.problemDescription.trim() &&
      form.initiatorRequisites.trim() &&
      form.deadline.trim() &&
      form.initiatorAcceptance.trim(),
  );
}

function sortActions(actions: DetailAction[]): DetailAction[] {
  return [...actions].sort((a, b) => Number(b.id) - Number(a.id));
}

function normalizeDateForInput(value: string | undefined): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toActionForm(action: DetailAction): DetailActionFormInput {
  return {
    description: action.description,
    statusId: action.statusId ?? "",
  };
}

function toFeedbackForm(action: DetailAction): DetailActionFeedbackFormInput {
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

function normalizeAction(
  action: DetailAction,
  fallback?: Partial<DetailAction>,
): DetailAction {
  return {
    ...action,
    feedbackSourceIds:
      action.feedbackSourceIds ?? fallback?.feedbackSourceIds ?? [],
    feedbackQualityMetricId:
      action.feedbackQualityMetricId ?? fallback?.feedbackQualityMetricId ?? "",
    ftsMethodologyStatusId:
      action.ftsMethodologyStatusId ?? fallback?.ftsMethodologyStatusId ?? "",
    problemDescription:
      action.problemDescription ?? fallback?.problemDescription ?? "",
    initiatorRequisites:
      action.initiatorRequisites ?? fallback?.initiatorRequisites ?? "",
    deadline: action.deadline ?? fallback?.deadline ?? "",
    initiatorAcceptance:
      action.initiatorAcceptance ?? fallback?.initiatorAcceptance ?? "",
  };
}

export function ActionPanel({
  row,
  typesAll,
  onCreateAction,
  onUpdateAction,
  onDeleteAction,
}: ActionPanelProps) {
  const theme = useTheme();
  const c = theme.custom;

  const { data: dictionaryTypes = [] } = useConstantControllerGetTypesV1Query(
    {
      categories: [
        DETAIL_TYPE_CATEGORY.ACTION_STATUS,
        DETAIL_TYPE_CATEGORY.FEEDBACK_SOURCE,
        DETAIL_TYPE_CATEGORY.FEEDBACK_QUALITY_METRICS,
        DETAIL_TYPE_CATEGORY.FTS_METHODOLOGY_STATUS,
      ],
    },
    DICTIONARY_QUERY_OPTIONS,
  );

  const statusOptions = useMemo(
    () =>
      mergeOptions(
        DETAIL_TYPE_CATEGORY.ACTION_STATUS,
        typesAll,
        dictionaryTypes,
      ),
    [typesAll, dictionaryTypes],
  );

  const feedbackSourceOptions = useMemo(
    () =>
      mergeOptions(
        DETAIL_TYPE_CATEGORY.FEEDBACK_SOURCE,
        typesAll,
        dictionaryTypes,
      ),
    [typesAll, dictionaryTypes],
  );

  const feedbackMetricOptions = useMemo(
    () =>
      mergeOptions(
        DETAIL_TYPE_CATEGORY.FEEDBACK_QUALITY_METRICS,
        typesAll,
        dictionaryTypes,
      ),
    [typesAll, dictionaryTypes],
  );

  const methodologyStatusOptions = useMemo(
    () =>
      mergeOptions(
        DETAIL_TYPE_CATEGORY.FTS_METHODOLOGY_STATUS,
        typesAll,
        dictionaryTypes,
      ),
    [typesAll, dictionaryTypes],
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
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [editingExisting, setEditingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setActions(row?.actions ?? []);
    setDialogOpen(false);
    setSelectedAction(null);
    setDeleteTarget(null);
    setForm(EMPTY_FORM);
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
    setFeedbackVisible(false);
    setEditingExisting(false);
    setSaving(false);
    setDeleting(false);
  }, [row?.id, row?.actions]);

  const sortedActions = useMemo(() => sortActions(actions), [actions]);

  const isCreateMode = selectedAction === null;
  const isEditable = isCreateMode || editingExisting;
  const canSaveAction = isFormValid(form) && !saving;
  const canSaveFeedback = selectedAction && isFeedbackFormFilled(feedbackForm);

  const handleOpenCreate = () => {
    setSelectedAction(null);
    setForm(EMPTY_FORM);
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
    setFeedbackVisible(false);
    setEditingExisting(false);
    setDialogOpen(true);
  };

  const handleOpenView = (action: DetailAction) => {
    setSelectedAction(action);
    setForm(toActionForm(action));
    setFeedbackForm(toFeedbackForm(action));
    setFeedbackVisible(hasActionFeedback(action));
    setEditingExisting(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setSelectedAction(null);
    setForm(EMPTY_FORM);
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
    setFeedbackVisible(false);
    setEditingExisting(false);
  };

  const patchActionInList = (updated: DetailAction) => {
    setActions((prev) =>
      prev.map((action) => (action.id === updated.id ? updated : action)),
    );
    setSelectedAction(updated);
    setForm(toActionForm(updated));
    setFeedbackForm(toFeedbackForm(updated));
  };

  const handleCreate = async () => {
    if (!row || !canSaveAction) return;

    setSaving(true);

    const created = await onCreateAction(row.id, {
      description: form.description.trim(),
      statusId: form.statusId,
    });

    setSaving(false);

    if (!created) return;

    const selectedStatus = statusOptions.find(
      (status) => String(status.id) === String(form.statusId),
    );

    const normalizedCreated: DetailAction = normalizeAction({
      ...created,
      statusId: created.statusId ?? form.statusId,
      statusCode: created.statusCode ?? selectedStatus?.code ?? "",
      statusName: created.statusName ?? selectedStatus?.name ?? "",
    });

    setActions((prev) => [normalizedCreated, ...prev]);
    setSelectedAction(normalizedCreated);
    setForm(toActionForm(normalizedCreated));
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
    setFeedbackVisible(false);
    setEditingExisting(false);
  };

  const handleUpdateAction = async () => {
    if (!selectedAction || !canSaveAction) return;

    setSaving(true);

    const updated = await onUpdateAction(selectedAction.id, {
      description: form.description.trim(),
      statusId: form.statusId,
    });

    setSaving(false);

    if (!updated) return;

    patchActionInList(normalizeAction(updated, selectedAction));
    setEditingExisting(false);
  };

  const handleSaveFeedback = async () => {
    if (!selectedAction || !canSaveFeedback) return;

    setSaving(true);

    const updated = await onUpdateAction(selectedAction.id, {
      feedbackSourceIds: feedbackForm.feedbackSourceIds,
      feedbackQualityMetricId: feedbackForm.feedbackQualityMetricId,
      ftsMethodologyStatusId: feedbackForm.ftsMethodologyStatusId,
      problemDescription: feedbackForm.problemDescription.trim(),
      initiatorRequisites: feedbackForm.initiatorRequisites.trim(),
      deadline: feedbackForm.deadline,
      initiatorAcceptance: feedbackForm.initiatorAcceptance.trim(),
    });

    setSaving(false);

    if (!updated) return;

    patchActionInList(normalizeAction(updated, feedbackForm));
    setFeedbackVisible(true);
  };

  const handleDeleteFeedback = async () => {
    if (!selectedAction) return;

    setSaving(true);

    const updated = await onUpdateAction(selectedAction.id, {
      feedbackSourceIds: [],
      feedbackQualityMetricId: "",
      ftsMethodologyStatusId: "",
      problemDescription: "",
      initiatorRequisites: "",
      deadline: "",
      initiatorAcceptance: "",
    });

    setSaving(false);

    if (!updated) return;

    const normalized: DetailAction = {
      ...updated,
      feedbackSourceIds: [],
      feedbackQualityMetricId: "",
      feedbackQualityMetricName: "",
      ftsMethodologyStatusId: "",
      ftsMethodologyStatusName: "",
      problemDescription: "",
      initiatorRequisites: "",
      deadline: "",
      initiatorAcceptance: "",
    };

    patchActionInList(normalized);
    setFeedbackForm(EMPTY_FEEDBACK_FORM);
    setFeedbackVisible(false);
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

  const renderSelectedFeedbackSources = (selected: string[]) => (
    <Box
      component="span"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.25,
        py: 0.25,
        minWidth: 0,
      }}
    >
      {selected.map((id) => {
        const label =
          feedbackSourceOptions.find(
            (option) => String(option.id) === String(id),
          )?.name ?? id;

        return (
          <Typography
            key={id}
            component="span"
            sx={{
              display: "block",
              color: c.textBody,
              fontSize: "0.76rem",
              lineHeight: 1.25,
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {label}
          </Typography>
        );
      })}
    </Box>
  );

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
        <Typography
          sx={{
            color: c.textMuted,
            fontSize: "0.72rem",
            fontWeight: 600,
          }}
        >
          {`Операций: ${actions.length}`}
        </Typography>

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
          {isCreateMode ? "Новая операция" : "Операция"}

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {!isCreateMode && !editingExisting && (
              <Tooltip title="Редактировать операцию">
                <IconButton
                  size="small"
                  onClick={() => setEditingExisting(true)}
                  sx={{ color: c.textMuted }}
                  data-testid="button-edit-action"
                >
                  <Edit sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}

            <IconButton
              onClick={handleCloseDialog}
              size="small"
              disabled={saving}
              sx={{ color: c.textMuted }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
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
            disabled={!isEditable || saving}
            multiline
            rows={4}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{
              ...formInputSx(theme),
              mt: 0.75,
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

          <FormControl size="small" fullWidth disabled={!isEditable || saving}>
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

          {!isCreateMode && feedbackVisible && (
            <Box
              sx={{
                mt: 0.75,
                pt: 1.25,
                borderTop: `1px solid ${c.borderLight}`,
                display: "flex",
                flexDirection: "column",
                gap: 1.2,
              }}
            >
              <Typography
                sx={{
                  color: c.textPrimary,
                  fontSize: "0.84rem",
                  fontWeight: 700,
                }}
              >
                {"Обратная связь операции"}
              </Typography>

              <FormControl size="small" fullWidth>
                <InputLabel sx={formLabelSx(theme)}>
                  {FEEDBACK_DETAIL_LABELS.feedbackSource}
                </InputLabel>

                <Select
                  multiple
                  value={feedbackForm.feedbackSourceIds}
                  input={
                    <OutlinedInput label={FEEDBACK_DETAIL_LABELS.feedbackSource} />
                  }
                  onChange={(event) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      feedbackSourceIds:
                        typeof event.target.value === "string"
                          ? event.target.value.split(",")
                          : event.target.value.map(String),
                    }))
                  }
                  renderValue={(selected) =>
                    renderSelectedFeedbackSources(selected)
                  }
                  sx={{
                    ...formSelectSx(theme),
                    "& .MuiSelect-select": {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      py: 1,
                      minHeight: "32px",
                      whiteSpace: "normal",
                    },
                  }}
                  MenuProps={formMenuSx(theme)}
                  data-testid="action-feedback-sources"
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
                  {FEEDBACK_DETAIL_LABELS.feedbackQualityMetric}
                </InputLabel>

                <Select
                  value={feedbackForm.feedbackQualityMetricId}
                  label={FEEDBACK_DETAIL_LABELS.feedbackQualityMetric}
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
                  {feedbackMetricOptions.map((metric) => (
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
                  {FEEDBACK_DETAIL_LABELS.methodologyStatus}
                </InputLabel>

                <Select
                  value={feedbackForm.ftsMethodologyStatusId}
                  label={FEEDBACK_DETAIL_LABELS.methodologyStatus}
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
                label={FEEDBACK_DETAIL_LABELS.problemDescription}
                value={feedbackForm.problemDescription}
                onChange={(event) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    problemDescription: event.target.value,
                  }))
                }
                multiline
                rows={3}
                fullWidth
                size="small"
                sx={formInputSx(theme)}
                data-testid="action-feedback-problem"
              />

              <TextField
                label={FEEDBACK_DETAIL_LABELS.initiatorRequisites}
                value={feedbackForm.initiatorRequisites}
                onChange={(event) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    initiatorRequisites: event.target.value,
                  }))
                }
                multiline
                rows={2}
                fullWidth
                size="small"
                sx={formInputSx(theme)}
                data-testid="action-feedback-initiator"
              />

              <TextField
                label={FEEDBACK_DETAIL_LABELS.deadline}
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
                label={FEEDBACK_DETAIL_LABELS.initiatorAcceptance}
                value={feedbackForm.initiatorAcceptance}
                onChange={(event) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    initiatorAcceptance: event.target.value,
                  }))
                }
                multiline
                rows={2}
                fullWidth
                size="small"
                sx={formInputSx(theme)}
                data-testid="action-feedback-acceptance"
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Button
                  size="small"
                  onClick={handleDeleteFeedback}
                  disabled={saving}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.72rem",
                    color: theme.palette.error.main,
                  }}
                >
                  {"Удалить обратную связь"}
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSaveFeedback}
                  disabled={!canSaveFeedback || saving}
                  startIcon={<Save sx={{ fontSize: 15 }} />}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.74rem",
                    bgcolor: c.saveBtn,
                    "&:hover": { bgcolor: c.saveBtnHover },
                    "&.Mui-disabled": {
                      bgcolor: c.borderMain,
                      color: c.textDim,
                    },
                  }}
                >
                  {"Сохранить обратную связь"}
                </Button>
              </Box>
            </Box>
          )}

          {!isCreateMode && !feedbackVisible && (
            <Button
              startIcon={<FeedbackOutlined sx={{ fontSize: 16 }} />}
              onClick={() => setFeedbackVisible(true)}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontSize: "0.76rem",
                color: c.accentBlue,
              }}
            >
              {"Обратная связь"}
            </Button>
          )}
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
            disabled={saving}
            sx={{
              textTransform: "none",
              fontSize: "0.78rem",
              color: c.textSecondary,
            }}
          >
            {isCreateMode ? "Отмена" : "Закрыть"}
          </Button>

          {isCreateMode && (
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!canSaveAction}
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

          {!isCreateMode && editingExisting && (
            <Button
              variant="contained"
              onClick={handleUpdateAction}
              disabled={!canSaveAction}
              startIcon={<Save sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                bgcolor: c.saveBtn,
                "&:hover": { bgcolor: c.saveBtnHover },
              }}
              data-testid="button-update-action"
            >
              {saving ? "Сохранение..." : "Сохранить"}
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
            {"Операция будет удалена из списка операций."}
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
  const hasFeedback = hasActionFeedback(action);

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
              <FeedbackOutlined
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

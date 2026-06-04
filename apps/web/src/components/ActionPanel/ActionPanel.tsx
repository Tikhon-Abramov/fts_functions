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
    problemDescription: "",
    initiatorRequisites: "",
    deadline: "",
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
        action.problemDescription?.trim() ||
        action.initiatorRequisites?.trim() ||
        action.deadline?.trim(),
    );
}

function isFeedbackFormFilled(form: DetailActionFeedbackFormInput): boolean {
    return Boolean(
        form.feedbackSourceIds.length &&
        form.feedbackQualityMetricId.trim() &&
        form.problemDescription.trim() &&
        form.initiatorRequisites.trim() &&
        form.deadline.trim(),
    );
}

function sortActions(actions: DetailAction[]): DetailAction[] {
    return [...actions].sort((a, b) => Number(b.id) - Number(a.id));
}

function toActionForm(action: DetailAction): DetailActionFormInput {
    return {
        description: action.description,
        statusId: action.statusId ?? "",
    };
}

function toFeedbackForm(action: DetailAction): DetailActionFeedbackFormInput {
    return {
        feedbackSourceIds: action.feedbackSourceIds,
        feedbackQualityMetricId: action.feedbackQualityMetricId ?? "",
        problemDescription: action.problemDescription ?? "",
        initiatorRequisites: action.initiatorRequisites ?? "",
        deadline: action.deadline ?? "",
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

    const { data: actionStatusTypes = [] } =
        useConstantControllerGetTypesV1Query(
            {
                categories: [
                    DETAIL_TYPE_CATEGORY.ACTION_STATUS,
                    DETAIL_TYPE_CATEGORY.FEEDBACK_SOURCE,
                    DETAIL_TYPE_CATEGORY.FEEDBACK_QUALITY_METRICS,
                ],
            },
            DICTIONARY_QUERY_OPTIONS,
        );

    const statusOptions = useMemo(
        () =>
            mergeOptions(
                DETAIL_TYPE_CATEGORY.ACTION_STATUS,
                typesAll,
                actionStatusTypes,
            ),
        [typesAll, actionStatusTypes],
    );

    const feedbackSourceOptions = useMemo(
        () =>
            mergeOptions(
                DETAIL_TYPE_CATEGORY.FEEDBACK_SOURCE,
                typesAll,
                actionStatusTypes,
            ),
        [typesAll, actionStatusTypes],
    );

    const feedbackMetricOptions = useMemo(
        () =>
            mergeOptions(
                DETAIL_TYPE_CATEGORY.FEEDBACK_QUALITY_METRICS,
                typesAll,
                actionStatusTypes,
            ),
        [typesAll, actionStatusTypes],
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

        const normalizedCreated: DetailAction = {
            ...created,
            feedbackSourceIds: created.feedbackSourceIds ?? [],
            statusId: created.statusId ?? form.statusId,
            statusCode: created.statusCode ?? selectedStatus?.code ?? "",
            statusName: created.statusName ?? selectedStatus?.name ?? "",
        };

        setActions((prev) => [normalizedCreated, ...prev]);
        setSelectedAction(normalizedCreated);
        setForm(toActionForm(normalizedCreated));
        setFeedbackForm(toFeedbackForm(normalizedCreated));
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

        patchActionInList({
            ...updated,
            feedbackSourceIds: updated.feedbackSourceIds ?? [],
        });
        setEditingExisting(false);
    };

    const handleSaveFeedback = async () => {
        if (!selectedAction || !canSaveFeedback) return;

        setSaving(true);

        const updated = await onUpdateAction(selectedAction.id, {
            feedbackSourceIds: feedbackForm.feedbackSourceIds,
            feedbackQualityMetricId: feedbackForm.feedbackQualityMetricId,
            problemDescription: feedbackForm.problemDescription.trim(),
            initiatorRequisites: feedbackForm.initiatorRequisites.trim(),
            deadline: feedbackForm.deadline,
        });

        setSaving(false);

        if (!updated) return;

        patchActionInList({
            ...updated,
            feedbackSourceIds: updated.feedbackSourceIds ?? [],
        });
        setFeedbackVisible(true);
    };

    const handleDeleteFeedback = async () => {
        if (!selectedAction) return;

        setSaving(true);

        const updated = await onUpdateAction(selectedAction.id, {
            feedbackSourceIds: [],
            feedbackQualityMetricId: "",
            problemDescription: "",
            initiatorRequisites: "",
            deadline: "",
        });

        setSaving(false);

        if (!updated) return;

        const normalized: DetailAction = {
            ...updated,
            feedbackSourceIds: [],
            feedbackQualityMetricId: "",
            feedbackQualityMetricName: "",
            problemDescription: "",
            initiatorRequisites: "",
            deadline: "",
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

    if (!row) {
        return (
            <Box
                sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    color: c.textMuted,
                    textAlign: "center",
                    fontSize: "0.8rem",
                }}
            >
                {"Выберите строку детализации, чтобы посмотреть операции."}
            </Box>
        );
    }

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
                    flexShrink: 0,
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: c.textSecondary,
                            fontWeight: 700,
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
                            mt: 0.5,
                        }}
                    >
                        {`Действий: ${actions.length}`}
                    </Typography>
                </Box>

                <Button
                    size="small"
                    startIcon={<Add sx={{ fontSize: 15 }} />}
                    onClick={handleOpenCreate}
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
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                }}
            >
                {sortedActions.length === 0 ? (
                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 160,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: c.textMuted,
                            textAlign: "center",
                            fontSize: "0.78rem",
                            border: `1px dashed ${c.borderMain}`,
                            borderRadius: 1.5,
                            px: 2,
                        }}
                    >
                        {"Действия пока не добавлены."}
                    </Box>
                ) : (
                    sortedActions.map((action, index) => (
                        <ActionCard
                            key={action.id || `${action.description}-${index}`}
                            action={action}
                            index={sortedActions.length - index}
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
                        overflow: "visible",
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
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            color: c.textBody,
                        }}
                    >
                        {isCreateMode ? "Новое действие" : "Действие"}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {!isCreateMode && !editingExisting && (
                            <Tooltip title="Редактировать действие">
                                <IconButton
                                    size="small"
                                    onClick={() => setEditingExisting(true)}
                                    sx={{ color: c.textMuted }}
                                >
                                    <Edit sx={{ fontSize: 17 }} />
                                </IconButton>
                            </Tooltip>
                        )}

                        <IconButton
                            size="small"
                            onClick={handleCloseDialog}
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
                        py: 2,
                        pt: 2.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <TextField
                        label="Описание действия *"
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
                            {"Статус действия *"}
                        </InputLabel>

                        <Select
                            value={form.statusId}
                            label="Статус действия *"
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
                                border: `1px solid ${c.borderLight}`,
                                borderRadius: 1.5,
                                p: 1.5,
                                display: "flex",
                                flexDirection: "column",
                                gap: 1.5,
                            }}
                        >
                            <Typography
                                sx={{
                                    color: c.textBody,
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                }}
                            >
                                {"Обратная связь по действию"}
                            </Typography>

                            <FormControl size="small" fullWidth disabled={saving}>
                                <InputLabel sx={formLabelSx(theme)}>
                                    {FEEDBACK_DETAIL_LABELS.feedbackSource}
                                </InputLabel>

                                <Select
                                    multiple
                                    value={feedbackForm.feedbackSourceIds}
                                    input={
                                        <OutlinedInput
                                            label={FEEDBACK_DETAIL_LABELS.feedbackSource}
                                        />
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
                                    sx={formSelectSx(theme)}
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

                            <FormControl size="small" fullWidth disabled={saving}>
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

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 1,
                                }}
                            >
                                <Button
                                    color="error"
                                    onClick={handleDeleteFeedback}
                                    disabled={saving || !hasActionFeedback(selectedAction)}
                                    sx={{
                                        textTransform: "none",
                                        fontSize: "0.74rem",
                                    }}
                                >
                                    {"Удалить обратную связь"}
                                </Button>

                                <Button
                                    variant="contained"
                                    onClick={handleSaveFeedback}
                                    disabled={saving || !canSaveFeedback}
                                    startIcon={<Save sx={{ fontSize: 14 }} />}
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
                </Box>

                <DialogActions
                    sx={{
                        px: 2,
                        py: 1.25,
                        borderTop: `1px solid ${c.borderLight}`,
                        justifyContent: "space-between",
                    }}
                >
                    <Box>
                        {!isCreateMode && !feedbackVisible && (
                            <Button
                                startIcon={<FeedbackOutlined sx={{ fontSize: 15 }} />}
                                onClick={() => setFeedbackVisible(true)}
                                sx={{
                                    textTransform: "none",
                                    fontSize: "0.76rem",
                                    color: c.accentBlue,
                                }}
                            >
                                {"Обратная связь"}
                            </Button>
                        )}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Button
                            onClick={handleCloseDialog}
                            disabled={saving}
                            sx={{
                                textTransform: "none",
                                fontSize: "0.78rem",
                                color: c.textSecondary,
                            }}
                        >
                            {"Закрыть"}
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
                                    "&.Mui-disabled": {
                                        bgcolor: c.borderMain,
                                        color: c.textDim,
                                    },
                                }}
                                data-testid="button-save-action"
                            >
                                {saving ? "Сохранение..." : "Создать"}
                            </Button>
                        )}

                        {!isCreateMode && editingExisting && (
                            <Button
                                variant="contained"
                                onClick={handleUpdateAction}
                                disabled={!canSaveAction}
                                sx={{
                                    textTransform: "none",
                                    fontSize: "0.78rem",
                                    bgcolor: c.saveBtn,
                                    "&:hover": { bgcolor: c.saveBtnHover },
                                    "&.Mui-disabled": {
                                        bgcolor: c.borderMain,
                                        color: c.textDim,
                                    },
                                }}
                                data-testid="button-update-action"
                            >
                                {saving ? "Сохранение..." : "Сохранить"}
                            </Button>
                        )}
                    </Box>
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
                        borderBottom: `1px solid ${c.borderLight}`,
                    }}
                >
                    {"Удалить действие?"}
                </DialogTitle>

                <Box sx={{ px: 3, py: 2 }}>
                    <Typography sx={{ color: c.textSecondary, fontSize: "0.82rem" }}>
                        {"Действие будет удалено из списка операций."}
                    </Typography>
                </Box>

                <DialogActions
                    sx={{
                        px: 2,
                        py: 1.25,
                        borderTop: `1px solid ${c.borderLight}`,
                    }}
                >
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
                        disabled={deleting || !deleteTarget?.id}
                        sx={{
                            textTransform: "none",
                            fontSize: "0.78rem",
                        }}
                        data-testid="button-confirm-delete-action"
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
                p: 1.25,
                cursor: "pointer",
                bgcolor: c.bgPaper,
                borderColor: c.borderLight,
                transition: "all 0.15s",
                "&:hover": {
                    bgcolor: c.hoverOverlayMed,
                    borderColor: c.borderMain,
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
                    mb: 0.75,
                }}
            >
                <Box
                    sx={{
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        flexWrap: "wrap",
                    }}
                >
                    <Typography
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.68rem",
                            fontWeight: 700,
                        }}
                    >
                        {`Действие ${index}`}
                    </Typography>

                    <Chip
                        label={statusLabel}
                        size="small"
                        sx={{
                            height: 20,
                            borderRadius: 1,
                            fontSize: "0.66rem",
                            fontWeight: 700,
                            color: theme.palette.primary.main,
                            bgcolor: `${theme.palette.primary.main}1f`,
                            maxWidth: 160,
                            "& .MuiChip-label": {
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            },
                        }}
                    />

                    {hasFeedback && (
                        <Chip
                            label="Есть обратная связь"
                            size="small"
                            sx={{
                                height: 20,
                                borderRadius: 1,
                                fontSize: "0.64rem",
                                color: theme.palette.warning.main,
                                bgcolor: `${theme.palette.warning.main}1f`,
                            }}
                        />
                    )}
                </Box>

                <Tooltip
                    title={
                        canDelete
                            ? "Удалить действие"
                            : "Удаление недоступно: с бэка не пришёл id действия"
                    }
                >
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

            <Typography
                sx={{
                    color: c.textBody,
                    fontSize: "0.78rem",
                    lineHeight: 1.35,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                }}
            >
                {action.description}
            </Typography>
        </Paper>
    );
}

export default ActionPanel;
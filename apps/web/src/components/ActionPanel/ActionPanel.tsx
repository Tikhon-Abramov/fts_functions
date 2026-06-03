import type {
    DetailAction,
    DetailActionFormInput,
    Row,
} from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { Add, Close, DeleteOutline } from "@mui/icons-material";
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
    onDeleteAction: (actionId: string) => Promise<boolean>;
};

const ACTION_STATUS_CATEGORY = "ACTION_STATUS";

const EMPTY_FORM: DetailActionFormInput = {
    description: "",
    statusId: "",
};

function mergeActionStatusOptions(
    baseTypes: TypeResponseDto[],
    loadedTypes: TypeResponseDto[],
): TypeResponseDto[] {
    const map = new Map<number, TypeResponseDto>();

    for (const item of baseTypes) {
        if (item.category === ACTION_STATUS_CATEGORY) {
            map.set(item.id, item);
        }
    }

    for (const item of loadedTypes) {
        if (item.category === ACTION_STATUS_CATEGORY) {
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

export function ActionPanel({
                                row,
                                typesAll,
                                onCreateAction,
                                onDeleteAction,
                            }: ActionPanelProps) {
    const theme = useTheme();
    const c = theme.custom;

    const { data: actionStatusTypes = [] } =
        useConstantControllerGetTypesV1Query(
            {
                categories: [ACTION_STATUS_CATEGORY],
            },
            DICTIONARY_QUERY_OPTIONS,
        );

    const statusOptions = useMemo(
        () => mergeActionStatusOptions(typesAll, actionStatusTypes),
        [typesAll, actionStatusTypes],
    );

    const [actions, setActions] = useState<DetailAction[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<DetailAction | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] = useState<DetailAction | null>(null);
    const [form, setForm] = useState<DetailActionFormInput>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setActions(row?.actions ?? []);
        setDialogOpen(false);
        setSelectedAction(null);
        setDeleteTarget(null);
        setForm(EMPTY_FORM);
        setSaving(false);
        setDeleting(false);
    }, [row?.id, row?.actions]);

    const sortedActions = useMemo(() => sortActions(actions), [actions]);

    const isViewMode = selectedAction !== null;
    const canSave = isFormValid(form) && !saving;

    const handleOpenCreate = () => {
        setSelectedAction(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const handleOpenView = (action: DetailAction) => {
        setSelectedAction(action);
        setForm({
            description: action.description,
            statusId: action.statusId ?? "",
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        if (saving) return;

        setDialogOpen(false);
        setSelectedAction(null);
        setForm(EMPTY_FORM);
    };

    const handleCreate = async () => {
        if (!row || !canSave) return;

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
            statusId: created.statusId ?? form.statusId,
            statusCode: created.statusCode ?? selectedStatus?.code ?? "",
            statusName: created.statusName ?? selectedStatus?.name ?? "",
        };

        setActions((prev) => [normalizedCreated, ...prev]);
        setDialogOpen(false);
        setSelectedAction(null);
        setForm(EMPTY_FORM);
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
                {"Выберите строку детализации, чтобы посмотреть действия."}
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
                        {"Действие"}
                    </Typography>

                    <Typography
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.68rem",
                            mt: 0.5,
                        }}
                    >
                        {`Операций: ${actions.length}`}
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
                        {"Операции пока не добавлены."}
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
                        {isViewMode ? "Операция" : "Новая операция"}
                    </Typography>

                    <IconButton
                        size="small"
                        onClick={handleCloseDialog}
                        disabled={saving}
                        sx={{ color: c.textMuted }}
                    >
                        <Close sx={{ fontSize: 18 }} />
                    </IconButton>
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
                        InputLabelProps={{
                            shrink: true,
                        }}
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

                    <FormControl size="small" fullWidth disabled={isViewMode || saving}>
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
                </Box>

                <DialogActions
                    sx={{
                        px: 2,
                        py: 1.25,
                        borderTop: `1px solid ${c.borderLight}`,
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
                        {isViewMode ? "Закрыть" : "Отмена"}
                    </Button>

                    {!isViewMode && (
                        <Button
                            variant="contained"
                            onClick={handleCreate}
                            disabled={!canSave}
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
                    {"Удалить операцию?"}
                </DialogTitle>

                <Box sx={{ px: 3, py: 2 }}>
                    <Typography sx={{ color: c.textSecondary, fontSize: "0.82rem" }}>
                        {"Операция будет удалена из карточки действия."}
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
                    }}
                >
                    <Typography
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.68rem",
                            fontWeight: 700,
                        }}
                    >
                        {`Операция ${index}`}
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
                </Box>

                <Tooltip
                    title={
                        canDelete
                            ? "Удалить операцию"
                            : "Удаление недоступно: с бэка не пришёл id операции"
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
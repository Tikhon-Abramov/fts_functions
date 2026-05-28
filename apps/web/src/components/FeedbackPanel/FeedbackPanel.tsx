import type {
    Feedback,
    FeedbackFormInput,
    Row,
} from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useEffect, useMemo, useState } from "react";
import {
    Add,
    CancelRounded,
    Check,
    CheckCircleRounded,
    Close,
    DeleteOutline,
    ExpandMore,
    RadioButtonUncheckedRounded,
    Replay,
} from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";

import {
    areFeedbackRequiredFieldsFilled,
    DETAIL_TYPE_CATEGORY,
    FEEDBACK_DETAIL_LABELS,
    getFeedbackStatus,
    getTypeCodeOptionsByCategory,
} from "src/entities/fts-function/lib/detail-technology";
import { useConstantControllerGetTypesV1Query } from "src/shared/api/ftsFunctionsApi";
import { DICTIONARY_QUERY_OPTIONS } from "src/shared/api/query-options";
import {
    formInputSx,
    formLabelSx,
    formMenuSx,
    formSelectSx,
} from "src/shared/ui/styles/form";

export type FeedbackPanelProps = {
    row: Row | null;
    typesAll: TypeResponseDto[];
    onCreateFeedback: (
        detailId: string,
        data: FeedbackFormInput,
    ) => Promise<Feedback | null>;
    onUpdateFeedback: (
        feedbackId: string,
        data: FeedbackFormInput,
    ) => Promise<Feedback | null>;
    onSetFeedbackAcceptance: (
        feedbackId: string,
        isAccepted: boolean,
        rejectComment?: string,
    ) => Promise<Feedback | null>;
    onDeleteFeedback: (feedbackId: string) => Promise<boolean>;
};

type FeedbackDialogMode = "create" | "view" | "edit";

const emptyDraft: FeedbackFormInput = {
    feedbackSourceIds: [],
    feedbackQualityMetricId: "",
    ftsMethodologyStatusId: "",
    problemDescription: "",
    initiatorRequisites: "",
    deadline: "",
    initiatorAcceptance: "",
};

function formatDate(value: string | undefined): string {
    if (!value) return "Не указан";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("ru-RU");
}

function toDraft(feedback: Feedback): FeedbackFormInput {
    return {
        feedbackSourceIds: feedback.feedbackSourceIds ?? [],
        feedbackQualityMetricId: feedback.feedbackQualityMetricId ?? "",
        ftsMethodologyStatusId: feedback.ftsMethodologyStatusId ?? "",
        problemDescription: feedback.problemDescription ?? "",
        initiatorRequisites: feedback.initiatorRequisites ?? "",
        deadline: feedback.deadline?.slice(0, 10) ?? "",
        initiatorAcceptance: feedback.initiatorAcceptance ?? "",
    };
}

function getStatusLabel(status: ReturnType<typeof getFeedbackStatus>): string {
    if (status === "accepted") return "согласовано";
    if (status === "rejected") return "не согласовано";

    return "на согласовании";
}

function getApiStatusLabel(status: string | null | undefined): string {
    if (status === "ACCEPTED") return "Согласовано";
    if (status === "REJECTED") return "Не согласовано";

    return "На согласовании";
}

function getHistoryText(
    fromStatus: string | null | undefined,
    toStatus: string,
): string {
    if (!fromStatus || fromStatus === toStatus) {
        return getApiStatusLabel(toStatus);
    }

    return `${getApiStatusLabel(fromStatus)} → ${getApiStatusLabel(toStatus)}`;
}

function findTypeNameById(
    options: TypeResponseDto[],
    id: string | null | undefined,
): string {
    if (!id) return "Не заполнено";

    const option = options.find((item) => String(item.id) === String(id));

    return option?.name ?? "Не заполнено";
}

function getFeedbackSortValue(feedback: Feedback): number {
    const numericId = Number(feedback.id);

    return Number.isFinite(numericId) ? numericId : 0;
}

function sortFeedbacks(feedbacks: Feedback[]): Feedback[] {
    return [...feedbacks].sort(
        (a, b) => getFeedbackSortValue(b) - getFeedbackSortValue(a),
    );
}



export default function FeedbackPanel({
                                          row,
                                          typesAll,
                                          onCreateFeedback,
                                          onUpdateFeedback,
                                          onSetFeedbackAcceptance,
                                          onDeleteFeedback,
                                      }: FeedbackPanelProps) {
    const theme = useTheme();
    const c = theme.custom;

    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<FeedbackDialogMode>("create");
    const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
    const [draft, setDraft] = useState<FeedbackFormInput>(emptyDraft);
    const [saving, setSaving] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Feedback | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data: methodologyStatusFromBackend = [] } =
        useConstantControllerGetTypesV1Query(
            {
                categories: [DETAIL_TYPE_CATEGORY.FTS_METHODOLOGY_STATUS],
            },
            DICTIONARY_QUERY_OPTIONS,
        );

    useEffect(() => {
        setFeedbacks(sortFeedbacks(row?.feedbacks ?? []));
        setDialogOpen(false);
        setRejectOpen(false);
        setDeleteTarget(null);
        setActiveFeedbackId(null);
        setDraft(emptyDraft);
        setSaving(false);
        setAccepting(false);
        setDeleting(false);
        setRejectComment("");
        setDialogMode("create");
    }, [row?.id, row?.feedbacks]);

    const feedbackSourceOptions = useMemo(
        () =>
            getTypeCodeOptionsByCategory(
                typesAll,
                DETAIL_TYPE_CATEGORY.FEEDBACK_SOURCE,
            ),
        [typesAll],
    );

    const qualityMetricOptions = useMemo(
        () =>
            getTypeCodeOptionsByCategory(
                typesAll,
                DETAIL_TYPE_CATEGORY.FEEDBACK_QUALITY_METRICS,
            ),
        [typesAll],
    );

    const fallbackMethodologyStatusOptions = useMemo(
        () =>
            getTypeCodeOptionsByCategory(
                typesAll,
                DETAIL_TYPE_CATEGORY.FTS_METHODOLOGY_STATUS,
            ),
        [typesAll],
    );

    const methodologyStatusOptions =
        methodologyStatusFromBackend.length > 0
            ? methodologyStatusFromBackend
            : fallbackMethodologyStatusOptions;

    const sourceNameById = useMemo(
        () =>
            new Map(
                feedbackSourceOptions.map((option) => [String(option.id), option.name]),
            ),
        [feedbackSourceOptions],
    );

    const activeFeedback =
        activeFeedbackId === null
            ? null
            : (feedbacks.find((item) => item.id === activeFeedbackId) ?? null);

    const canSave = areFeedbackRequiredFieldsFilled(draft);
    const readonly = dialogMode === "view";

    if (!row) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography sx={{ color: c.textMuted, fontSize: "0.82rem" }}>
                    {"Выберите строку блока «Фактическое действие»"}
                </Typography>
            </Box>
        );
    }

    const updateDraft = <K extends keyof FeedbackFormInput>(
        key: K,
        value: FeedbackFormInput[K],
    ): void => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const upsertFeedback = (feedback: Feedback): void => {
        setFeedbacks((prev) => {
            const exists = prev.some((item) => item.id === feedback.id);
            const next = exists
                ? prev.map((item) => (item.id === feedback.id ? feedback : item))
                : [feedback, ...prev];

            return sortFeedbacks(next);
        });
    };

    const handleOpenCreate = (): void => {
        setDraft(emptyDraft);
        setActiveFeedbackId(null);
        setDialogMode("create");
        setRejectComment("");
        setDialogOpen(true);
    };

    const handleOpenFeedback = (feedback: Feedback): void => {
        setActiveFeedbackId(feedback.id);
        setDraft(toDraft(feedback));
        setDialogMode("view");
        setRejectComment("");
        setDialogOpen(true);
    };

    const handleCloseDialog = (): void => {
        if (saving || accepting) return;

        setDialogOpen(false);
        setRejectOpen(false);
        setRejectComment("");
    };

    const handleSave = async (): Promise<void> => {
        if (!canSave || saving) return;

        const previousFeedback = activeFeedback;

        setSaving(true);

        const saved =
            dialogMode === "create"
                ? await onCreateFeedback(row.id, draft)
                : previousFeedback
                    ? await onUpdateFeedback(previousFeedback.id, draft)
                    : null;

        setSaving(false);

        if (!saved) return;

        upsertFeedback(saved);
        setDialogOpen(false);
        setDialogMode("view");
        setActiveFeedbackId(saved.id);
    };

    const handleAccept = async (): Promise<void> => {
        if (!activeFeedback || accepting) return;

        setAccepting(true);

        const saved = await onSetFeedbackAcceptance(activeFeedback.id, true);

        setAccepting(false);

        if (!saved) return;

        upsertFeedback(saved);
        setDialogOpen(false);
    };

    const handleReject = async (): Promise<void> => {
        if (!activeFeedback || accepting) return;

        const comment = rejectComment.trim();

        if (!comment) return;

        setAccepting(true);

        const saved = await onSetFeedbackAcceptance(
            activeFeedback.id,
            false,
            comment,
        );

        setAccepting(false);

        if (!saved) return;

        upsertFeedback(saved);
        setRejectOpen(false);
        setDialogOpen(false);
        setRejectComment("");
    };

    const handleRefill = (): void => {
        if (!activeFeedback) return;

        setDraft(toDraft(activeFeedback));
        setDialogMode("edit");
        setRejectComment("");
    };

    const handleConfirmDelete = async (): Promise<void> => {
        if (!deleteTarget || deleting) return;

        setDeleting(true);

        const ok = await onDeleteFeedback(deleteTarget.id);

        setDeleting(false);

        if (!ok) return;

        setFeedbacks((prev) => prev.filter((item) => item.id !== deleteTarget.id));

        if (activeFeedbackId === deleteTarget.id) {
            setActiveFeedbackId(null);
            setDialogOpen(false);
        }

        setDeleteTarget(null);
    };

    return (
        <>
            <Box
                sx={{
                    p: 2,
                    height: "100%",
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                    }}
                >
                    <Box>
                        <Typography
                            sx={{
                                color: c.textPrimary,
                                fontWeight: 700,
                                fontSize: "0.92rem",
                            }}
                        >
                            {"Обратная связь"}
                        </Typography>

                        <Typography sx={{ color: c.textMuted, fontSize: "0.72rem" }}>
                            {feedbacks.length === 0
                                ? "Обратные связи пока не добавлены"
                                : `Добавлено: ${feedbacks.length}`}
                        </Typography>
                    </Box>

                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<Add sx={{ fontSize: 16 }} />}
                        onClick={handleOpenCreate}
                        sx={{
                            textTransform: "none",
                            fontSize: "0.76rem",
                            borderRadius: 1.5,
                        }}
                    >
                        {"Добавить"}
                    </Button>
                </Box>

                {feedbacks.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            border: `1px dashed ${c.borderMain}`,
                            bgcolor: c.hoverOverlay,
                            borderRadius: 2,
                        }}
                    >
                        <Typography sx={{ color: c.textMuted, fontSize: "0.8rem" }}>
                            {
                                "Нажмите «Добавить», чтобы заполнить новую обратную связь по выбранной строке."
                            }
                        </Typography>
                    </Paper>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {feedbacks.map((feedback, index) => (
                            <FeedbackCard
                                key={feedback.id}
                                feedback={feedback}
                                index={feedbacks.length - index}
                                feedbackSourceOptions={feedbackSourceOptions}
                                qualityMetricOptions={qualityMetricOptions}
                                onClick={() => handleOpenFeedback(feedback)}
                                onDelete={() => setDeleteTarget(feedback)}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="md"
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: c.bgPaper,
                            color: c.textBody,
                            border: `1px solid ${c.borderMain}`,
                        },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        color: c.textPrimary,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                    }}
                >
                    {dialogMode === "create"
                        ? "Добавить обратную связь"
                        : dialogMode === "edit"
                            ? "Заполнить обратную связь заново"
                            : "Обратная связь"}

                    {activeFeedback && dialogMode === "view" && (
                        <StatusChip feedback={activeFeedback} />
                    )}
                </DialogTitle>

                <DialogContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        pt: 1,
                    }}
                >
                    <FeedbackFields
                        draft={draft}
                        readonly={readonly || saving || accepting}
                        feedbackSourceOptions={feedbackSourceOptions}
                        qualityMetricOptions={qualityMetricOptions}
                        methodologyStatusOptions={methodologyStatusOptions}
                        sourceNameById={sourceNameById}
                        onChange={updateDraft}
                    />

                    {activeFeedback && dialogMode === "view" && (
                        <FeedbackHistory feedback={activeFeedback} />
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
                    <Button
                        onClick={handleCloseDialog}
                        startIcon={<Close sx={{ fontSize: 16 }} />}
                        sx={{ textTransform: "none" }}
                    >
                        {"Закрыть"}
                    </Button>

                    {dialogMode !== "view" && (
                        <Button
                            variant="contained"
                            disabled={!canSave || saving}
                            onClick={() => void handleSave()}
                            sx={{ textTransform: "none" }}
                        >
                            {saving ? "Сохранение..." : "Сохранить"}
                        </Button>
                    )}

                    {dialogMode === "view" &&
                        activeFeedback &&
                        getFeedbackStatus(activeFeedback) === "pending" && (
                            <>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<Check sx={{ fontSize: 16 }} />}
                                    disabled={accepting}
                                    onClick={() => void handleAccept()}
                                    sx={{ textTransform: "none" }}
                                >
                                    {"Согласен"}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="error"
                                    disabled={accepting}
                                    onClick={() => setRejectOpen(true)}
                                    sx={{ textTransform: "none" }}
                                >
                                    {"Не согласен"}
                                </Button>
                            </>
                        )}

                    {dialogMode === "view" &&
                        activeFeedback &&
                        getFeedbackStatus(activeFeedback) === "rejected" && (
                            <Button
                                variant="contained"
                                startIcon={<Replay sx={{ fontSize: 16 }} />}
                                onClick={handleRefill}
                                sx={{ textTransform: "none" }}
                            >
                                {"Заполнить заново"}
                            </Button>
                        )}
                </DialogActions>
            </Dialog>

            <Dialog
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                fullWidth
                maxWidth="sm"
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: c.bgPaper,
                            color: c.textBody,
                            border: `1px solid ${c.borderMain}`,
                        },
                    },
                }}
            >
                <DialogTitle sx={{ color: c.textPrimary, fontWeight: 700 }}>
                    {"Причина отказа в согласовании"}
                </DialogTitle>

                <DialogContent>
                    <TextField
                        value={rejectComment}
                        onChange={(event) => setRejectComment(event.target.value)}
                        label={"Причина отказа *"}
                        multiline
                        minRows={4}
                        fullWidth
                        sx={{ mt: 1 }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setRejectOpen(false)}
                        sx={{ textTransform: "none" }}
                    >
                        {"Отмена"}
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        disabled={!rejectComment.trim() || accepting}
                        onClick={() => void handleReject()}
                        sx={{ textTransform: "none" }}
                    >
                        {"Не согласовано"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onClose={() => {
                    if (!deleting) setDeleteTarget(null);
                }}
                fullWidth
                maxWidth="xs"
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: c.bgPaper,
                            color: c.textBody,
                            border: `1px solid ${c.borderMain}`,
                        },
                    },
                }}
            >
                <DialogTitle sx={{ color: c.textPrimary, fontWeight: 700 }}>
                    {"Удалить обратную связь?"}
                </DialogTitle>

                <DialogContent>
                    <Typography sx={{ color: c.textBody, fontSize: "0.86rem" }}>
                        {
                            "После удаления эта обратная связь исчезнет из списка. Действие нужно подтвердить."
                        }
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        disabled={deleting}
                        onClick={() => setDeleteTarget(null)}
                        sx={{ textTransform: "none" }}
                    >
                        {"Отмена"}
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        disabled={deleting}
                        onClick={() => void handleConfirmDelete()}
                        sx={{ textTransform: "none" }}
                    >
                        {deleting ? "Удаление..." : "Удалить"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

type FeedbackCardProps = {
    feedback: Feedback;
    index: number;
    feedbackSourceOptions: TypeResponseDto[];
    qualityMetricOptions: TypeResponseDto[];
    onClick: () => void;
    onDelete: () => void;
};

function FeedbackCard({
                          feedback,
                          index,
                          feedbackSourceOptions,
                          qualityMetricOptions,
                          onClick,
                          onDelete,
                      }: FeedbackCardProps) {
    const theme = useTheme();
    const c = theme.custom;

    const sourceNames = feedback.feedbackSourceIds
        .map((id) => findTypeNameById(feedbackSourceOptions, id))
        .filter((name) => name !== "Не заполнено");

    const sourceText =
        sourceNames.length > 0 ? sourceNames.join(", ") : "Не заполнено";

    const metricName = findTypeNameById(
        qualityMetricOptions,
        feedback.feedbackQualityMetricId,
    );

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                position: "relative",
                p: 1.25,
                pr: 4.5,
                border: `1px solid ${c.borderMain}`,
                bgcolor: c.bgPaper,
                borderRadius: 2,
                cursor: "pointer",
                transition: "0.15s ease",
                "&:hover": {
                    bgcolor: c.hoverOverlay,
                    borderColor: c.borderHover,
                },
            }}
        >
            <IconButton
                size="small"
                onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                }}
                sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    color: c.textMuted,
                    "&:hover": {
                        color: theme.palette.error.main,
                        bgcolor: "rgba(211, 47, 47, 0.08)",
                    },
                }}
            >
                <DeleteOutline sx={{ fontSize: 17 }} />
            </IconButton>

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <FeedbackStatusIcon feedback={feedback} />

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            mb: 0.5,
                        }}
                    >
                        <Typography
                            sx={{
                                color: c.textPrimary,
                                fontWeight: 700,
                                fontSize: "0.8rem",
                            }}
                        >
                            {`Обратная связь ${index}`}
                        </Typography>

                        <StatusChip feedback={feedback} />
                    </Box>

                    <Typography
                        sx={{
                            color: c.textBody,
                            fontSize: "0.76rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {sourceText}
                    </Typography>

                    <Typography
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.7rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {metricName}
                    </Typography>

                    <Typography sx={{ color: c.textMuted, fontSize: "0.68rem", mt: 0.5 }}>
                        {`Срок: ${formatDate(feedback.deadline)}`}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}

type FeedbackFieldsProps = {
    draft: FeedbackFormInput;
    readonly: boolean;
    feedbackSourceOptions: TypeResponseDto[];
    qualityMetricOptions: TypeResponseDto[];
    methodologyStatusOptions: TypeResponseDto[];
    sourceNameById: Map<string, string>;
    onChange: <K extends keyof FeedbackFormInput>(
        key: K,
        value: FeedbackFormInput[K],
    ) => void;
};

function FeedbackFields({
                            draft,
                            readonly,
                            feedbackSourceOptions,
                            qualityMetricOptions,
                            methodologyStatusOptions,
                            sourceNameById,
                            onChange,
                        }: FeedbackFieldsProps) {
    const theme = useTheme();
    const c = theme.custom;

    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Typography
                    component="label"
                    sx={{
                        color: c.textSecondary,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        lineHeight: 1.2,
                    }}
                >
                    {` `}
                </Typography>

                <FormControl size="small" fullWidth disabled={readonly}>
                    <InputLabel shrink sx={formLabelSx(theme)}>
                        {`${FEEDBACK_DETAIL_LABELS.feedbackSource} *`}
                    </InputLabel>

                    <Select
                        multiple
                        notched
                        value={draft.feedbackSourceIds}
                        onChange={(event) => {
                            const value = event.target.value;

                            onChange(
                                "feedbackSourceIds",
                                typeof value === "string" ? value.split(",") : value,
                            );
                        }}
                        renderValue={(selected) => (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0.5,
                                    pt: 0.25,
                                    pb: 0.25,
                                }}
                            >
                                {selected.map((id) => (
                                    <Chip
                                        key={String(id)}
                                        variant="outlined"
                                        size="small"
                                        label={sourceNameById.get(String(id)) ?? String(id)}
                                        sx={{
                                            justifyContent: "flex-start",
                                            maxWidth: "100%",
                                            height: "auto",
                                            py: 0.25,
                                            borderRadius: 1,
                                            "& .MuiChip-label": {
                                                display: "block",
                                                whiteSpace: "normal",
                                                lineHeight: 1.25,
                                                py: 0.25,
                                            },
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                        label={`${FEEDBACK_DETAIL_LABELS.feedbackSource} *`}
                        sx={{
                            ...formSelectSx(theme),
                            "& .MuiSelect-select": {
                                display: "flex",
                                alignItems: "flex-start",
                                minHeight: 56,
                                py: 1.25,
                            },
                        }}
                        MenuProps={formMenuSx(theme)}
                    >
                        {feedbackSourceOptions.map((option) => {
                            const value = String(option.id);
                            const checked = draft.feedbackSourceIds.includes(value);

                            return (
                                <MenuItem key={option.id} value={value}>
                                    <Checkbox size="small" checked={checked} sx={{ mr: 0.75 }} />

                                    <ListItemText
                                        primary={option.name}
                                        primaryTypographyProps={{ fontSize: "0.8rem" }}
                                    />
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
            </Box>

            <FormControl size="small" fullWidth disabled={readonly}>
                <InputLabel sx={formLabelSx(theme)}>
                    {`${FEEDBACK_DETAIL_LABELS.feedbackQualityMetric} *`}
                </InputLabel>

                <Select
                    value={draft.feedbackQualityMetricId}
                    onChange={(event) =>
                        onChange("feedbackQualityMetricId", event.target.value)
                    }
                    label={`${FEEDBACK_DETAIL_LABELS.feedbackQualityMetric} *`}
                    sx={formSelectSx(theme)}
                    MenuProps={formMenuSx(theme)}
                >
                    {qualityMetricOptions.map((option) => (
                        <MenuItem key={option.id} value={String(option.id)}>
                            {option.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                value={draft.problemDescription}
                label={`${FEEDBACK_DETAIL_LABELS.problemDescription} *`}
                onChange={(event) => onChange("problemDescription", event.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
                disabled={readonly}
                sx={formInputSx(theme)}
            />

            <TextField
                value={draft.initiatorRequisites}
                label={`${FEEDBACK_DETAIL_LABELS.initiatorRequisites} *`}
                onChange={(event) =>
                    onChange("initiatorRequisites", event.target.value)
                }
                multiline
                rows={2}
                fullWidth
                size="small"
                disabled={readonly}
                sx={formInputSx(theme)}
            />

            <FormControl size="small" fullWidth disabled={readonly}>
                <InputLabel sx={formLabelSx(theme)}>
                    {`${FEEDBACK_DETAIL_LABELS.methodologyPosition} *`}
                </InputLabel>

                <Select
                    value={draft.ftsMethodologyStatusId}
                    onChange={(event) =>
                        onChange("ftsMethodologyStatusId", event.target.value)
                    }
                    label={`${FEEDBACK_DETAIL_LABELS.methodologyPosition} *`}
                    sx={formSelectSx(theme)}
                    MenuProps={formMenuSx(theme)}
                >
                    {methodologyStatusOptions.map((option) => (
                        <MenuItem key={option.id} value={String(option.id)}>
                            {option.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                value={draft.deadline}
                label={`${FEEDBACK_DETAIL_LABELS.deadline} *`}
                onChange={(event) => onChange("deadline", event.target.value)}
                type="date"
                fullWidth
                size="small"
                disabled={readonly}
                sx={formInputSx(theme)}
                InputLabelProps={{ shrink: true }}
            />

            <TextField
                value={draft.initiatorAcceptance}
                label={`${FEEDBACK_DETAIL_LABELS.initiatorAcceptance} *`}
                onChange={(event) =>
                    onChange("initiatorAcceptance", event.target.value)
                }
                multiline
                rows={2}
                fullWidth
                size="small"
                disabled={readonly}
                sx={formInputSx(theme)}
            />
        </>
    );
}

type FeedbackHistoryProps = {
    feedback: Feedback;
};

function FeedbackHistory({ feedback }: FeedbackHistoryProps) {
    const theme = useTheme();
    const c = theme.custom;
    const history = feedback.history ?? [];

    return (
        <Accordion
            defaultExpanded={history.length > 0}
            disableGutters
            elevation={0}
            sx={{
                bgcolor: "transparent",
                border: `1px solid ${c.borderLight}`,
                borderRadius: 1.5,
                "&:before": { display: "none" },
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: c.textSecondary }} />}
                sx={{
                    minHeight: 38,
                    "& .MuiAccordionSummary-content": { my: 0.75 },
                }}
            >
                <Typography
                    sx={{
                        color: c.textPrimary,
                        fontWeight: 700,
                        fontSize: "0.78rem",
                    }}
                >
                    {"История согласования"}
                </Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0 }}>
                {history.length === 0 ? (
                    <Typography sx={{ color: c.textMuted, fontSize: "0.76rem" }}>
                        {"История пока отсутствует"}
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {history.map((item) => (
                            <Box key={item.id}>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                    <HistoryStatusDot toStatus={item.toStatus} />

                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            sx={{
                                                color: c.textBody,
                                                fontSize: "0.76rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {getHistoryText(item.fromStatus, item.toStatus)}
                                        </Typography>

                                        <Typography
                                            sx={{ color: c.textMuted, fontSize: "0.68rem" }}
                                        >
                                            {formatDate(item.createdAt)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {item.comment && (
                                    <Typography
                                        sx={{
                                            mt: 0.5,
                                            ml: 3,
                                            color: c.textSecondary,
                                            fontSize: "0.72rem",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {`Комментарий отказа: ${item.comment}`}
                                    </Typography>
                                )}

                                <Divider sx={{ mt: 1, borderColor: c.borderLight }} />
                            </Box>
                        ))}
                    </Box>
                )}
            </AccordionDetails>
        </Accordion>
    );
}

function StatusChip({ feedback }: { feedback: Feedback }) {
    const theme = useTheme();
    const c = theme.custom;
    const status = getFeedbackStatus(feedback);

    const colors =
        status === "accepted"
            ? {
                color: theme.palette.success.main,
                bgcolor: "rgba(46, 125, 50, 0.12)",
            }
            : status === "rejected"
                ? {
                    color: theme.palette.error.main,
                    bgcolor: "rgba(211, 47, 47, 0.12)",
                }
                : {
                    color: c.textSecondary,
                    bgcolor: c.hoverOverlayStrong,
                };

    return (
        <Chip
            size="small"
            label={getStatusLabel(status)}
            sx={{
                height: 22,
                borderRadius: 1,
                fontSize: "0.66rem",
                fontWeight: 700,
                color: colors.color,
                bgcolor: colors.bgcolor,
            }}
        />
    );
}

function FeedbackStatusIcon({ feedback }: { feedback: Feedback }) {
    return <StatusIcon status={getFeedbackStatus(feedback)} />;
}

function HistoryStatusDot({ toStatus }: { toStatus: string }) {
    const status =
        toStatus === "ACCEPTED"
            ? "accepted"
            : toStatus === "REJECTED"
                ? "rejected"
                : "pending";

    return <StatusIcon status={status} />;
}

function StatusIcon({
                        status,
                    }: {
    status: "pending" | "accepted" | "rejected" | null;
}) {
    const theme = useTheme();
    const c = theme.custom;

    const iconSx = {
        width: 16,
        height: 16,
        display: "block",
    };

    return (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                mt: 0.2,
                flexShrink: 0,
            }}
        >
            {status === "accepted" ? (
                <CheckCircleRounded
                    sx={{
                        ...iconSx,
                        color: theme.palette.success.main,
                    }}
                />
            ) : status === "rejected" ? (
                <CancelRounded
                    sx={{
                        ...iconSx,
                        color: theme.palette.error.main,
                    }}
                />
            ) : (
                <RadioButtonUncheckedRounded
                    sx={{
                        ...iconSx,
                        color: c.textMuted,
                    }}
                />
            )}
        </Box>
    );
}

function Dot({
                 status,
             }: {
    status: "pending" | "accepted" | "rejected" | null;
}) {
    const theme = useTheme();
    const c = theme.custom;

    const dot =
        status === "accepted"
            ? {
                bgcolor: theme.palette.success.main,
                borderColor: theme.palette.success.main,
            }
            : status === "rejected"
                ? {
                    bgcolor: theme.palette.error.main,
                    borderColor: theme.palette.error.main,
                }
                : {
                    bgcolor: "transparent",
                    borderColor: c.textMuted,
                };

    return (
        <Box
            sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                mt: 0.45,
                flexShrink: 0,
                bgcolor: dot.bgcolor,
                border: `1px solid ${dot.borderColor}`,
            }}
        />
    );
}
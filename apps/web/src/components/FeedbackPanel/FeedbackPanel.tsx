import type {
    FeedbackAgreementHistoryItem,
    FeedbackAgreementStatus,
    Row,
} from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useEffect, useMemo, useState } from "react";
import { ExpandMore } from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
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
    hasFeedback,
} from "src/entities/fts-function/lib/detail-technology";
import {
    formInputSx,
    formLabelSx,
    formMenuSx,
    formSelectSx,
} from "src/shared/ui/styles/form";

type FeedbackDraft = {
    feedbackSource: string;
    feedbackQualityMetric: string;
    problemDescription: string;
    initiatorRequisites: string;
    methodologyPosition: string;
    deadline: string;
    initiatorAcceptance: string;
};

export type FeedbackPanelProps = {
    row: Row | null;
    typesAll: TypeResponseDto[];
    onSaveFeedback: (id: string, updates: Partial<Row>) => Promise<boolean>;
    onSetFeedbackAcceptance: (
        id: string,
        isAccepted: boolean,
        rejectComment?: string,
    ) => Promise<boolean>;
};

const emptyDraft: FeedbackDraft = {
    feedbackSource: "",
    feedbackQualityMetric: "",
    problemDescription: "",
    initiatorRequisites: "",
    methodologyPosition: "",
    deadline: "",
    initiatorAcceptance: "",
};

function buildDraft(row: Row | null): FeedbackDraft {
    if (!row) return emptyDraft;

    return {
        feedbackSource: row.feedbackSource ?? "",
        feedbackQualityMetric: row.feedbackQualityMetric ?? "",
        problemDescription: row.problemDescription ?? "",
        initiatorRequisites: row.initiatorRequisites ?? "",
        methodologyPosition: row.methodologyPosition ?? "",
        deadline: row.deadline?.slice(0, 10) ?? "",
        initiatorAcceptance: row.initiatorAcceptance ?? "",
    };
}

function getStatusLabel(status: FeedbackAgreementStatus | null): string {
    if (status === "ACCEPTED") return "Согласовано";
    if (status === "REJECTED") return "Не согласовано";
    return "На согласовании";
}

function getHistoryText(item: FeedbackAgreementHistoryItem): string {
    if (!item.fromStatus || item.fromStatus === item.toStatus) {
        return getStatusLabel(item.toStatus);
    }

    return `${getStatusLabel(item.fromStatus)} → ${getStatusLabel(item.toStatus)}`;
}

function buildInitialHistory(row: Row | null): FeedbackAgreementHistoryItem[] {
    if (!row || !hasFeedback(row)) return [];

    if (row.feedbackAgreementHistory?.length) {
        return row.feedbackAgreementHistory;
    }

    const status = getFeedbackStatus(row);

    if (status === "accepted") {
        return [
            {
                id: `${row.id}-accepted`,
                fromStatus: "PENDING",
                toStatus: "ACCEPTED",
            },
            {
                id: `${row.id}-pending`,
                fromStatus: null,
                toStatus: "PENDING",
            },
        ];
    }

    if (status === "rejected") {
        return [
            {
                id: `${row.id}-rejected`,
                fromStatus: "PENDING",
                toStatus: "REJECTED",
                comment: row.rejectComment || undefined,
            },
            {
                id: `${row.id}-pending`,
                fromStatus: null,
                toStatus: "PENDING",
            },
        ];
    }

    return [
        {
            id: `${row.id}-pending`,
            fromStatus: null,
            toStatus: "PENDING",
        },
    ];
}

export default function FeedbackPanel({
                                          row,
                                          typesAll,
                                          onSaveFeedback,
                                          onSetFeedbackAcceptance,
                                      }: FeedbackPanelProps) {
    const theme = useTheme();
    const c = theme.custom;

    const [draft, setDraft] = useState<FeedbackDraft>(() => buildDraft(row));
    const [savedLocally, setSavedLocally] = useState(false);
    const [localAccepted, setLocalAccepted] = useState<boolean | null | undefined>(
        undefined,
    );
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState("");
    const [editMode, setEditMode] = useState(!hasFeedback(row));
    const [saving, setSaving] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [localHistory, setLocalHistory] = useState<
        FeedbackAgreementHistoryItem[]
    >(() => buildInitialHistory(row));

    useEffect(() => {
        setDraft(buildDraft(row));
        setSavedLocally(false);
        setLocalAccepted(undefined);
        setRejectComment("");
        setRejectOpen(false);
        setEditMode(!hasFeedback(row));
        setSaving(false);
        setAccepting(false);
        setLocalHistory(buildInitialHistory(row));
    }, [row?.id, row?.feedbackAgreementHistory?.length]);

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
                DETAIL_TYPE_CATEGORY.FTS_FUNCTION_EFFECTIVENESS,
            ),
        [typesAll],
    );

    const canSave = areFeedbackRequiredFieldsFilled(draft);

    const effectiveRow: Partial<Row> = {
        ...row,
        ...draft,
        isAccepted: localAccepted === undefined ? row?.isAccepted : localAccepted,
        rejectComment:
            localAccepted === null ? "" : (row?.rejectComment ?? rejectComment),
    };

    const status = savedLocally
        ? getFeedbackStatus(effectiveRow)
        : getFeedbackStatus(row);

    const feedbackSaved = savedLocally || hasFeedback(row);

    const statusChip =
        status === "accepted"
            ? {
                label: "согласовано",
                color: theme.palette.success.main,
                bgcolor: "rgba(46, 125, 50, 0.12)",
            }
            : status === "rejected"
                ? {
                    label: "не согласовано",
                    color: theme.palette.error.main,
                    bgcolor: "rgba(211, 47, 47, 0.12)",
                }
                : feedbackSaved
                    ? {
                        label: "на согласовании",
                        color: c.textSecondary,
                        bgcolor: c.hoverOverlayStrong,
                    }
                    : null;

    if (!row) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography sx={{ color: c.textMuted, fontSize: "0.82rem" }}>
                    {"Выберите строку блока «Фактическое действие»"}
                </Typography>
            </Box>
        );
    }

    const readonly = feedbackSaved && !editMode;

    const updateDraft = (key: keyof FeedbackDraft, value: string) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const prependHistory = (
        item: Omit<FeedbackAgreementHistoryItem, "id" | "createdAt">,
    ) => {
        setLocalHistory((prev) => [
            {
                ...item,
                id: `${row.id}-${Date.now()}-${prev.length}`,
                createdAt: new Date().toISOString(),
            },
            ...prev,
        ]);
    };

    const handleSave = async () => {
        if (!canSave || saving) return;

        const fromStatus: FeedbackAgreementStatus | null =
            row.isAccepted === false || localAccepted === false
                ? "REJECTED"
                : row.isAccepted === true || localAccepted === true
                    ? "ACCEPTED"
                    : null;

        setSaving(true);

        const ok = await onSaveFeedback(row.id, {
            ...draft,
            isAccepted: null,
            rejectComment: "",
        });

        setSaving(false);

        if (!ok) return;

        setSavedLocally(true);
        setLocalAccepted(null);
        setRejectComment("");
        setEditMode(false);

        prependHistory({
            fromStatus,
            toStatus: "PENDING",
        });
    };

    const handleAccept = async () => {
        if (accepting) return;

        setAccepting(true);

        const ok = await onSetFeedbackAcceptance(row.id, true);

        setAccepting(false);

        if (!ok) return;

        setSavedLocally(true);
        setLocalAccepted(true);

        prependHistory({
            fromStatus: "PENDING",
            toStatus: "ACCEPTED",
        });
    };

    const handleReject = async () => {
        const comment = rejectComment.trim();

        if (!comment || accepting) return;

        setAccepting(true);

        const ok = await onSetFeedbackAcceptance(row.id, false, comment);

        setAccepting(false);

        if (!ok) return;

        setSavedLocally(true);
        setLocalAccepted(false);
        setRejectOpen(false);

        prependHistory({
            fromStatus: "PENDING",
            toStatus: "REJECTED",
            comment,
        });
    };

    const handleRefill = () => {
        setEditMode(true);
        setLocalAccepted(null);
        setSavedLocally(true);
        setRejectComment("");
    };

    const renderHistoryDot = (itemStatus: FeedbackAgreementStatus) => {
        const dot =
            itemStatus === "ACCEPTED"
                ? {
                    bgcolor: theme.palette.success.main,
                    borderColor: theme.palette.success.main,
                }
                : itemStatus === "REJECTED"
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
                    width: 9,
                    height: 9,
                    mt: "5px",
                    borderRadius: "50%",
                    bgcolor: dot.bgcolor,
                    border: `1.5px solid ${dot.borderColor}`,
                    flexShrink: 0,
                }}
            />
        );
    };

    return (
        <>
            <Box
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: `1px solid ${c.borderLight}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                    }}
                >
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
                        {"Обратная связь"}
                    </Typography>

                    {statusChip && (
                        <Chip
                            label={statusChip.label}
                            size="small"
                            sx={{
                                height: 22,
                                bgcolor: statusChip.bgcolor,
                                color: statusChip.color,
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                borderRadius: 1,
                            }}
                        />
                    )}
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        overflow: "auto",
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                    }}
                >
                    <FormControl size="small" fullWidth disabled={readonly || saving}>
                        <InputLabel sx={formLabelSx(theme)}>
                            {`${FEEDBACK_DETAIL_LABELS.feedbackSource} *`}
                        </InputLabel>
                        <Select
                            value={draft.feedbackSource}
                            onChange={(e) => updateDraft("feedbackSource", e.target.value)}
                            label={`${FEEDBACK_DETAIL_LABELS.feedbackSource} *`}
                            sx={formSelectSx(theme)}
                            MenuProps={formMenuSx(theme)}
                        >
                            {feedbackSourceOptions.map((option) => (
                                <MenuItem key={option.code} value={option.code}>
                                    {option.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth disabled={readonly || saving}>
                        <InputLabel sx={formLabelSx(theme)}>
                            {`${FEEDBACK_DETAIL_LABELS.feedbackQualityMetric} *`}
                        </InputLabel>
                        <Select
                            value={draft.feedbackQualityMetric}
                            onChange={(e) =>
                                updateDraft("feedbackQualityMetric", e.target.value)
                            }
                            label={`${FEEDBACK_DETAIL_LABELS.feedbackQualityMetric} *`}
                            sx={formSelectSx(theme)}
                            MenuProps={formMenuSx(theme)}
                        >
                            {qualityMetricOptions.map((option) => (
                                <MenuItem key={option.code} value={option.code}>
                                    {option.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label={`${FEEDBACK_DETAIL_LABELS.problemDescription} *`}
                        value={draft.problemDescription}
                        onChange={(e) => updateDraft("problemDescription", e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                        size="small"
                        disabled={readonly || saving}
                        sx={formInputSx(theme)}
                    />

                    <TextField
                        label={`${FEEDBACK_DETAIL_LABELS.initiatorRequisites} *`}
                        value={draft.initiatorRequisites}
                        onChange={(e) => updateDraft("initiatorRequisites", e.target.value)}
                        fullWidth
                        size="small"
                        disabled={readonly || saving}
                        sx={formInputSx(theme)}
                    />

                    <TextField
                        label={`${FEEDBACK_DETAIL_LABELS.methodologyPosition} *`}
                        value={draft.methodologyPosition}
                        onChange={(e) => updateDraft("methodologyPosition", e.target.value)}
                        fullWidth
                        size="small"
                        disabled={readonly || saving}
                        sx={formInputSx(theme)}
                    />

                    <TextField
                        label={`${FEEDBACK_DETAIL_LABELS.deadline} *`}
                        value={draft.deadline}
                        onChange={(e) => updateDraft("deadline", e.target.value)}
                        type="date"
                        fullWidth
                        size="small"
                        disabled={readonly || saving}
                        sx={formInputSx(theme)}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        label={`${FEEDBACK_DETAIL_LABELS.initiatorAcceptance} *`}
                        value={draft.initiatorAcceptance}
                        onChange={(e) => updateDraft("initiatorAcceptance", e.target.value)}
                        multiline
                        rows={2}
                        fullWidth
                        size="small"
                        disabled={readonly || saving}
                        sx={formInputSx(theme)}
                    />

                    <Accordion
                        disableGutters
                        sx={{
                            mt: 0.5,
                            bgcolor: "transparent",
                            color: c.textBody,
                            border: `1px solid ${c.borderLight}`,
                            boxShadow: "none",
                            "&:before": { display: "none" },
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore sx={{ color: c.textSecondary }} />}
                            sx={{
                                minHeight: 36,
                                "& .MuiAccordionSummary-content": { my: 0.75 },
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: c.textSecondary,
                                    fontWeight: 600,
                                    fontSize: "0.72rem",
                                }}
                            >
                                {"История согласования"}
                            </Typography>
                        </AccordionSummary>

                        <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
                            {localHistory.length === 0 ? (
                                <Typography sx={{ color: c.textDim, fontSize: "0.75rem" }}>
                                    {"История пока отсутствует"}
                                </Typography>
                            ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                    {localHistory.map((item) => (
                                        <Box
                                            key={item.id}
                                            sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                                        >
                                            {renderHistoryDot(item.toStatus)}

                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    sx={{ color: c.textBody, fontSize: "0.75rem" }}
                                                >
                                                    {getHistoryText(item)}
                                                </Typography>

                                                {item.comment && (
                                                    <Typography
                                                        sx={{
                                                            color: c.textMuted,
                                                            fontSize: "0.7rem",
                                                            whiteSpace: "pre-wrap",
                                                            mt: 0.25,
                                                        }}
                                                    >
                                                        {`Комментарий отказа: ${item.comment}`}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                </Box>

                <Box
                    sx={{
                        p: 2,
                        borderTop: `1px solid ${c.borderLight}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}
                >
                    {editMode && (
                        <Button
                            variant="contained"
                            disabled={!canSave || saving}
                            onClick={handleSave}
                            fullWidth
                            sx={{
                                textTransform: "none",
                                bgcolor: c.saveBtn,
                                "&:hover": { bgcolor: c.saveBtnHover },
                                "&.Mui-disabled": {
                                    bgcolor: c.borderMain,
                                    color: c.textDim,
                                },
                            }}
                        >
                            {saving ? "Сохранение..." : "Сохранить"}
                        </Button>
                    )}

                    {!editMode && feedbackSaved && status === "pending" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleAccept}
                                disabled={accepting}
                                fullWidth
                                sx={{
                                    textTransform: "none",
                                    bgcolor: theme.palette.success.main,
                                    "&:hover": { bgcolor: theme.palette.success.dark },
                                }}
                            >
                                {"Согласен"}
                            </Button>

                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => setRejectOpen(true)}
                                disabled={accepting}
                                fullWidth
                                sx={{ textTransform: "none" }}
                            >
                                {"Не согласен"}
                            </Button>
                        </Box>
                    )}

                    {!editMode && status === "rejected" && (
                        <Button
                            variant="outlined"
                            onClick={handleRefill}
                            fullWidth
                            sx={{ textTransform: "none" }}
                        >
                            {"Заполнить заново"}
                        </Button>
                    )}
                </Box>
            </Box>

            <Dialog
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>{"Причина отказа в согласовании"}</DialogTitle>

                <DialogContent>
                    <TextField
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        label={"Причина отказа *"}
                        multiline
                        minRows={4}
                        fullWidth
                        sx={{ mt: 1 }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setRejectOpen(false)}>{"Отмена"}</Button>

                    <Button
                        color="error"
                        variant="contained"
                        disabled={!rejectComment.trim() || accepting}
                        onClick={handleReject}
                    >
                        {"Не согласовано"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
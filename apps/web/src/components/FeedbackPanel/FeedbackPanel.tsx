import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useEffect, useMemo, useState } from "react";
import {
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
    onSaveFeedback: (id: string, updates: Partial<Row>) => void;
    onSetFeedbackAcceptance: (
        id: string,
        isAccepted: boolean,
        rejectComment?: string,
    ) => void;
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

    useEffect(() => {
        setDraft(buildDraft(row));
        setSavedLocally(false);
        setLocalAccepted(undefined);
        setRejectComment("");
        setRejectOpen(false);
        setEditMode(!hasFeedback(row));
    }, [row?.id]);

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

    const handleSave = () => {
        if (!canSave) return;

        onSaveFeedback(row.id, {
            ...draft,
            isAccepted: null,
            rejectComment: "",
        });

        setSavedLocally(true);
        setLocalAccepted(null);
        setEditMode(false);
    };

    const handleAccept = () => {
        onSetFeedbackAcceptance(row.id, true);
        setLocalAccepted(true);
    };

    const handleReject = () => {
        const comment = rejectComment.trim();
        if (!comment) return;

        onSetFeedbackAcceptance(row.id, false, comment);
        setLocalAccepted(false);
        setRejectOpen(false);
    };

    const handleRefill = () => {
        setEditMode(true);
        setLocalAccepted(null);
        setSavedLocally(false);
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
                    <FormControl size="small" fullWidth disabled={readonly}>
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

                    <FormControl size="small" fullWidth disabled={readonly}>
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
                        disabled={readonly}
                        sx={formInputSx(theme)}
                    />

                    <TextField
                        label={`${FEEDBACK_DETAIL_LABELS.initiatorRequisites} *`}
                        value={draft.initiatorRequisites}
                        onChange={(e) => updateDraft("initiatorRequisites", e.target.value)}
                        fullWidth
                        size="small"
                        disabled={readonly}
                        sx={formInputSx(theme)}
                    />

                    <TextField
                        label={`${FEEDBACK_DETAIL_LABELS.methodologyPosition} *`}
                        value={draft.methodologyPosition}
                        onChange={(e) => updateDraft("methodologyPosition", e.target.value)}
                        fullWidth
                        size="small"
                        disabled={readonly}
                        sx={formInputSx(theme)}
                    />

                    <TextField
                        label={`${FEEDBACK_DETAIL_LABELS.deadline} *`}
                        value={draft.deadline}
                        onChange={(e) => updateDraft("deadline", e.target.value)}
                        type="date"
                        fullWidth
                        size="small"
                        disabled={readonly}
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
                        disabled={readonly}
                        sx={formInputSx(theme)}
                    />
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
                            disabled={!canSave}
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
                            {"Сохранить"}
                        </Button>
                    )}

                    {!editMode && feedbackSaved && status === "pending" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleAccept}
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
                        disabled={!rejectComment.trim()}
                        onClick={handleReject}
                    >
                        {"Не согласовано"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
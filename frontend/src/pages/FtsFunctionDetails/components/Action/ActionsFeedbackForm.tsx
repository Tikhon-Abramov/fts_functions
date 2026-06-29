import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, FormControl, InputLabel, MenuItem, OutlinedInput, Select, TextField, Typography, useTheme } from "@mui/material";
import { Save } from "@mui/icons-material";
import { useActionControllerDeleteFeedbackV1Mutation, useActionControllerUpdateFeedbackV1Mutation, useConstantControllerGetTypesV1Query } from "../../../../store/ftsFunctionRegistry";
import { createOtionsFromTypes } from "../../../../utils/create-options";
import type { ActionsFeedbackFormData } from "./schema";


// Локальное строковое состояние формы (значения селектов/полей хранятся строками).
type FeedbackFormState = {
    feedbackSourceIds: string[];
    feedbackQualityMetricId: string;
    ftsMethodologyStatusId: string;
    problemDescription: string;
    initiatorRequisites: string;
    deadline: string;
    initiatorAcceptance: string;
};

const EMPTY_FEEDBACK_FORM: FeedbackFormState = {
    feedbackSourceIds: [],
    feedbackQualityMetricId: "",
    ftsMethodologyStatusId: "",
    problemDescription: "",
    initiatorRequisites: "",
    deadline: "",
    initiatorAcceptance: "",
};


type ActionsFeedbackFormProps = {
    actionId?: number | null;
    open: boolean;
    onClose: () => void;
    // Данные обратной связи приходят из ActionCardModal (тип из schema.ts),
    // чтобы не вызывать useActionControllerGetActionByIdV1Query повторно.
    initialFeedback?: Partial<ActionsFeedbackFormData>;
}


// Маппинг данных обратной связи (типы из schema.ts) в строковое состояние формы.
function toFeedbackFormState(data?: Partial<ActionsFeedbackFormData>): FeedbackFormState {
    const deadline =
        data?.deadline && !Number.isNaN(new Date(data.deadline).getTime())
            ? new Date(data.deadline).toISOString().slice(0, 10)
            : "";

    return {
        feedbackSourceIds: (data?.feedbackSourceIds ?? []).map(String),
        feedbackQualityMetricId: data?.feedbackQualityMetricsId != null ? String(data.feedbackQualityMetricsId) : "",
        ftsMethodologyStatusId: data?.ftsMethodologyStatusId != null ? String(data.ftsMethodologyStatusId) : "",
        problemDescription: data?.problemDescription ?? "",
        initiatorRequisites: data?.initiatorRequisites ?? "",
        deadline,
        initiatorAcceptance: data?.initiatorAcceptance ?? "",
    };
}


export function ActionsFeedbackForm({ actionId, open, onClose, initialFeedback }: ActionsFeedbackFormProps) {
    const theme = useTheme();
    const c = theme.custom;

    const { data: feedbackSource } = useConstantControllerGetTypesV1Query({ categories: ['FEEDBACK_SOURCE'] });
    const { data: feedbackQualityMetrics } = useConstantControllerGetTypesV1Query({ categories: ['FEEDBACK_QUALITY_METRICS'] });
    const { data: ftsMethodologyStatus } = useConstantControllerGetTypesV1Query({ categories: ['FTS_METHODOLOGY_STATUS'] });

    const feedbackSourceOptions = useMemo(() => createOtionsFromTypes(feedbackSource), [feedbackSource]);
    const feedbackMetricOptions = useMemo(() => createOtionsFromTypes(feedbackQualityMetrics), [feedbackQualityMetrics]);
    const methodologyStatusOptions = useMemo(() => createOtionsFromTypes(ftsMethodologyStatus), [ftsMethodologyStatus]);

    // Добавление/обновление обратной связи делаем через updateFeedback (частичный upsert):
    // эндпоинт createFeedback требует обязательный priorityActionId, которого нет в этой форме.
    const [updateFeedback, { isLoading: isUpdatingFeedback }] = useActionControllerUpdateFeedbackV1Mutation();
    const [deleteFeedback, { isLoading: isDeletingFeedback }] = useActionControllerDeleteFeedbackV1Mutation();

    const [feedbackForm, setFeedbackForm] = useState<FeedbackFormState>(EMPTY_FEEDBACK_FORM);

    const saving = isUpdatingFeedback || isDeletingFeedback;
    const canSaveFeedback =
        Boolean(feedbackForm.feedbackQualityMetricId && feedbackForm.ftsMethodologyStatusId) && !saving;

    // Префилл из данных операции, переданных пропсом (без повторного getActionById) / сброс при закрытии.
    const initialApplied = useRef(false);
    useEffect(() => {
        if (!open) {
            initialApplied.current = false;
            setFeedbackForm(EMPTY_FEEDBACK_FORM);
            return;
        }

        if (!initialApplied.current && initialFeedback && Object.keys(initialFeedback).length > 0) {
            initialApplied.current = true;
            setFeedbackForm(toFeedbackFormState(initialFeedback));
        }
    }, [open, initialFeedback]);


    const handleSaveFeedback = async () => {
        if (actionId == null || !canSaveFeedback) return;

        try {
            const deadline = feedbackForm.deadline ? new Date(feedbackForm.deadline).toISOString() : "";
            const payload = {
                feedbackQualityMetricsId: Number(feedbackForm.feedbackQualityMetricId),
                ftsMethodologyStatusId: Number(feedbackForm.ftsMethodologyStatusId),
                feedbackSourceIds: feedbackForm.feedbackSourceIds.map(Number),
                problemDescription: feedbackForm.problemDescription,
                initiatorRequisites: feedbackForm.initiatorRequisites,
                initiatorAcceptance: feedbackForm.initiatorAcceptance,
                deadline,
            };

            await updateFeedback({
                id: String(actionId),
                updateActionsFeedbackDto: payload,
            }).unwrap();
            onClose();
        } catch (error) {
            console.error("Не удалось сохранить обратную связь:", error);
        }
    };

    const handleDeleteFeedback = async () => {
        if (actionId == null) return;

        try {
            await deleteFeedback({ id: String(actionId) }).unwrap();
            setFeedbackForm(EMPTY_FEEDBACK_FORM);
            onClose();
        } catch (error) {
            console.error("Не удалось удалить обратную связь:", error);
        }
    };


    return (

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
                <InputLabel
                    sx={{
                        color: c.textMuted,
                        fontSize: "0.72rem",
                        "&.Mui-focused": { color: theme.palette.primary.main },
                    }}
                >
                    Источник обратной связи
                </InputLabel>

                <Select
                    multiple
                    value={feedbackForm.feedbackSourceIds}
                    input={
                        <OutlinedInput label={'Источник обратной связи'} />
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
                    renderValue={(selected) => (
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
                                        (option) => String(option.value) === String(id),
                                    )?.label ?? id;

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
                    )}
                    sx={{

                        bgcolor: c.bgInput,
                        color: c.textBody,
                        fontSize: "0.78rem",
                        "& fieldset": { borderColor: c.borderMedium },
                        "&:hover fieldset": { borderColor: c.borderHover },
                        "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                        "& .MuiSelect-icon": { color: c.textMuted },

                        "& .MuiSelect-select": {
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            py: 1,
                            minHeight: "32px",
                            whiteSpace: "normal",
                        },
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
                    data-testid="action-feedback-sources"
                >
                    {feedbackSourceOptions.map((source) => (
                        <MenuItem
                            key={source.value}
                            value={String(source.value)}
                            sx={{ fontSize: "0.78rem" }}
                        >
                            {source.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
                <InputLabel
                    sx={{
                        color: c.textMuted,
                        fontSize: "0.72rem",
                        "&.Mui-focused": { color: theme.palette.primary.main },
                    }}
                >
                    Метрики качества процесса в рамках обратной связи
                </InputLabel>

                <Select
                    value={feedbackForm.feedbackQualityMetricId}
                    label={"Метрики качества процесса в рамках обратной связи"}
                    onChange={(event) =>
                        setFeedbackForm((prev) => ({
                            ...prev,
                            feedbackQualityMetricId: String(event.target.value),
                        }))
                    }
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
                    data-testid="action-feedback-quality-metric"
                >
                    {feedbackMetricOptions.map((metric) => (
                        <MenuItem
                            key={metric.value}
                            value={String(metric.value)}
                            sx={{ fontSize: "0.78rem" }}
                        >
                            {metric.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
                <InputLabel
                    sx={{
                        color: c.textMuted,
                        fontSize: "0.72rem",
                        "&.Mui-focused": { color: theme.palette.primary.main },
                    }}
                >
                    Методология позиции ЦА ФНС России
                </InputLabel>

                <Select
                    value={feedbackForm.ftsMethodologyStatusId}
                    label={"Методология позиции ЦА ФНС России"}
                    onChange={(event) =>
                        setFeedbackForm((prev) => ({
                            ...prev,
                            ftsMethodologyStatusId: String(event.target.value),
                        }))
                    }
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
                    data-testid="action-feedback-methodology-status"
                >
                    {methodologyStatusOptions.map((status) => (
                        <MenuItem
                            key={status.value}
                            value={String(status.value)}
                            sx={{ fontSize: "0.78rem" }}
                        >
                            {status.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label={"Описание проблемы с указанием источника, метрики, способа решения"}
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
                data-testid="action-feedback-problem"
            />

            <TextField
                label={"Реквизиты автора инициативы"}
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
                data-testid="action-feedback-initiator"
            />

            <TextField
                label={"Срок реализации доработки"}
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
                slotProps={{ inputLabel: { shrink: true } }}
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
                data-testid="action-feedback-deadline"
            />

            <TextField
                label={"Акцепт автора инициативы"}
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
    );
}

export default ActionsFeedbackForm;

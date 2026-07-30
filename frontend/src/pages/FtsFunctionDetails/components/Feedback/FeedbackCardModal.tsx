import { useEffect, useRef, useState } from "react";
import { CancelRounded, Check, CheckCircleRounded, Close, ExpandMore, RadioButtonUncheckedRounded, Replay } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, InputLabel, ListItemText, MenuItem, Select, TextField, Typography, useTheme } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    useConstantControllerGetTypesV1Query,
    useFeedbackControllerCreateV1Mutation,
    useFeedbackControllerUpdateV1Mutation,
    useFeedbackControllerAcceptV1Mutation,
    useFeedbackControllerGetFeedbackByIdV1Query,
} from "../../../../store/ftsFunctionRegistry";
import { createOtionsFromTypes } from "../../../../utils/create-options";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionDetailId } from "../../../../store/uiSlice";
import { FeedbackFormSchema, type FeedbackFormData } from "./schema";
import { ActionDeleteFormModal as FeedbackRejectFormModal } from "./FeedbackRejectFormModal";
import { skipToken } from "@reduxjs/toolkit/query";


const EMPTY_FORM: FeedbackFormData = {
    ftsFunctionDetailId: Number.NaN,
    feedbackSourceIds: [],
    feedbackQualityMetricsId: Number.NaN,
    ftsMethodologyStatusId: Number.NaN,
    problemDescription: "",
    initiatorRequisites: "",
    initiatorAcceptance: "",
    deadline: "",
};


function formatDate(value: string | null | undefined): string {
    if (!value) return "Не указан";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("ru-RU");
}

function getApiStatusLabel(code: string | null | undefined): string {
    if (code === "ACCEPTED") return "Согласовано";
    if (code === "REJECTED") return "Не согласовано";

    return "На согласовании";
}


export function StatusChip({ code }: { code?: string | null }) {
    const theme = useTheme();
    const c = theme.custom;

    const label =
        code === "ACCEPTED"
            ? "согласовано"
            : code === "REJECTED"
                ? "не согласовано"
                : "на согласовании";

    const colors =
        code === "ACCEPTED"
            ? {
                color: theme.palette.success.main,
                bgcolor: "rgba(46, 125, 50, 0.12)",
            }
            : code === "REJECTED"
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
            label={label}
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


export function StatusIcon({ code }: { code?: string | null }) {
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
            {code === "ACCEPTED" ? (
                <CheckCircleRounded
                    sx={{
                        ...iconSx,
                        color: theme.palette.success.main,
                    }}
                />
            ) : code === "REJECTED" ? (
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


type FeedbackCardModalProps = {
    feedbackId?: number | null;
    open: boolean;
    onClose: () => void;
};


export function FeedbackCardModal({ feedbackId, open, onClose }: FeedbackCardModalProps) {
    const theme = useTheme();
    const c = theme.custom;

    const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);

    const isCreateMode = feedbackId == null;

    const [editing, setEditing] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    // Стили полей (раньше — общие функции formInputSx/...). Вписаны напрямую в компонент.
    const formInputSx = {
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
    };

    const formSelectSx = {
        bgcolor: c.bgInput,
        color: c.textBody,
        fontSize: "0.78rem",
        "& fieldset": { borderColor: c.borderMedium },
        "&:hover fieldset": { borderColor: c.borderHover },
        "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
        "& .MuiSelect-icon": { color: c.textMuted },
    };

    const formLabelSx = {
        color: c.textMuted,
        fontSize: "0.72rem",
        "&.Mui-focused": { color: theme.palette.primary.main },
    };

    const formMenuSx = {
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
    };

    // Отображение значения поля в режиме просмотра (как у «Источник обратной связи»).
    const viewValueSx = {
        color: c.textBody,
        fontSize: "0.82rem",
        whiteSpace: "pre-wrap" as const,
        wordBreak: "break-word" as const,
    };

    const renderReadonlyField = (label: string, value: string | string[] | null | undefined) => (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography sx={{ color: c.textSecondary, fontSize: "0.72rem", fontWeight: 600, lineHeight: 1.2 }}>
                {label}
            </Typography>

            {
                Array.isArray(value)
                    ? (
                        value.map(v => (
                            <Typography sx={viewValueSx}>
                                {v && v.trim() ? v : "—"}
                            </Typography>
                        ))
                    )
                    : (
                        <Typography sx={viewValueSx}>
                            {value && value.trim() ? value : "—"}
                        </Typography>
                    )
            }
        </Box>
    );

    const { data: feedbackSource } = useConstantControllerGetTypesV1Query({ categories: ['FEEDBACK_SOURCE'] });
    const { data: feedbackQualityMetrics } = useConstantControllerGetTypesV1Query({ categories: ['FEEDBACK_QUALITY_METRICS'] });
    const { data: ftsMethodologyStatus } = useConstantControllerGetTypesV1Query({ categories: ['FTS_METHODOLOGY_STATUS'] });
    const { data: feedbackAcceptStatus } = useConstantControllerGetTypesV1Query({ categories: ['FEEDBACK_ACCEPT_STATUS'] });

    const feedbackSourceOptions = createOtionsFromTypes(feedbackSource);
    const qualityMetricOptions = createOtionsFromTypes(feedbackQualityMetrics);
    const methodologyStatusOptions = createOtionsFromTypes(ftsMethodologyStatus);
    const acceptStatusOptions = createOtionsFromTypes(feedbackAcceptStatus);

    const acceptedStatusId = acceptStatusOptions.find((option) => option.code === "ACCEPTED")?.value;
    const rejectedStatusId = acceptStatusOptions.find((option) => option.code === "REJECTED")?.value;

    const { currentData: feedbackData } = useFeedbackControllerGetFeedbackByIdV1Query(
        open && feedbackId != null ? { id: String(feedbackId) } : skipToken,
    );
    const feedbackInfo = feedbackData?.data;

    const status = feedbackInfo?.acceptStatus?.code ?? null;
    const history = feedbackInfo?.agreementHistory ?? [];

    const dialogMode = isCreateMode ? "create" : editing ? "edit" : "view";
    const readonly = !isCreateMode && !editing;

    const [createFeedback, { isLoading: isCreating }] = useFeedbackControllerCreateV1Mutation();
    const [updateFeedback, { isLoading: isUpdating }] = useFeedbackControllerUpdateV1Mutation();
    const [acceptFeedback, { isLoading: accepting }] = useFeedbackControllerAcceptV1Mutation();

    const {
        control,
        handleSubmit,
        reset,
        formState: { isValid, isSubmitting },
    } = useForm<FeedbackFormData>({
        resolver: zodResolver(FeedbackFormSchema),
        mode: "onChange",
        defaultValues: EMPTY_FORM,
    });

    const saving = isSubmitting || isCreating || isUpdating;
    const canSave = isValid && !saving;

    // Префилл / сброс. Полный префилл (включая источники и историю) заработает с getById.
    const initialPrefill = useRef(false);
    useEffect(() => {
        if (!open) {
            initialPrefill.current = false;
            setEditing(false);
            setRejectOpen(false);
            reset(EMPTY_FORM);
            return;
        }

        if (isCreateMode) {
            reset({ ...EMPTY_FORM, ftsFunctionDetailId: selectedFtsFunctionDetailId ?? Number.NaN });
            return;
        }

        if (feedbackInfo && !initialPrefill.current) {
            initialPrefill.current = true;
            reset({
                ftsFunctionDetailId: selectedFtsFunctionDetailId ?? Number.NaN,
                feedbackSourceIds: (feedbackInfo.feedbackSources ?? []).map((source) => source.type.id),
                feedbackQualityMetricsId: feedbackInfo.feedbackQualityMetrics
                    ? Number(feedbackInfo.feedbackQualityMetrics.id)
                    : Number.NaN,
                ftsMethodologyStatusId: feedbackInfo.ftsMethodologyStatus
                    ? Number(feedbackInfo.ftsMethodologyStatus.id)
                    : Number.NaN,
                problemDescription: feedbackInfo.problemDescription ?? "",
                initiatorRequisites: feedbackInfo.initiatorRequisites ?? "",
                initiatorAcceptance: feedbackInfo.initiatorAcceptance ?? "",
                deadline: feedbackInfo.deadline ? feedbackInfo.deadline.slice(0, 10) : "",
            });
        }
    }, [open, isCreateMode, feedbackInfo, selectedFtsFunctionDetailId, reset]);

    const handleCloseDialog = () => {
        if (saving) return;
        onClose();
    };

    const handleSave = handleSubmit(async (values) => {
        try {
            const deadline = values.deadline ? new Date(values.deadline).toISOString() : "";
            const payload = { ...values, deadline };

            if (isCreateMode) {
                await createFeedback({ createFeedbackDto: payload }).unwrap();
            } else if (feedbackId != null) {
                await updateFeedback({ id: String(feedbackId), updateFeedbackDto: payload }).unwrap();
            }
            onClose();
        } catch (error) {
            console.error("Не удалось сохранить обратную связь:", error);
        }
    });

    const handleAccept = async () => {
        if (feedbackId == null || acceptedStatusId == null) return;

        try {
            await acceptFeedback({
                id: String(feedbackId),
                acceptFeedbackDto: { acceptStatusId: acceptedStatusId },
            }).unwrap();
            onClose();
        } catch (error) {
            console.error("Не удалось согласовать обратную связь:", error);
        }
    };

    const handleRefill = () => setEditing(true);

    return (

        <Dialog
            open={open}
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

                {feedbackInfo && status && dialogMode === "view" && (
                    <StatusChip code={status} />
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
                        {
                            dialogMode === 'view'
                                ? renderReadonlyField(
                                    'Источник обратной связи', 
                                    feedbackInfo?.feedbackSources.map(({ type }) => type.name)
                                )
                                : (
                                    <>
                                        <InputLabel shrink sx={formLabelSx}>
                                            {"Источник обратной связи *"}
                                        </InputLabel>

                                        <Controller
                                            name="feedbackSourceIds"
                                            control={control}
                                            render={({ field }) => {
                                                const selectedValues = (field.value ?? []).map(String);

                                                return (
                                                    <Select
                                                        multiple
                                                        notched
                                                        value={selectedValues}
                                                        onChange={(event) => {
                                                            const value = event.target.value;
                                                            const arr = typeof value === "string" ? value.split(",") : value;
                                                            field.onChange(arr.map(Number));
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
                                                                {(selected as string[]).map((id) => (
                                                                    <Chip
                                                                        key={String(id)}
                                                                        variant="outlined"
                                                                        size="small"
                                                                        label={
                                                                            feedbackSourceOptions.find(
                                                                                (option) => String(option.value) === String(id),
                                                                            )?.label ?? String(id)
                                                                        }
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
                                                        label={"Источник обратной связи *"}
                                                        sx={{
                                                            ...formSelectSx,
                                                            "& .MuiSelect-select": {
                                                                display: "flex",
                                                                alignItems: "flex-start",
                                                                minHeight: 56,
                                                                py: 1.25,
                                                            },
                                                        }}
                                                        MenuProps={formMenuSx}
                                                    >
                                                        {feedbackSourceOptions.map((option) => {
                                                            const value = String(option.value);
                                                            const checked = selectedValues.includes(value);

                                                            return (
                                                                <MenuItem key={option.value} value={value}>
                                                                    <Checkbox size="small" checked={checked} sx={{ mr: 0.75 }} />

                                                                    <ListItemText
                                                                        primary={
                                                                            <Typography sx={{ fontSize: "0.8rem" }}>
                                                                                {option.label}
                                                                            </Typography>
                                                                        }
                                                                    />
                                                                </MenuItem>
                                                            );
                                                        })}
                                                    </Select>
                                                );
                                            }}
                                        />
                                    </>
                                )
                        }
                    </FormControl>
                </Box>

                {dialogMode === "view" ? (
                    renderReadonlyField(
                        "Метрики качества процесса в рамках обратной связи",
                        feedbackInfo?.feedbackQualityMetrics?.name,
                    )
                ) : (
                    <FormControl size="small" fullWidth disabled={readonly}>
                        <InputLabel sx={formLabelSx}>
                            {"Метрики качества процесса в рамках обратной связи *"}
                        </InputLabel>

                        <Controller
                            name="feedbackQualityMetricsId"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={Number.isNaN(field.value) ? "" : String(field.value)}
                                    onChange={(event) => field.onChange(Number(event.target.value))}
                                    onBlur={field.onBlur}
                                    label={"Метрики качества процесса в рамках обратной связи *"}
                                    sx={formSelectSx}
                                    MenuProps={formMenuSx}
                                >
                                    {qualityMetricOptions.map((option) => (
                                        <MenuItem key={option.value} value={String(option.value)}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )}
                        />
                    </FormControl>
                )}

                {dialogMode === "view" ? (
                    renderReadonlyField(
                        "Описание проблемы с указанием источника, метрики, способа решения",
                        feedbackInfo?.problemDescription,
                    )
                ) : (
                    <Controller
                        name="problemDescription"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                value={field.value ?? ""}
                                label={"Описание проблемы с указанием источника, метрики, способа решения *"}
                                multiline
                                rows={3}
                                fullWidth
                                size="small"
                                disabled={readonly}
                                sx={formInputSx}
                            />
                        )}
                    />
                )}

                {dialogMode === "view" ? (
                    renderReadonlyField("Реквизиты автора инициативы", feedbackInfo?.initiatorRequisites)
                ) : (
                    <Controller
                        name="initiatorRequisites"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                value={field.value ?? ""}
                                label={"Реквизиты автора инициативы *"}
                                multiline
                                rows={2}
                                fullWidth
                                size="small"
                                disabled={readonly}
                                sx={formInputSx}
                            />
                        )}
                    />
                )}

                {dialogMode === "view" ? (
                    renderReadonlyField(
                        "Методология позиции ЦА ФНС России",
                        feedbackInfo?.ftsMethodologyStatus?.name,
                    )
                ) : (
                    <FormControl size="small" fullWidth disabled={readonly}>
                        <InputLabel sx={formLabelSx}>
                            {"Методология позиции ЦА ФНС России *"}
                        </InputLabel>

                        <Controller
                            name="ftsMethodologyStatusId"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={Number.isNaN(field.value) ? "" : String(field.value)}
                                    onChange={(event) => field.onChange(Number(event.target.value))}
                                    onBlur={field.onBlur}
                                    label={"Методология позиции ЦА ФНС России *"}
                                    sx={formSelectSx}
                                    MenuProps={formMenuSx}
                                >
                                    {methodologyStatusOptions.map((option) => (
                                        <MenuItem key={option.value} value={String(option.value)}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )}
                        />
                    </FormControl>
                )}

                {dialogMode === "view" ? (
                    renderReadonlyField("Срок реализации доработки", formatDate(feedbackInfo?.deadline))
                ) : (
                    <Controller
                        name="deadline"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                value={field.value ?? ""}
                                label={"Срок реализации доработки *"}
                                type="date"
                                fullWidth
                                size="small"
                                disabled={readonly}
                                sx={formInputSx}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        )}
                    />
                )}

                {dialogMode === "view" ? (
                    renderReadonlyField("Акцепт автора инициативы", feedbackInfo?.initiatorAcceptance)
                ) : (
                    <Controller
                        name="initiatorAcceptance"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                value={field.value ?? ""}
                                label={"Акцепт автора инициативы *"}
                                multiline
                                rows={2}
                                fullWidth
                                size="small"
                                disabled={readonly}
                                sx={formInputSx}
                            />
                        )}
                    />
                )}

                {feedbackInfo && dialogMode === "view" && (
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
                                    {history.map((item, index) => (
                                        <Box key={index}>
                                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                                <StatusIcon code={item.acceptStatus.code} />

                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography
                                                        sx={{
                                                            color: c.textBody,
                                                            fontSize: "0.76rem",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {getApiStatusLabel(item.acceptStatus.code)}
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
                        disabled={!canSave}
                        onClick={() => void handleSave()}
                        sx={{ textTransform: "none" }}
                    >
                        {saving ? "Сохранение..." : "Сохранить"}
                    </Button>
                )}

                {dialogMode === "view" && feedbackInfo && status === "PENDING" && (
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

                {dialogMode === "view" && feedbackInfo && status === "REJECTED" && (
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

            {feedbackId != null && rejectedStatusId != null && (
                <FeedbackRejectFormModal
                    feedbackId={feedbackId}
                    rejectStatusId={rejectedStatusId}
                    open={rejectOpen}
                    onClose={() => setRejectOpen(false)}
                />
            )}
        </Dialog>
    )
}

export default FeedbackCardModal;

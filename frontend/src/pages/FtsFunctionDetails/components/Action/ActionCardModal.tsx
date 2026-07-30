import { Box, Button, Dialog, DialogActions, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import { Add, Close, DragIndicator, Edit, EditOff, FeedbackOutlined, Save } from "@mui/icons-material";
import { useActionControllerCreateV1Mutation, useActionControllerGetActionByIdV1Query, useActionControllerReorderActionsFeedbacksV1Mutation, useActionControllerUpdateV1Mutation, useConstantControllerGetTypesV1Query } from "../../../../store/ftsFunctionRegistry";
import { skipToken } from "@reduxjs/toolkit/query";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useController, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFormSchema, type ActionFormData, type ActionsFeedbackFormData } from "./schema";
import { createOtionsFromTypes } from "../../../../utils/create-options";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionDetailId } from "../../../../store/uiSlice";
import ActionsFeedbackForm from "./ActionsFeedbackForm";



const EMPTY_ACTIONS_FORM: ActionFormData = {
    ftsFunctionDetailId: Number.NaN,
    statusId: Number.NaN,
    description: '',
};


// Формат срока — по примеру из Feedbacks.tsx.
function formatDate(value: string | null | undefined): string {
    if (!value) return "Не указан";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("ru-RU");
}


type ActionCardModalProps = {
    actionId?: number | null;
    open: boolean;
    onClose: () => void;
};


export function ActionCardModal({ actionId, open, onClose }: ActionCardModalProps) {
    const theme = useTheme();
    const c = theme.custom;

    const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);

    const isCreateMode = actionId == null;

    const initialFormData = useRef<ActionFormData | null>(null);

    const { currentData: actonData } = useActionControllerGetActionByIdV1Query(
        open && !isCreateMode ? { id: String(actionId) } : skipToken,
    );
    const actionInfo = useMemo(() => actonData?.data, [actonData]);

    // Список обратных связей операции (после регенерации клиента у каждой ОС есть id).
    const feedbacks = useMemo(() => actionInfo?.feedbacks ?? [], [actionInfo]);

    // Начальные данные конкретной ОС для формы (типы из schema.ts) — без повторного getActionById.
    const buildFeedbackInitial = (fb: (typeof feedbacks)[number]): Partial<ActionsFeedbackFormData> => ({
        feedbackSourceIds: (fb.feedbackSources ?? []).map((source) => source.type.id),
        feedbackQualityMetricsId: fb.feedbackQualityMetrics?.id,
        ftsMethodologyStatusId: fb.ftsMethodologyStatus?.id,
        problemDescription: fb.problemDescription ?? undefined,
        initiatorRequisites: fb.initiatorRequisites ?? undefined,
        initiatorAcceptance: fb.initiatorAcceptance ?? undefined,
        deadline: fb.deadline ?? undefined,
    });


    const { data: actionStatus } = useConstantControllerGetTypesV1Query({ categories: ['ACTION_STATUS'] });
    const { data: priorityAction } = useConstantControllerGetTypesV1Query({ categories: ['PRIORITY_ACTION'] });
    const { data: characterAction } = useConstantControllerGetTypesV1Query({ categories: ['CHARACTER_ACTION'] });
    const { data: personPerformingAction } = useConstantControllerGetTypesV1Query({ categories: ['PERSON_PERFORMING_ACTION'] });

    const actionStatusOptions = useMemo(() => createOtionsFromTypes(actionStatus), [actionStatus]);
    const priorityActionOptions = useMemo(() => createOtionsFromTypes(priorityAction), [priorityAction]);
    const characterActionOptions = useMemo(() => createOtionsFromTypes(characterAction), [characterAction]);
    const personPerformingActionOptions = useMemo(() => createOtionsFromTypes(personPerformingAction), [personPerformingAction]);

    const [createAction, { isLoading: isCreatingAction }] = useActionControllerCreateV1Mutation();
    const [updateAction, { isLoading: isUpdatingAction }] = useActionControllerUpdateV1Mutation();

    const {
        control,
        handleSubmit,
        reset,
        formState: { isValid, isSubmitting },
    } = useForm<ActionFormData>({
        resolver: zodResolver(ActionFormSchema),
        mode: "onChange",
        defaultValues: EMPTY_ACTIONS_FORM,
    });

    const [editingExisting, setEditingExisting] = useState(false);
    const [addingFeedback, setAddingFeedback] = useState(false);
    const [expandedFeedbackId, setExpandedFeedbackId] = useState<number | null>(null);

    const [reorderFeedbacks] = useActionControllerReorderActionsFeedbacksV1Mutation();

    // ===== Перетаскивание ОС строго по вертикали (обновляет порядок через API) =====
    const [feedbackItems, setFeedbackItems] = useState(feedbacks);
    useEffect(() => { setFeedbackItems(feedbacks); }, [feedbacks]);

    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [dragOffsetY, setDragOffsetY] = useState(0);
    const [dropBeforeId, setDropBeforeId] = useState<number | "end" | null>(null);

    const rowRefs = useRef<Map<number, HTMLElement>>(new Map());
    const dragRef = useRef<{ id: number; pointerStartY: number } | null>(null);

    const setRowRef = (id: number) => (element: HTMLElement | null) => {
        if (element) rowRefs.current.set(id, element);
        else rowRefs.current.delete(id);
    };

    const commitFeedbackOrder = async (ordered: typeof feedbackItems) => {
        if (actionId == null) return;

        const orderedIds = ordered.map((item) => Number(item.id));
        const serverIds = feedbacks.map((item) => Number(item.id));
        const changed =
            orderedIds.length === serverIds.length &&
            orderedIds.some((id, index) => id !== serverIds[index]);

        if (!changed) return;

        try {
            await reorderFeedbacks({ actionId, reorderActionsDto: { orderedIds } }).unwrap();
        } catch (error) {
            setFeedbackItems(feedbacks);
            console.error("Не удалось обновить порядок обратной связи:", error);
        }
    };

    useEffect(() => {
        const computeInsert = (clientY: number, draggedId: number) => {
            const others = feedbackItems.filter((item) => Number(item.id) !== draggedId);
            let insertAt = 0;
            for (const item of others) {
                const element = rowRefs.current.get(Number(item.id));
                if (!element) { insertAt += 1; continue; }
                const rect = element.getBoundingClientRect();
                if (clientY > rect.top + rect.height / 2) insertAt += 1;
                else break;
            }
            return { others, insertAt };
        };

        const handleMove = (event: MouseEvent) => {
            const drag = dragRef.current;
            if (!drag) return;
            setDragOffsetY(event.clientY - drag.pointerStartY);
            const { others, insertAt } = computeInsert(event.clientY, drag.id);
            setDropBeforeId(insertAt < others.length ? Number(others[insertAt].id) : "end");
        };

        const handleUp = (event: MouseEvent) => {
            const drag = dragRef.current;
            if (!drag) return;
            const dragged = feedbackItems.find((item) => Number(item.id) === drag.id);
            if (dragged) {
                const { others, insertAt } = computeInsert(event.clientY, drag.id);
                const next = [...others.slice(0, insertAt), dragged, ...others.slice(insertAt)];
                setFeedbackItems(next);
                void commitFeedbackOrder(next);
            }
            dragRef.current = null;
            setDraggingId(null);
            setDragOffsetY(0);
            setDropBeforeId(null);
            document.body.style.userSelect = "";
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [feedbackItems, feedbacks, actionId]);

    const saving = isSubmitting || isCreatingAction || isUpdatingAction;
    const isEditable = isCreateMode || editingExisting;

    // «Иное лицо» — как в StepTabBody: показываем только при OTHER_PERSON,
    // очищаем при выборе другого лица и фокусируем при переходе на OTHER_PERSON.
    const personPerformingActionId = useWatch({ control, name: "personPerformingActionId" });
    const personPerformingActionCode = useMemo(
        () => personPerformingActionOptions.find(({ value }) => value === personPerformingActionId)?.code,
        [personPerformingActionId, personPerformingActionOptions],
    );
    const { field: otherPersonField } = useController({ control, name: "otherPersonPerformingAction" });
    const otherPersonInputRef = useRef<HTMLInputElement>(null);
    const otherPersonDidMountRef = useRef(false);

    // «Иное лицо» обязательно только когда выбран OTHER_PERSON.
    const otherPersonValid =
        personPerformingActionCode !== "OTHER_PERSON" || Boolean((otherPersonField.value ?? "").trim());

    const canSaveAction = isValid && otherPersonValid && !saving;

    useEffect(() => {
        if (!otherPersonDidMountRef.current) {
            otherPersonDidMountRef.current = true;
            return;
        }

        if (personPerformingActionCode === "OTHER_PERSON") {
            otherPersonInputRef.current?.focus();
        } else if (otherPersonField.value) {
            otherPersonField.onChange("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personPerformingActionCode]);


    // Префилл формы операции при редактировании / сброс при закрытии.
    useEffect(() => {
        if (!open) {
            initialFormData.current = null;
            setEditingExisting(false);
            setAddingFeedback(false);
            setExpandedFeedbackId(null);
            reset(EMPTY_ACTIONS_FORM);
            return;
        }

        if (isCreateMode) {
            reset({
                ...EMPTY_ACTIONS_FORM,
                ftsFunctionDetailId: selectedFtsFunctionDetailId ?? Number.NaN,
            });
            return;
        }

        if (actionInfo && initialFormData.current === null) {
            const data: ActionFormData = {
                ftsFunctionDetailId: selectedFtsFunctionDetailId ?? Number.NaN,
                statusId: Number(actionInfo.status.id),
                description: actionInfo.description,
                priorityActionId: actionInfo.priorityAction
                    ? Number(actionInfo.priorityAction.id)
                    : undefined,
                characterActionId: actionInfo.characterAction
                    ? Number(actionInfo.characterAction.id)
                    : undefined,
                personPerformingActionId: actionInfo.personPerformingAction
                    ? Number(actionInfo.personPerformingAction.id)
                    : undefined,
                otherPersonPerformingAction: actionInfo.otherPersonPerformingAction ?? undefined,
            };
            initialFormData.current = data;
            reset(data);
        }
    }, [open, isCreateMode, actionInfo, selectedFtsFunctionDetailId, reset]);


    const handleCloseDialog = () => {
        if (saving) return;
        onClose();
    };

    const handleCancelEdit = () => {
        if (saving) return;
        if (initialFormData.current) {
            reset(initialFormData.current);
        }
        setEditingExisting(false);
    };

    const handleCreate = handleSubmit(async (values) => {
        try {
            await createAction({ createActionDto: values }).unwrap();
            onClose();
        } catch (error) {
            console.error("Не удалось создать операцию:", error);
        }
    });

    const handleUpdateAction = handleSubmit(async (values) => {
        if (actionId == null) return;

        try {
            await updateAction({
                id: String(actionId),
                updateActionDto: {
                    statusId: values.statusId,
                    priorityActionId: values.priorityActionId,
                    characterActionId: values.characterActionId,
                    personPerformingActionId: values.personPerformingActionId,
                    otherPersonPerformingAction: values.otherPersonPerformingAction,
                    description: values.description,
                },
            }).unwrap();
            setEditingExisting(false);
            // onClose();
        } catch (error) {
            console.error("Не удалось обновить операцию:", error);
        }
    });


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

    return (

        <Dialog
            open={open}
            onClose={handleCloseDialog}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: c.bgSurface,
                        color: c.textBody,
                        border: `1px solid ${c.borderMain}`,
                    },
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
                            >
                                <Edit sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {!isCreateMode && editingExisting && (
                        <Tooltip title="Отменить редактирование">
                            <IconButton
                                size="small"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                sx={{ color: c.textMuted }}
                            >
                                <EditOff sx={{ fontSize: 18 }} />
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
                {!isEditable ? (
                    renderReadonlyField("Описание операции", actionInfo?.description)
                ) : (
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Описание операции *"
                                disabled={!isEditable || saving}
                                multiline
                                rows={4}
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
                            />
                        )}
                    />
                )}

                {!isEditable ? (
                    renderReadonlyField("Статус операции", actionInfo?.status?.name)
                ) : (
                    <FormControl size="small" fullWidth disabled={!isEditable || saving}>
                    <InputLabel
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.72rem",
                            "&.Mui-focused": { color: theme.palette.primary.main },
                        }}
                    >
                        {"Статус операции *"}
                    </InputLabel>

                    <Controller
                        name="statusId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={Number.isNaN(field.value) ? "" : String(field.value)}
                                label="Статус операции *"
                                onChange={(event) => field.onChange(Number(event.target.value))}
                                onBlur={field.onBlur}
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
                            >
                                {actionStatusOptions.map((status) => (
                                    <MenuItem
                                        key={status.value}
                                        value={String(status.value)}
                                        sx={{ fontSize: "0.78rem" }}
                                    >
                                        {status.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    />
                    </FormControl>
                )}

                {!isEditable ? (
                    renderReadonlyField("Приоритет выполнения операции", actionInfo?.priorityAction?.name)
                ) : (
                    <FormControl size="small" fullWidth disabled={!isEditable || saving}>
                    <InputLabel
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.72rem",
                            "&.Mui-focused": { color: theme.palette.primary.main },
                        }}
                    >
                        {"Приоритет выполнения операции"}
                    </InputLabel>

                    <Controller
                        name="priorityActionId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={Number.isNaN(field.value) ? "" : String(field.value)}
                                label="Приоритет выполнения операции"
                                onChange={(event) => field.onChange(Number(event.target.value))}
                                onBlur={field.onBlur}
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
                            >
                                {priorityActionOptions.map((status) => (
                                    <MenuItem
                                        key={status.value}
                                        value={String(status.value)}
                                        sx={{ fontSize: "0.78rem" }}
                                    >
                                        {status.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    />
                    </FormControl>
                )}

                {!isEditable ? (
                    renderReadonlyField("Характер операции", actionInfo?.characterAction?.name)
                ) : (
                    <FormControl size="small" fullWidth disabled={!isEditable || saving}>
                    <InputLabel
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.72rem",
                            "&.Mui-focused": { color: theme.palette.primary.main },
                        }}
                    >
                        {"Характер операции"}
                    </InputLabel>

                    <Controller
                        name="characterActionId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={Number.isNaN(field.value) ? "" : String(field.value)}
                                label="Характер операции"
                                onChange={(event) => field.onChange(Number(event.target.value))}
                                onBlur={field.onBlur}
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
                            >
                                {characterActionOptions.map((status) => (
                                    <MenuItem
                                        key={status.value}
                                        value={String(status.value)}
                                        sx={{ fontSize: "0.78rem" }}
                                    >
                                        {status.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    />
                    </FormControl>
                )}

                {!isEditable ? (
                    renderReadonlyField("Лицо, выполняющее действие", actionInfo?.personPerformingAction?.name)
                ) : (
                    <FormControl size="small" fullWidth disabled={!isEditable || saving}>
                    <InputLabel
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.72rem",
                            "&.Mui-focused": { color: theme.palette.primary.main },
                        }}
                    >
                        {"Лицо, выполняющее действие"}
                    </InputLabel>

                    <Controller
                        name="personPerformingActionId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={Number.isNaN(field.value) ? "" : String(field.value)}
                                label="Лицо, выполняющее действие"
                                onChange={(event) => field.onChange(Number(event.target.value))}
                                onBlur={field.onBlur}
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
                            >
                                {personPerformingActionOptions.map((status) => (
                                    <MenuItem
                                        key={status.value}
                                        value={String(status.value)}
                                        sx={{ fontSize: "0.78rem" }}
                                    >
                                        {status.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    />

                    </FormControl>
                )}

                {personPerformingActionCode === "OTHER_PERSON" && (
                    !isEditable ? (
                        renderReadonlyField("Иное лицо, выполняющее действие", actionInfo?.otherPersonPerformingAction)
                    ) : (
                        <TextField
                            value={otherPersonField.value ?? ""}
                            onChange={(event) => otherPersonField.onChange(event.target.value)}
                            onBlur={otherPersonField.onBlur}
                            inputRef={otherPersonInputRef}
                            label="Иное лицо, выполняющее действие"
                            disabled={!isEditable || saving}
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
                        />
                    )
                )}

                {!isCreateMode && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <FeedbackOutlined sx={{ fontSize: 16, color: c.accentBlue }} />
                                <Typography sx={{ color: c.textPrimary, fontSize: "0.82rem", fontWeight: 700 }}>
                                    {`Обратная связь (${feedbacks.length})`}
                                </Typography>
                            </Box>

                            <Button
                                size="small"
                                startIcon={addingFeedback ? <Close sx={{ fontSize: 16 }} /> : <Add sx={{ fontSize: 16 }} />}
                                onClick={() => {
                                    if (addingFeedback) {
                                        setAddingFeedback(false);
                                    } else {
                                        setExpandedFeedbackId(null);
                                        setAddingFeedback(true);
                                    }
                                }}
                                sx={{
                                    textTransform: "none",
                                    fontSize: "0.74rem",
                                    color: addingFeedback ? c.textSecondary : c.accentBlue,
                                }}
                            >
                                {addingFeedback ? "Отмена" : "Добавить"}
                            </Button>
                        </Box>

                        {addingFeedback && (
                            <ActionsFeedbackForm
                                actionId={actionId}
                                feedbackId={null}
                                open={open}
                                onClose={() => setAddingFeedback(false)}
                            />
                        )}

                        {feedbackItems.map((fb, index) => {
                            const id = Number(fb.id);
                            const expanded = expandedFeedbackId === id;
                            const summary = fb.problemDescription || fb.problemDescription || "Обратная связь";

                            return (
                                <Fragment key={id}>
                                    {draggingId !== null && dropBeforeId === id && (
                                        <Box sx={{ height: 3, borderRadius: 1, bgcolor: theme.palette.primary.main }} />
                                    )}

                                    <Paper
                                        ref={setRowRef(id)}
                                        elevation={0}
                                        sx={{
                                            position: "relative",
                                            border: `1px solid ${c.borderMain}`,
                                            bgcolor: c.bgPaper,
                                            borderRadius: 2,
                                            transform: draggingId === id ? `translateY(${dragOffsetY}px)` : undefined,
                                            transition: draggingId === id ? "none" : "0.15s ease",
                                            zIndex: draggingId === id ? 2 : "auto",
                                            boxShadow: draggingId === id ? 6 : "none",
                                        }}
                                    >
                                        <Box
                                            onClick={() => { setAddingFeedback(false); setExpandedFeedbackId(expanded ? null : id); }}
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 0.25,
                                                minWidth: 0,
                                                px: 1.25,
                                                py: 0.75,
                                                pr: 4,
                                                cursor: "pointer",
                                                "&:hover": { bgcolor: c.hoverOverlay },
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    color: c.textBody,
                                                    fontSize: "0.76rem",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >

                                                <Typography sx={{ color: c.textPrimary, fontSize: "0.8rem", fontWeight: 700 }}>
                                                    {`Обратная связь ${index + 1}`}
                                                </Typography>
                                                {summary}
                                            </Typography>

                                            {(fb.ftsMethodologyStatus || fb.deadline) && (
                                                <Typography
                                                    sx={{
                                                        color: c.textMuted,
                                                        fontSize: "0.66rem",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {[
                                                        fb.ftsMethodologyStatus?.name,
                                                        fb.deadline ? `Срок: ${formatDate(fb.deadline)}` : null,
                                                    ].filter(Boolean).join(" · ")}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Tooltip title="Перетащите, чтобы изменить порядок">
                                            <Box
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    dragRef.current = { id, pointerStartY: event.clientY };
                                                    setDraggingId(id);
                                                    setDragOffsetY(0);
                                                    document.body.style.userSelect = "none";
                                                }}
                                                onClick={(event) => event.stopPropagation()}
                                                sx={{
                                                    position: "absolute",
                                                    right: 2,
                                                    top: 6,
                                                    p: 0.25,
                                                    display: "flex",
                                                    color: c.textMuted,
                                                    cursor: "grab",
                                                    opacity: 0.5,
                                                    "&:hover": { opacity: 1 },
                                                    "&:active": { cursor: "grabbing" },
                                                }}
                                            >
                                                <DragIndicator sx={{ fontSize: 18 }} />
                                            </Box>
                                        </Tooltip>

                                        {expanded && (
                                            <Box sx={{ px: 1.25, pb: 1.25 }} onClick={(event) => event.stopPropagation()}>
                                                <ActionsFeedbackForm
                                                    actionId={actionId}
                                                    feedbackId={id}
                                                    open={open}
                                                    onClose={() => setExpandedFeedbackId(null)}
                                                    initialFeedback={buildFeedbackInitial(fb)}
                                                />
                                            </Box>
                                        )}
                                    </Paper>
                                </Fragment>
                            );
                        })}

                        {draggingId !== null && dropBeforeId === "end" && (
                            <Box sx={{ height: 3, borderRadius: 1, bgcolor: theme.palette.primary.main }} />
                        )}
                    </Box>
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
                    >
                        {saving ? "Сохранение..." : "Сохранить"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

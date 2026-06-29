import { Box, Button, Dialog, DialogActions, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, TextField, Tooltip, useTheme } from "@mui/material";
import { Close, Edit, FeedbackOutlined, Save } from "@mui/icons-material";
import { useActionControllerCreateV1Mutation, useActionControllerGetActionByIdV1Query, useActionControllerUpdateV1Mutation, useConstantControllerGetTypesV1Query } from "../../../../store/ftsFunctionRegistry";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFormSchema, type ActionFormData, type ActionsFeedbackFormData } from "./schema";
import { createOtionsFromTypes } from "../../../../utils/create-options";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionDetailId } from "../../../../store/uiSlice";
import ActionsFeedbackForm from "./ActionsFeedbackForm";



const EMPTY_ACTIONS_FORM: ActionFormData = {
    ftsFunctionDetailId: Number.NaN,
    statusId: Number.NaN,
    priorityActionId: Number.NaN,
    description: '',
};


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

    const { data: actonData } = useActionControllerGetActionByIdV1Query(
        open && !isCreateMode ? { id: String(actionId) } : skipToken,
    );
    const actionInfo = useMemo(() => actonData?.data, [actonData]);

    // Данные обратной связи для ActionsFeedbackForm — собираем из уже загруженной операции
    // (типы из schema.ts), чтобы не вызывать getActionById повторно в дочернем компоненте.
    const feedbackInitial = useMemo<Partial<ActionsFeedbackFormData> | undefined>(() => {
        if (!actionInfo) return undefined;

        return {
            feedbackSourceIds: (actionInfo.feedbackSources ?? []).map((source) => source.type.id),
            feedbackQualityMetricsId: actionInfo.feedbackQualityMetrics?.id,
            ftsMethodologyStatusId: actionInfo.ftsMethodologyStatus?.id,
            priorityActionId: actionInfo.priorityAction?.id,
            problemDescription: actionInfo.problemDescription ?? undefined,
            initiatorRequisites: actionInfo.initiatorRequisites ?? undefined,
            initiatorAcceptance: actionInfo.initiatorAcceptance ?? undefined,
            deadline: actionInfo.deadline ? actionInfo.deadline : undefined,
        };
    }, [actionInfo]);


    const { data: actionStatus } = useConstantControllerGetTypesV1Query({ categories: ['ACTION_STATUS'] });
    const { data: priorityAction } = useConstantControllerGetTypesV1Query({ categories: ['PRIORITY_ACTION'] });

    const actionStatusOptions = useMemo(() => createOtionsFromTypes(actionStatus), [actionStatus]);
    const priorityActionOptions = useMemo(() => createOtionsFromTypes(priorityAction), [priorityAction]);
    
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
    const [feedbackVisible, setFeedbackVisible] = useState(false);

    const saving = isSubmitting || isCreatingAction || isUpdatingAction;
    const isEditable = isCreateMode || editingExisting;
    const canSaveAction = isValid && !saving;


    // Префилл формы операции при редактировании / сброс при закрытии.
    useEffect(() => {
        if (!open) {
            initialFormData.current = null;
            setEditingExisting(false);
            setFeedbackVisible(false);
            reset(EMPTY_ACTIONS_FORM);
            return;
        }

        if (isCreateMode) {
            reset({
                ftsFunctionDetailId: selectedFtsFunctionDetailId ?? Number.NaN,
                statusId: Number.NaN,
                description: "",
            });
            return;
        }

        if (actionInfo && initialFormData.current === null) {
            const data: ActionFormData = {
                ftsFunctionDetailId: selectedFtsFunctionDetailId ?? Number.NaN,
                statusId: Number(actionInfo.status.id),
                priorityActionId: actionInfo.priorityAction
                    ? Number(actionInfo.priorityAction.id)
                    : Number.NaN,
                description: actionInfo.description,
            };
            initialFormData.current = data;
            reset(data);
        }
    }, [open, isCreateMode, actionInfo, selectedFtsFunctionDetailId, reset]);


    const handleCloseDialog = () => {
        if (saving) return;
        onClose();
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
                    description: values.description,
                },
            }).unwrap();
            setEditingExisting(false);
            onClose();
        } catch (error) {
            console.error("Не удалось обновить операцию:", error);
        }
    });


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

                <FormControl size="small" fullWidth disabled={!isEditable || saving}>
                    <InputLabel
                        sx={{
                            color: c.textMuted,
                            fontSize: "0.72rem",
                            "&.Mui-focused": { color: theme.palette.primary.main },
                        }}
                    >
                        {"Приоритет выполнения операции *"}
                    </InputLabel>

                    <Controller
                        name="priorityActionId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={Number.isNaN(field.value) ? "" : String(field.value)}
                                label="Приоритет выполнения операции *"
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

                {!isCreateMode && feedbackVisible && (
                    <ActionsFeedbackForm
                        actionId={actionId}
                        open={open}
                        onClose={() => setFeedbackVisible(false)}
                        initialFeedback={feedbackInitial}
                    />
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

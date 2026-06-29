import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Add, DeleteOutlined, DragIndicator, Edit, ExpandLess, ExpandMore, FeedbackOutlined, Save } from "@mui/icons-material";
import { Box, Button, Chip, IconButton, Paper, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import { useActionControllerGetAllActionsV1Query, useActionControllerGetGeneralInfoActionsV1Query, useActionControllerReorderActionsV1Mutation, useActionControllerUpdateGeneralInfoActionsV1Mutation } from "../../../../store/ftsFunctionRegistry";
import { ActionDeleteFormModal } from "./ActionDeleteFormModal";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionDetailId } from "../../../../store/uiSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { ActionCardModal } from "./ActionCardModal";



export function Actions() {
  const theme = useTheme();
  const c = theme.custom;

  const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);

  const [openGeneralInfoActions, setOpenGeneralInfoActions] = useState<boolean>(false);
  const [deletebleActionId, setDeletebleActionId] = useState<number | null>(null);
  const [openActionCard, setOpenActionCard] = useState<boolean>(false);
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null);

  const { data: generalInfoActionsData } = useActionControllerGetGeneralInfoActionsV1Query(
    selectedFtsFunctionDetailId ? { ftsFunctionDetailId: selectedFtsFunctionDetailId } : skipToken,
    {
      pollingInterval: 0,
      skipPollingIfUnfocused: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const { data: actionsData } = useActionControllerGetAllActionsV1Query(
    selectedFtsFunctionDetailId ? { ftsFunctionDetailId: selectedFtsFunctionDetailId } : skipToken,
    {
      pollingInterval: 0,
      skipPollingIfUnfocused: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [reorderActions] = useActionControllerReorderActionsV1Mutation();

  const generalInfoActions = useMemo(() => generalInfoActionsData?.data, [generalInfoActionsData]);
  const actions = useMemo(() => actionsData?.data ?? [], [actionsData]);

  // ===== Перетаскивание блоков операций строго по вертикали (обновляет order через API) =====
  // Локальная копия для перестановки. После инвалидации тега списка getAllActions вернёт
  // отсортированный массив, и items пересинхронизируется этим эффектом.
  const [items, setItems] = useState(actions);
  useEffect(() => {
    setItems(actions);
  }, [actions]);

  // id перетаскиваемого блока и его вертикальное смещение в px (по X блок зафиксирован).
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  // Куда вставится блок: id блока, ПЕРЕД которым появится индикатор, или "end" (в конец).
  const [dropBeforeId, setDropBeforeId] = useState<number | "end" | null>(null);

  const rowRefs = useRef<Map<number, HTMLElement>>(new Map());
  const dragRef = useRef<{ id: number; pointerStartY: number } | null>(null);

  const setRowRef = (id: number) => (element: HTMLElement | null) => {
    if (element) rowRefs.current.set(id, element);
    else rowRefs.current.delete(id);
  };

  // TODO(API): подключить сгенерированный хук мутации обновления порядка, например:
  // const [reorderActions] = useActionControllerReorderV1Mutation();

  const commitOrder = async (ordered: typeof items) => {
    if (!selectedFtsFunctionDetailId) return;

    const orderedIds = ordered.map((item) => Number(item.id));
    const serverIds = actions.map((item) => Number(item.id));
    const changed =
      orderedIds.length === serverIds.length &&
      orderedIds.some((id, index) => id !== serverIds[index]);

    if (!changed) return;

    try {
      // При инвалидации тега "Action" запрос getAllActions вернёт отсортированный
      // массив, и items пересинхронизируется эффектом выше.
      await reorderActions({
        ftsFunctionDetailId: selectedFtsFunctionDetailId,
        reorderActionsDto: { orderedIds },
      }).unwrap();
    } catch (error) {
      // Откат к серверному порядку при ошибке.
      setItems(actions);
      console.error("Не удалось обновить порядок операций:", error);
    }
  };

  // Слушатели перемещения/отпускания мыши: двигаем только по вертикали, на отпускании
  // вычисляем новую позицию по серединам соседних блоков и коммитим порядок.
  useEffect(() => {
    // Позиция вставки по курсору: список без перетаскиваемого блока + индекс вставки.
    const computeInsert = (clientY: number, draggedId: number) => {
      const others = items.filter((item) => Number(item.id) !== draggedId);

      let insertAt = 0;
      for (const item of others) {
        const element = rowRefs.current.get(Number(item.id));
        if (!element) {
          insertAt += 1;
          continue;
        }
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

      const dragged = items.find((item) => Number(item.id) === drag.id);

      if (dragged) {
        const { others, insertAt } = computeInsert(event.clientY, drag.id);

        const next = [
          ...others.slice(0, insertAt),
          dragged,
          ...others.slice(insertAt),
        ];

        setItems(next);
        void commitOrder(next);
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
  }, [items, actions, selectedFtsFunctionDetailId]);

  // Форма «Вход» / «Выход» (общие сведения о действиях).
  const [actionsInput, setActionsInput] = useState("");
  const [actionsOutput, setActionsOutput] = useState("");
  const [editingGeneralInfo, setEditingGeneralInfo] = useState(false);

  useEffect(() => {
    setActionsInput(generalInfoActions?.actionsInput ?? "");
    setActionsOutput(generalInfoActions?.actionsOutput ?? "");
  }, [generalInfoActions]);

  const [updateGeneralInfoActions, { isLoading: isSavingGeneralInfo }] =
    useActionControllerUpdateGeneralInfoActionsV1Mutation();

  const handleSaveGeneralInfo = async () => {
    if (!selectedFtsFunctionDetailId) return;

    try {
      await updateGeneralInfoActions({
        ftsFunctionDetailId: selectedFtsFunctionDetailId,
        updateGeneralInfoActionsDto: {
          actionsInput,
          actionsOutput,
        },
      }).unwrap();
      setEditingGeneralInfo(false);
    } catch (error) {
      console.error("Не удалось сохранить общие сведения о действиях:", error);
    }
  };

  // Отмена редактирования — возвращаем поля к исходным значениям.
  const handleCancelGeneralInfo = () => {
    setActionsInput(generalInfoActions?.actionsInput ?? "");
    setActionsOutput(generalInfoActions?.actionsOutput ?? "");
    setEditingGeneralInfo(false);
  };

  const content = useMemo(() => {
    if (items.length === 0) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: `1px dashed ${c.borderMain}`,
            bgcolor: c.hoverOverlay,
            borderRadius: 2,
            color: c.textMuted,
            fontSize: "0.78rem",
            textAlign: "center",
          }}
        >
          Операции пока не добавлены.
        </Paper>
      );
    }

    return (
      <>
        {items.map((action, index) => (
          <Fragment key={String(action.id)}>
            {draggingId !== null && dropBeforeId === Number(action.id) && (
              <Box
                sx={{
                  height: 3,
                  borderRadius: 1,
                  bgcolor: theme.palette.primary.main,
                  position: "relative",
                  zIndex: 5,
                }}
                data-testid="action-drop-indicator"
              />
            )}

            <Paper
              ref={setRowRef(Number(action.id))}
              elevation={0}
              onClick={() => {
                setSelectedActionId(Number(action.id));
                setOpenActionCard(true);
              }}
              sx={{
                position: "relative",
                p: 1.25,
                pb: 3,
                border: `1px solid ${c.borderMain}`,
                bgcolor: c.bgPaper,
                borderRadius: 2,
                cursor: "pointer",
                transform:
                  draggingId === Number(action.id)
                    ? `translateY(${dragOffsetY}px)`
                    : undefined,
                transition: draggingId === Number(action.id) ? "none" : "0.15s ease",
                zIndex: draggingId === Number(action.id) ? 2 : "auto",
                boxShadow: draggingId === Number(action.id) ? 6 : "none",
                "&:hover": { bgcolor: c.hoverOverlay, borderColor: c.borderHover },
              }}
              data-testid={`action-card-${action.id}`}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: c.textPrimary, fontSize: "0.8rem", fontWeight: 700 }}>
                    {`Операция ${index + 1}`}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {action.feedbackQualityMetricsId && (
                    <Tooltip title="Есть обратная связь">
                      <FeedbackOutlined sx={{ fontSize: 16, color: c.accentBlue, opacity: 0.8 }} />
                    </Tooltip>
                  )}

                  <Chip
                    label={action.status.name}
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

                  <Tooltip title="Удалить операцию">
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeletebleActionId(Number(action.id));
                        }}
                        sx={{
                          p: 0.25,
                          width: 22,
                          height: 22,
                          color: c.textMuted,
                          flexShrink: 0,
                          "&:hover": {
                            color: theme.palette.error.main,
                            bgcolor: "transparent",
                            opacity: 1,
                          },
                        }}
                        data-testid={`button-delete-action-${action.id}`}
                      >
                        <DeleteOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
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

              <Tooltip title="Перетащите, чтобы изменить порядок">
                <Box
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dragRef.current = { id: Number(action.id), pointerStartY: event.clientY };
                    setDraggingId(Number(action.id));
                    setDragOffsetY(0);
                    document.body.style.userSelect = "none";
                  }}
                  onClick={(event) => event.stopPropagation()}
                  sx={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    p: 0.5,
                    display: "flex",
                    alignItems: "center",
                    color: c.textMuted,
                    cursor: "grab",
                    opacity: 0.5,
                    transition: "opacity 0.15s ease",
                    "&:hover": { opacity: 1 },
                    "&:active": { cursor: "grabbing" },
                  }}
                  data-testid={`action-drag-handle-${action.id}`}
                >
                  <DragIndicator sx={{ fontSize: 20 }} />
                </Box>
              </Tooltip>
            </Paper>
          </Fragment>
        ))}

        {draggingId !== null && dropBeforeId === "end" && (
          <Box
            sx={{
              height: 3,
              borderRadius: 1,
              bgcolor: theme.palette.primary.main,
              position: "relative",
              zIndex: 5,
            }}
            data-testid="action-drop-indicator"
          />
        )}
      </>
    );
  }, [items, draggingId, dragOffsetY, dropBeforeId])


  if (!selectedFtsFunctionDetailId) {
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
        <Typography sx={{ color: c.textMuted, fontSize: "0.8rem", lineHeight: 1.4 }}>
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
          py: 1.5,
          borderBottom: `1px solid ${c.borderLight}`,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flexShrink: 0,
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
          <Button
            onClick={() => setOpenGeneralInfoActions(value => !value)}
            endIcon={
              openGeneralInfoActions
                ? <ExpandLess sx={{ fontSize: 18 }} />
                : <ExpandMore sx={{ fontSize: 18 }} />
            }
            sx={{
              textTransform: "none",
              fontSize: "0.76rem",
              color: c.accentBlue,
              px: 0,
              minWidth: 0,
            }}
          >
            {"Общие сведения об операциях"}
          </Button>

          {openGeneralInfoActions && !editingGeneralInfo && (
            <Tooltip title="Редактировать">
              <IconButton
                size="small"
                onClick={() => setEditingGeneralInfo(true)}
                sx={{ color: c.textMuted }}
                data-testid="button-edit-general-info-actions"
              >
                <Edit sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {openGeneralInfoActions && (
          editingGeneralInfo ? (
            <>
              <TextField
                label="Вход"
                value={actionsInput}
                onChange={(event) => setActionsInput(event.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
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
                data-testid="general-info-actions-input"
              />

              <TextField
                label="Выход"
                value={actionsOutput}
                onChange={(event) => setActionsOutput(event.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
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
                data-testid="general-info-actions-output"
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button
                  size="small"
                  onClick={handleCancelGeneralInfo}
                  disabled={isSavingGeneralInfo}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.74rem",
                    color: c.textSecondary,
                  }}
                  data-testid="button-cancel-general-info-actions"
                >
                  {"Отмена"}
                </Button>

                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveGeneralInfo}
                  disabled={isSavingGeneralInfo}
                  startIcon={<Save sx={{ fontSize: 15 }} />}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.74rem",
                    bgcolor: c.saveBtn,
                    "&:hover": { bgcolor: c.saveBtnHover },
                    "&.Mui-disabled": { bgcolor: c.borderMain, color: c.textDim },
                  }}
                  data-testid="button-save-general-info-actions"
                >
                  {isSavingGeneralInfo ? "Сохранение..." : "Сохранить"}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box data-testid="general-info-actions-input-view">
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: c.textMuted, fontSize: "0.66rem", mb: 0.25 }}
                >
                  {"Вход"}
                </Typography>
                <Typography
                  sx={{
                    color: actionsInput.trim() ? c.textBody : c.textDim,
                    fontSize: "0.8rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {actionsInput.trim() ? actionsInput : "Не заполнено"}
                </Typography>
              </Box>

              <Box data-testid="general-info-actions-output-view">
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: c.textMuted, fontSize: "0.66rem", mb: 0.25 }}
                >
                  {"Выход"}
                </Typography>
                <Typography
                  sx={{
                    color: actionsOutput.trim() ? c.textBody : c.textDim,
                    fontSize: "0.8rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {actionsOutput.trim() ? actionsOutput : "Не заполнено"}
                </Typography>
              </Box>
            </>
          )
        )}
      </Box>

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
        <Typography sx={{ color: c.textMuted, fontSize: "0.72rem", fontWeight: 600 }}>
          {`Операций: ${actions.length}`}
        </Typography>

        <Button
          size="small"
          onClick={() => {
            setOpenActionCard(true);
          }}
          startIcon={<Add sx={{ fontSize: 15 }} />}
          sx={{ textTransform: "none", fontSize: "0.72rem", color: c.accentBlue, flexShrink: 0 }}
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
        {content}
      </Box>

      <ActionCardModal
        actionId={selectedActionId}
        open={openActionCard}
        onClose={() => {
          setSelectedActionId(null);
          setOpenActionCard(false);
        }}
      />

      <ActionDeleteFormModal
        actionId={deletebleActionId}
        onClose={() => setDeletebleActionId(null)}
      />
    </Box>
  );
}

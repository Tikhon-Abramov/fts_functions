import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, IconButton, Paper, Tooltip, Typography, useTheme } from "@mui/material";
import { Add, DeleteOutlined, DragIndicator } from "@mui/icons-material";
import { useFeedbackControllerGetAllFeedbacksV1Query, useFeedbackControllerReorderFeedbacksV1Mutation } from "../../../../store/ftsFunctionRegistry";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionDetailId } from "../../../../store/uiSlice";
import { FeedbackCardModal, StatusChip, StatusIcon } from "./FeedbackCardModal";
import { ActionDeleteFormModal as FeedbackDeleteFormModal } from "./FeedbackDeleteFormModal";



function formatDate(value: string | null | undefined): string {
  if (!value) return "Не указан";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
}



export function Feedbacks() {
  const theme = useTheme();
  const c = theme.custom;

  const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);

  const [openCard, setOpenCard] = useState<boolean>(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<number | null>(null);

  const { data } = useFeedbackControllerGetAllFeedbacksV1Query(
    selectedFtsFunctionDetailId ? { ftsFunctionDetailId: selectedFtsFunctionDetailId } : skipToken,
    {
      pollingInterval: 0,
      skipPollingIfUnfocused: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [reorderFeedbacks] = useFeedbackControllerReorderFeedbacksV1Mutation();

  const feedbacks = useMemo(() => data?.data ?? [], [data]);

  // ===== Перетаскивание блоков обратной связи строго по вертикали (обновляет order через API) =====
  // Локальная копия для перестановки. После инвалидации тега список вернётся отсортированным,
  // и items пересинхронизируется этим эффектом.
  const [items, setItems] = useState(feedbacks);
  useEffect(() => {
    setItems(feedbacks);
  }, [feedbacks]);

  // id перетаскиваемого блока и его вертикальное смещение в px (по X блок зафиксирован).
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  // Куда вставится блок: id блока, ПЕРЕД которым появится индикатор, или "end" (в конец).
  const [dropBeforeId, setDropBeforeId] = useState<number | "end" | null>(null);

  const rowRefs = useRef<Map<number, HTMLElement>>(new Map());
  const dragRef = useRef<{ id: number; pointerStartY: number } | null>(null);

  // Автоскролл при перетаскивании у верхней/нижней границы списка.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pointerYRef = useRef(0);
  const dragScrollRef = useRef(0);
  const autoScrollRaf = useRef<number | null>(null);

  const setRowRef = (id: number) => (element: HTMLElement | null) => {
    if (element) rowRefs.current.set(id, element);
    else rowRefs.current.delete(id);
  };

  const commitOrder = async (ordered: typeof items) => {
    if (!selectedFtsFunctionDetailId) return;

    const orderedIds = ordered.map((item) => Number(item.id));
    const serverIds = feedbacks.map((item) => Number(item.id));
    const changed =
      orderedIds.length === serverIds.length &&
      orderedIds.some((id, index) => id !== serverIds[index]);

    if (!changed) return;

    try {
      await reorderFeedbacks({
        ftsFunctionDetailId: selectedFtsFunctionDetailId,
        reorderFeedbacksDto: { orderedIds },
      }).unwrap();
    } catch (error) {
      // Откат к серверному порядку при ошибке.
      setItems(feedbacks);
      console.error("Не удалось обновить порядок обратной связи:", error);
    }
  };

  // Слушатели перемещения/отпускания мыши: двигаем только по вертикали, на отпускании
  // вычисляем новую позицию по серединам соседних блоков и коммитим порядок.
  useEffect(() => {
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

      pointerYRef.current = event.clientY;
      // Смещение учитывает накопленный автоскролл, чтобы блок оставался под курсором.
      setDragOffsetY(event.clientY - drag.pointerStartY + dragScrollRef.current);

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
  }, [items, feedbacks, selectedFtsFunctionDetailId]);

  // Автоскролл контейнера, пока курсор удерживается у его верхнего/нижнего края.
  // Это позволяет дотянуть блок до позиций, которые не видны в длинном списке.
  useEffect(() => {
    if (draggingId === null) return;

    const EDGE = 56; // зона у края, в которой включается автоскролл
    const MAX_SPEED = 16; // макс. скорость прокрутки, px за кадр

    const step = () => {
      const container = scrollRef.current;
      const drag = dragRef.current;

      if (container && drag) {
        const rect = container.getBoundingClientRect();
        const y = pointerYRef.current;

        let delta = 0;
        if (y < rect.top + EDGE) {
          delta = -Math.ceil(MAX_SPEED * Math.min(1, (rect.top + EDGE - y) / EDGE));
        } else if (y > rect.bottom - EDGE) {
          delta = Math.ceil(MAX_SPEED * Math.min(1, (y - (rect.bottom - EDGE)) / EDGE));
        }

        if (delta !== 0) {
          const before = container.scrollTop;
          container.scrollTop += delta;
          const applied = container.scrollTop - before; // фактический сдвиг (с учётом границ)

          if (applied !== 0) {
            dragScrollRef.current += applied;
            setDragOffsetY(y - drag.pointerStartY + dragScrollRef.current);

            // Пересчёт позиции вставки после прокрутки (строки сместились).
            const others = items.filter((item) => Number(item.id) !== drag.id);
            let insertAt = 0;
            for (const item of others) {
              const element = rowRefs.current.get(Number(item.id));
              if (!element) {
                insertAt += 1;
                continue;
              }
              const r = element.getBoundingClientRect();
              if (y > r.top + r.height / 2) insertAt += 1;
              else break;
            }
            setDropBeforeId(insertAt < others.length ? Number(others[insertAt].id) : "end");
          }
        }
      }

      autoScrollRaf.current = requestAnimationFrame(step);
    };

    autoScrollRaf.current = requestAnimationFrame(step);

    return () => {
      if (autoScrollRaf.current !== null) {
        cancelAnimationFrame(autoScrollRaf.current);
        autoScrollRaf.current = null;
      }
    };
  }, [draggingId, items]);

  const handleOpenCreate = () => {
    setSelectedFeedbackId(null);
    setOpenCard(true);
  };

  const content = items.length === 0 ? (
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
          Нажмите «Добавить», чтобы заполнить новую обратную связь по выбранной строке.
      </Typography>
    </Paper>
  ) : (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((feedback, index) => {
        const sourceText = feedback.problemDescription || "Не заполнено";
        const metricName = feedback.feedbackQualityMetrics?.name || "Не заполнено";

        return (
          <Fragment key={String(feedback.id)}>
            {draggingId !== null && dropBeforeId === Number(feedback.id) && (
              <Box
                sx={{
                  height: 3,
                  borderRadius: 1,
                  bgcolor: theme.palette.primary.main,
                  position: "relative",
                  zIndex: 5,
                }}
              />
            )}

            <Paper
              ref={setRowRef(Number(feedback.id))}
              elevation={0}
              onClick={() => {
                setSelectedFeedbackId(Number(feedback.id));
                setOpenCard(true);
              }}
              sx={{
                position: "relative",
                p: 1.25,
                pr: 4.5,
                border: `1px solid ${c.borderMain}`,
                bgcolor: c.bgPaper,
                borderRadius: 2,
                cursor: "pointer",
                transform:
                  draggingId === Number(feedback.id)
                    ? `translateY(${dragOffsetY}px)`
                    : undefined,
                transition: draggingId === Number(feedback.id) ? "none" : "0.15s ease",
                zIndex: draggingId === Number(feedback.id) ? 2 : "auto",
                boxShadow: draggingId === Number(feedback.id) ? 6 : "none",
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
                  setDeleteFeedbackId(Number(feedback.id));
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
                <DeleteOutlined sx={{ fontSize: 17 }} />
              </IconButton>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <StatusIcon code={feedback.acceptStatus?.code} />

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
                      {`Обратная связь ${index + 1}`}
                    </Typography>

                    <StatusChip code={feedback.acceptStatus?.code} />
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

              <Tooltip title="Перетащите, чтобы изменить порядок">
                <Box
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    dragRef.current = { id: Number(feedback.id), pointerStartY: event.clientY };
                    pointerYRef.current = event.clientY;
                    dragScrollRef.current = 0;
                    setDraggingId(Number(feedback.id));
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
                >
                  <DragIndicator sx={{ fontSize: 20 }} />
                </Box>
              </Tooltip>
            </Paper>
          </Fragment>
        );
      })}

      {draggingId !== null && dropBeforeId === "end" && (
        <Box
          sx={{
            height: 3,
            borderRadius: 1,
            bgcolor: theme.palette.primary.main,
            position: "relative",
            zIndex: 5,
          }}
        />
      )}
    </Box>
  );


  if (!selectedFtsFunctionDetailId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ color: c.textMuted, fontSize: "0.82rem" }}>
          Выберите строку блока «Фактическое действие»
        </Typography>
      </Box>
    );
  }


  return (

    <Box
      ref={scrollRef}
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
          Добавить
        </Button>
      </Box>

      {content}

      <FeedbackCardModal
        feedbackId={selectedFeedbackId}
        open={openCard}
        onClose={() => {
          setSelectedFeedbackId(null);
          setOpenCard(false);
        }}
      />

      <FeedbackDeleteFormModal
        feedbackId={deleteFeedbackId}
        onClose={() => setDeleteFeedbackId(null)}
      />
    </Box>

  )
}

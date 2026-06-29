import { type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import { Box, Table, TableBody, TableContainer, Typography, useTheme } from "@mui/material";
import { useFtsFunctionDetailControllerReorderFtsFunctionDetailsV1Mutation } from "../../../../store/ftsFunctionRegistry";
import type { FtsFunctionDetailItemsResponseDto } from "../../../../store/ftsFunctionRegistry";
import { selectSelectedFtsFunctionDetailId, selectSelectedFtsFunctionId } from "../../../../store/uiSlice";
import { useAppSelector } from "../../../../store";
import { CountChip } from "./CountChip";
import { DataRow } from "./DataRow";



export type CategorySectionProps = {
  data: FtsFunctionDetailItemsResponseDto['data']['itemsByCategory']['methodology'];
  initNumber: {objectSelection: number; clusteringImpact: number };
  categoryName: string;
  accentColor: { bg: string; border: string; text: string };
  onRowClick: (id: number, name: string, stepCode: string, categoryCode: string) => void;
  onRemoveRow: (id: number) => void;
};


export function CategorySection({
  data,
  initNumber,
  categoryName,
  accentColor,
  onRowClick,
  onRemoveRow,
}: CategorySectionProps) {
  const theme = useTheme();
  const c = theme.custom;

  const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);
  const ftsFunctionId = useAppSelector(selectSelectedFtsFunctionId);

  const { itemsByStep, meta } = data;

  // ===== Перетаскивание строк для изменения порядка (в пределах столбца «Шаг») =====
  // Локальные копии столбцов; после инвалидации тега список вернётся отсортированным
  // и эти эффекты пересинхронизируют состояние.
  const [osItems, setOsItems] = useState(itemsByStep.objectSelection);
  const [ciItems, setCiItems] = useState(itemsByStep.clusteringImpact);

  useEffect(() => { setOsItems(itemsByStep.objectSelection); }, [itemsByStep.objectSelection]);
  useEffect(() => { setCiItems(itemsByStep.clusteringImpact); }, [itemsByStep.clusteringImpact]);

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragRef = useRef<{ id: number; step: "os" | "ci" } | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const setRowRef = (id: number) => (element: HTMLTableRowElement | null) => {
    if (element) rowRefs.current.set(id, element);
    else rowRefs.current.delete(id);
  };

  const [reorderDetails] = useFtsFunctionDetailControllerReorderFtsFunctionDetailsV1Mutation();

  const commitOrder = async (ordered: typeof osItems, server: typeof osItems) => {
    if (!ftsFunctionId) return;

    const orderedIds = ordered.map((item) => Number(item.id));
    const serverIds = server.map((item) => Number(item.id));
    const changed =
      orderedIds.length === serverIds.length &&
      orderedIds.some((id, index) => id !== serverIds[index]);

    if (!changed) return;

    try {
      await reorderDetails({
        ftsFunctionId,
        reorderFtsFunctionDetailDto: { orderedIds },
      }).unwrap();
    } catch (error) {
      // Откат к серверному порядку при ошибке.
      setOsItems(itemsByStep.objectSelection);
      setCiItems(itemsByStep.clusteringImpact);
      console.error("Не удалось обновить порядок детализаций:", error);
    }
  };

  const startDrag = (id: number, step: "os" | "ci") => (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { id, step };
    setDraggingId(id);
    document.body.style.userSelect = "none";
  };

  // Перестановка строк вживую (строки одинаковой высоты) + коммит на отпускании.
  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const list = drag.step === "os" ? osItems : ciItems;
      const setList = drag.step === "os" ? setOsItems : setCiItems;

      const fromIndex = list.findIndex((item) => Number(item.id) === drag.id);
      if (fromIndex === -1) return;

      let target = list.length - 1;
      for (let i = 0; i < list.length; i++) {
        const element = rowRefs.current.get(Number(list[i].id));
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (event.clientY < rect.top + rect.height / 2) {
          target = i;
          break;
        }
      }

      if (target !== fromIndex) {
        setList((prev) => {
          const next = [...prev];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(target, 0, moved);
          return next;
        });
      }
    };

    const handleUp = () => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.step === "os") void commitOrder(osItems, itemsByStep.objectSelection);
      else void commitOrder(ciItems, itemsByStep.clusteringImpact);

      dragRef.current = null;
      setDraggingId(null);
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [osItems, ciItems, itemsByStep, ftsFunctionId]);

  if (!itemsByStep.objectSelection.length && !itemsByStep.clusteringImpact.length) return null;

  return (
    <>
      <Box
        sx={{
          height: 32,
          display: "flex",
          alignItems: "center",
          px: 2,
          gap: 1,
          bgcolor: `${accentColor.bg}`,
          borderLeft: `3px solid ${accentColor.border}`,
          borderBottom: `1px solid ${c.borderLight}`,
        }}
      >
        <Typography
          sx={{ color: accentColor.text, fontWeight: 600, fontSize: "0.75rem" }}
        >
          {categoryName}
        </Typography>

        <CountChip label={`Шаг 1: ${meta.stepOne}`} />
        <CountChip label={`Шаг 2: ${meta.stepTwo}`} />
        {/* {meta.countRelations && <CountChip label={`Связи: ${meta.countRelations}`} emphasis="accent" />} */}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 2px 1fr",
          gap: 0,
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <TableContainer sx={{ overflow: "visible" }}>
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableBody>
                {osItems.map((row, index) => (
                  <DataRow
                    key={row.id}
                    selectedRowId={selectedFtsFunctionDetailId}
                    row={row}
                    indexLabel={`1.${index + initNumber.objectSelection}`}
                    onClick={() => onRowClick(Number(row.id), row.ftsFunctionDetails, row.ftsFunctionStep.code, row.ftsFunctionCategory.code)}
                    onRemove={() => onRemoveRow(Number(row.id))}
                    rowRef={setRowRef(Number(row.id))}
                    isDragging={draggingId === Number(row.id)}
                    onDragHandleMouseDown={startDrag(Number(row.id), "os")}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box sx={{ bgcolor: c.borderDivider }} />
        <Box sx={{ minWidth: 0 }}>
          <TableContainer sx={{ overflow: "visible" }}>
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableBody>
                {ciItems.map((row, index) => (
                  <DataRow
                    key={row.id}
                    selectedRowId={selectedFtsFunctionDetailId}
                    row={row}
                    indexLabel={`2.${index + initNumber.clusteringImpact}`}
                    onClick={() => onRowClick(Number(row.id), row.ftsFunctionDetails, row.ftsFunctionStep.code, row.ftsFunctionCategory.code)}
                    onRemove={() => onRemoveRow(Number(row.id))}
                    rowRef={setRowRef(Number(row.id))}
                    isDragging={draggingId === Number(row.id)}
                    onDragHandleMouseDown={startDrag(Number(row.id), "ci")}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </>
  );
}

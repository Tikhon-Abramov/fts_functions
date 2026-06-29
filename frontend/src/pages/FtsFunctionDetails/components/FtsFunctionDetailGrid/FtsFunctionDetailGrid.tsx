import { Box, Table, TableCell, TableContainer, TableHead, TableRow, Typography, useTheme } from "@mui/material";
import { type FtsFunctionDetailItemsResponseDto } from "../../../../store/ftsFunctionRegistry";
import { CategorySection } from "./CategorySection";
import { useAppDispatch } from "../../../../store";
import { setDeleteableFtsFunctionDetail, setSelectedFtsFunctionDetail } from "../../../../store/uiSlice";
import { useCallback } from "react";
import { FtsFunctionDetailDeleteFormModal } from "./FtsFunctionDetailDeleteFormModal";



export function FtsFunctionDetailGrid({ data }: { data: FtsFunctionDetailItemsResponseDto['data']['itemsByCategory'] }) {
  const theme = useTheme();
  const c = theme.custom;

  const dispatch = useAppDispatch();
  
  const handleRowClick = useCallback((id: number, name: string, ftsFunctionStep: string, ftsFunctionCategory: string) => {
    dispatch(setSelectedFtsFunctionDetail({ id, name, ftsFunctionStep, ftsFunctionCategory }))
  }, [dispatch]);

  const handleRemoveRow = useCallback((id: number) => {
    dispatch(setDeleteableFtsFunctionDetail(id))
  }, [dispatch]);

  const headCellBase = {
    py: 0,
    height: 36,
    maxHeight: 36,
    boxSizing: "border-box" as const,
    bgcolor: c.bgPaper,
    borderBottom: `1px solid ${c.borderMain}`,
    color: c.textMuted,
    fontSize: "0.65rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    verticalAlign: "middle" as const,
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          overflow: "auto",
          bgcolor: c.bgPaper,
          minWidth: 0,
        }}
      >    <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 2px 1fr",
          gap: 0,
          minWidth: 0,
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
          <Box
            sx={{
              bgcolor: c.bgPaper,
              px: 2,
              height: 36,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderBottom: `1px solid ${c.borderMain}`,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: theme.palette.primary.main,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="subtitle2"
              sx={{
                color: c.textBody,
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Шаг 1: Выбор объекта
            </Typography>
          </Box>
          <Box sx={{ bgcolor: c.borderDivider }} />
          <Box
            sx={{
              bgcolor: c.bgPaper,
              px: 2,
              height: 36,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderBottom: `1px solid ${c.borderMain}`,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: theme.palette.success.main,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="subtitle2"
              sx={{
                color: c.textBody,
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Шаг 2: Кластеризация / Воздействие
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            position: "sticky",
            top: 36,
            zIndex: 5,
            display: "grid",
            gridTemplateColumns: "1fr 2px 1fr",
            bgcolor: c.bgPaper,
            borderBottom: `1px solid ${c.borderMain}`,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <TableContainer sx={{ overflow: "visible" }}>
              <Table size="small" sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headCellBase, width: 54 }}>№</TableCell>
                    <TableCell sx={headCellBase}>Наименование действия</TableCell>
                    <TableCell sx={{ ...headCellBase, width: 120 }}>Кто делает</TableCell>
                    <TableCell sx={{ ...headCellBase, width: 44 }} />
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          </Box>
          <Box sx={{ bgcolor: c.borderDivider }} />
          <Box sx={{ minWidth: 0 }}>
            <TableContainer sx={{ overflow: "visible" }}>
              <Table size="small" sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headCellBase, width: 54 }}>№</TableCell>
                    <TableCell sx={headCellBase}>Наименование действия</TableCell>
                    <TableCell sx={{ ...headCellBase, width: 120 }}>Кто делает</TableCell>
                    <TableCell sx={{ ...headCellBase, width: 44 }} />
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          </Box>
        </Box>

        <CategorySection
          data={data.methodology}
          categoryName="Методология"
          initNumber={{ objectSelection: 1, clusteringImpact: 1 }}
          accentColor={c.catMethodology}
          onRowClick={handleRowClick}
          onRemoveRow={handleRemoveRow}
        />
        <CategorySection
          data={data.actualAction}
          categoryName="Фактическое действие"
          initNumber={{
            objectSelection: data.methodology.meta.stepOne + 1,
            clusteringImpact: data.methodology.meta.stepTwo + 1,
          }}
          accentColor={c.catAction}
          onRowClick={handleRowClick}
          onRemoveRow={handleRemoveRow}
        />
        <CategorySection
          data={data.controlAnalytics}
          categoryName="Контроль / Аналитика"
          initNumber={{
            objectSelection: data.methodology.meta.stepOne + data.actualAction.meta.stepOne + 1,
            clusteringImpact: data.methodology.meta.stepTwo + data.actualAction.meta.stepTwo + 1,
          }}
          accentColor={c.catControl}
          onRowClick={handleRowClick}
          onRemoveRow={handleRemoveRow}
        />
      </Box>

      <FtsFunctionDetailDeleteFormModal />
    </>
  );
}

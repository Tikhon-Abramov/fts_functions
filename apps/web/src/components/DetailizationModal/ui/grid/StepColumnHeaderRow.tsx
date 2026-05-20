import type { TFunction } from "i18next";
import type { CustomPalette } from "src/app/App";

import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";
import { Box } from "@mui/material";
import { HEAD_HEIGHT, STEP_TITLE_HEIGHT } from "src/shared/config/ui";
import { useTranslation } from "src/shared/i18n";
/**
 * The sticky two-column header row that sits below the step title row. Each
 * step uses the same table column layout (#, detail, who, action, gutter), so
 * the markup is identical on both sides.
 */
export function StepColumnHeaderRow() {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 2px 1fr",
        gap: 0,
        minWidth: 0,
        position: "sticky",
        top: STEP_TITLE_HEIGHT,
        zIndex: 4,
      }}
    >
      <ColumnHeaderTable t={t} c={c} />
      <Box sx={{ bgcolor: c.borderDivider }} />
      <ColumnHeaderTable t={t} c={c} />
    </Box>
  );
}

type ColumnHeaderTableProps = { t: TFunction; c: CustomPalette };

function ColumnHeaderTable({ t, c }: ColumnHeaderTableProps) {
  const headCellBase = {
    py: 0,
    height: HEAD_HEIGHT,
    maxHeight: HEAD_HEIGHT,
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
    <TableContainer sx={{ overflow: "visible" }}>
      <Table size="small" sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow sx={{ height: HEAD_HEIGHT, maxHeight: HEAD_HEIGHT }}>
            <TableCell sx={{ ...headCellBase, width: 56 }}>{"№"}</TableCell>
            <TableCell sx={headCellBase}>{"Детализация функций"}</TableCell>
            <TableCell sx={{ ...headCellBase, width: 80 }}>
              {"Кто делает"}
            </TableCell>
            <TableCell sx={{ ...headCellBase, width: 140 }}>
              {"Что делать"}
            </TableCell>
            <TableCell sx={{ ...headCellBase, width: 32, px: 0.25 }} />
          </TableRow>
        </TableHead>
      </Table>
    </TableContainer>
  );
}

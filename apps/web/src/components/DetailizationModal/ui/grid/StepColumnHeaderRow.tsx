import type { CustomPalette } from "src/app/App";

import {
  Box,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";
import { HEAD_HEIGHT, STEP_TITLE_HEIGHT } from "src/shared/config/ui";

export function StepColumnHeaderRow() {
  const theme = useTheme();
  const c = theme.custom;

  return (
    <Box
      sx={{
        position: "sticky",
        top: STEP_TITLE_HEIGHT,
        zIndex: 5,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        bgcolor: c.bgPaper,
        borderBottom: `1px solid ${c.borderMain}`,
      }}
    >
      <ColumnHeaderTable c={c} />
      <ColumnHeaderTable c={c} />
    </Box>
  );
}

type ColumnHeaderTableProps = {
  c: CustomPalette;
};

function ColumnHeaderTable({ c }: ColumnHeaderTableProps) {
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
    <TableContainer>
      <Table size="small" sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headCellBase, width: 54 }}>{"№"}</TableCell>
            <TableCell sx={headCellBase}>{"Наименование действия"}</TableCell>
            <TableCell sx={{ ...headCellBase, width: "22%" }}>
              {"Кто делает"}
            </TableCell>
            <TableCell sx={{ ...headCellBase, width: 42 }} />
          </TableRow>
        </TableHead>
      </Table>
    </TableContainer>
  );
}

/**
 * `registryGridSx` — DataGrid sx factory for the FTS-function registry.
 *
 * Pulled out of `home.tsx` so the orchestration layer does not carry 75 lines
 * of theme-styled selectors. The function takes the resolved custom palette
 * (`theme.custom`) so it stays decoupled from the React tree and is unit-
 * testable / snapshottable.
 */
import type { SxProps, Theme } from "@mui/material";

import { ROW_HEIGHT } from "src/shared/config";

type CustomPalette = Theme["custom"];

export function registryGridSx(c: CustomPalette): SxProps<Theme> {
  return {
    flex: 1,
    border: "none",
    bgcolor: c.bgPaper,
    color: c.textBody,
    fontSize: "0.78rem",
    "& .MuiDataGrid-columnHeaders": {
      borderBottom: `1px solid ${c.borderMain}`,
      bgcolor: c.bgPaper,
    },
    "& .MuiDataGrid-columnHeader": {
      color: c.textMuted,
      fontSize: "0.65rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 600,
      whiteSpace: "normal",
      lineHeight: 1.2,
    },
    "& .MuiDataGrid-cell": {
      borderBottom: `1px solid ${c.borderLight}`,
      py: 0.75,
      display: "flex",
      alignItems: "center",
      verticalAlign: "middle",
      whiteSpace: "normal !important",
      wordBreak: "break-word",
      overflowWrap: "break-word",
      lineHeight: 1.35,
      minHeight: `${ROW_HEIGHT}px`,
    },
    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
      outline: "none !important",
    },
    "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
      {
        outline: "none !important",
      },
    "& .MuiDataGrid-row": {
      "&:hover": { bgcolor: c.hoverOverlay },
    },
    "& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover": {
      bgcolor: "transparent",
    },
    "& .MuiDataGrid-footerContainer": {
      borderTop: `1px solid ${c.borderMain}`,
      bgcolor: c.bgPaper,
    },
    "& .MuiTablePagination-root": {
      color: c.textSecondary,
      fontSize: "0.75rem",
    },
    "& .MuiDataGrid-iconSeparator": { color: c.borderMedium },
    "& .MuiDataGrid-menuIcon button, & .MuiDataGrid-sortIcon": {
      color: c.textMuted,
    },
    "& .MuiDataGrid-filler, & .MuiDataGrid-scrollbarFiller": {
      bgcolor: c.bgPaper,
    },
  };
}

// Column-menu density styles live in App.tsx's MuiCssBaseline override
// (targeting `.MuiDataGrid-menu`) — not here. The menu is rendered in a
// Popper outside the grid root, so DataGrid's `sx` selectors can't reach
// it, and `slotProps.columnMenu` doesn't accept `sx` in v9 community.

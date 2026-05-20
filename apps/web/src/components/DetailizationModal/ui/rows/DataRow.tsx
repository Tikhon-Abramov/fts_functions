import type { SxProps, Theme } from "@mui/material";
import type { CustomPalette } from "src/app/App";
import type { RowPresentationResolver } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import type { Row } from "src/entities/fts-function/types";

import { Close } from "@mui/icons-material";
import {
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { RowPresentation } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import { ROW_HEIGHT } from "src/shared/config/ui";

import { ActionChip } from "../chips/ActionChip";

export type DataRowProps = {
  row: Row;
  indexLabel: string;
  presentation: RowPresentationResolver;
  colorByCode: Map<string, string | null | undefined>;
  onClick: (id: string) => void;
  onRemove: (id: string) => void;
  registerRef: (id: string) => (el: HTMLTableRowElement | null) => void;
};

type PresentationStyles = {
  /** Whether the row should be visually de-emphasized (selection in another row). */
  dimmed: boolean;
  /** Background applied at rest. */
  bgcolor: string;
  /** Background applied on hover. */
  hoverBgcolor: string;
  /** Optional outline overlay; merged into `sx` when present. */
  outline?: SxProps<Theme>;
};

function buildPresentationStyles(
  c: CustomPalette,
): Record<RowPresentation, PresentationStyles> {
  return {
    [RowPresentation.SELECTED]: {
      dimmed: false,
      bgcolor: c.selectedBg,
      hoverBgcolor: c.selectedBgHover,
      outline: { outline: `2px solid ${c.selectedOutline}`, outlineOffset: -2 },
    },
    [RowPresentation.LINKED]: {
      dimmed: false,
      bgcolor: c.linkedBg,
      hoverBgcolor: c.linkedBg,
      outline: { outline: `1px solid ${c.linkedOutline}`, outlineOffset: -1 },
    },
    [RowPresentation.DIMMED]: {
      dimmed: true,
      bgcolor: "transparent",
      hoverBgcolor: c.hoverOverlayMed,
    },
    [RowPresentation.NORMAL]: {
      dimmed: false,
      bgcolor: "transparent",
      hoverBgcolor: c.hoverOverlayMed,
    },
  };
}

/**
 * Single data row inside a step table. All visual state derives from the
 * presentation symbol returned by `useRowPresentation` — no in-component
 * branching beyond a Record lookup.
 */
export function DataRow({
  row,
  indexLabel,
  presentation,
  colorByCode,
  onClick,
  onRemove,
  registerRef,
}: DataRowProps) {
  const theme = useTheme();
  const c = theme.custom;
  const presStyles = buildPresentationStyles(c);
  const style = presStyles[presentation(row)];

  const cellBase = {
    py: 0,
    height: ROW_HEIGHT,
    maxHeight: ROW_HEIGHT,
    boxSizing: "border-box" as const,
    borderBottom: `1px solid ${c.borderLight}`,
    verticalAlign: "middle" as const,
  };

  return (
    <TableRow
      ref={registerRef(row.id)}
      onClick={() => onClick(row.id)}
      sx={{
        height: ROW_HEIGHT,
        maxHeight: ROW_HEIGHT,
        cursor: "pointer",
        opacity: style.dimmed ? 0.3 : 1,
        transition: "all 0.15s",
        bgcolor: style.bgcolor,
        "&:hover": { bgcolor: style.hoverBgcolor },
        // Override MUI's `.Mui-selected` palette (action.selected = blue);
        // we drive selection visuals from `presentation`, not the `selected` prop.
        "&.Mui-selected, &.Mui-selected:hover": {
          bgcolor: style.bgcolor,
        },
        ...style.outline,
      }}
      data-testid={`row-${row.id}`}
    >
      <TableCell sx={{ ...cellBase, width: 56, px: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: c.textSecondary,
            fontSize: "0.72rem",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {indexLabel}
        </Typography>
      </TableCell>

      <TableCell sx={{ ...cellBase, px: 1.5 }}>
        <Tooltip title={row.detailText || ""} placement="top" enterDelay={400}>
          <Typography
            variant="body2"
            sx={{
              color: c.textBody,
              fontSize: "0.78rem",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {row.detailText || ""}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell sx={{ ...cellBase, width: 80, px: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: c.textSecondary,
            fontSize: "0.72rem",
            fontFamily: "monospace",
          }}
        >
          {row.who || ""}
        </Typography>
      </TableCell>

      <TableCell sx={{ ...cellBase, width: 140, px: 1 }}>
        <ActionChip action={row.actionLabel} colorByCode={colorByCode} />
      </TableCell>

      <TableCell
        sx={{
          ...cellBase,
          width: 32,
          px: 0.25,
          position: "relative",
          verticalAlign: "top",
        }}
      >
        <Tooltip title={"Удалить строку"}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(row.id);
            }}
            sx={{
              position: "absolute",
              top: 2,
              right: 2,
              p: 0.25,
              width: 18,
              height: 18,
              minWidth: 18,
              minHeight: 18,
              color: c.textMuted,
              opacity: 0.65,
              "&:hover": {
                color: theme.palette.error.main,
                bgcolor: "transparent",
                opacity: 1,
              },
            }}
            data-testid={`button-delete-row-${row.id}`}
          >
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

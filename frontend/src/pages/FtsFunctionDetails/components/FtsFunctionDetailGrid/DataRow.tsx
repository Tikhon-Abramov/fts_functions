import { useMemo, type MouseEvent } from "react";
import { Box, IconButton, TableCell, TableRow, Tooltip, Typography, useTheme, type SxProps } from "@mui/material";
import { CancelRounded, CheckCircleRounded, Close, DragIndicator, RadioButtonUncheckedRounded } from "@mui/icons-material";
import type { FtsFunctionDetailItemsResponseDto } from "../../../../store/ftsFunctionRegistry";
import type { CustomPalette } from "../../../../theme";



type DataRowProps = {
  selectedRowId: number | null;
  row: FtsFunctionDetailItemsResponseDto['data']['itemsByCategory']['methodology']['itemsByStep']['objectSelection'][0];
  indexLabel: string;
  onClick: () => void;
  onRemove: () => void;
  rowRef?: (element: HTMLTableRowElement | null) => void;
  isDragging?: boolean;
  onDragHandleMouseDown?: (event: MouseEvent<HTMLElement>) => void;
};

type PresentationStyles = {
  dimmed: boolean;
  bgcolor: string;
  hoverBgcolor: string;
  outline?: SxProps;
};


const AcceptStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;
type AcceptStatus = (typeof AcceptStatus)[keyof typeof AcceptStatus];


function getFinalFeedbacksStatus(statuses: AcceptStatus[]): AcceptStatus | null {
  if (statuses.length === 0) return null;

  if (statuses.includes('REJECTED')) return 'REJECTED';
  if (statuses.includes('PENDING')) return 'PENDING';

  return 'ACCEPTED'
} 


function buildPresentationStyles(
  c: CustomPalette,
  rowId: number,
  linkedIds: Set<number>,
  selectedRowId: number | null,
): PresentationStyles {
  if (rowId === selectedRowId) {
    return {
      dimmed: false,
      bgcolor: c.selectedBg,
      hoverBgcolor: c.selectedBgHover,
      outline: { outline: `2px solid ${c.selectedOutline}`, outlineOffset: -2 },
    };
  }

  if ((selectedRowId !== null) && linkedIds.has(selectedRowId)) {
    return {
      dimmed: false,
      bgcolor: c.linkedBg,
      hoverBgcolor: c.linkedBg,
      outline: { outline: `1px solid ${c.linkedOutline}`, outlineOffset: -1 },
    };
  }

  if (selectedRowId !== null) {
    return {
      dimmed: true,
      bgcolor: "transparent",
      hoverBgcolor: c.hoverOverlayMed,
    };
  }

  return {
    dimmed: false,
    bgcolor: "transparent",
    hoverBgcolor: c.hoverOverlayMed,
  };
}



export function DataRow({ selectedRowId, row, indexLabel, onClick, onRemove, rowRef, isDragging = false, onDragHandleMouseDown }: DataRowProps) {
  const theme = useTheme();
  const c = theme.custom;

  const linkedIds = new Set([
    ...row.children.map(({ childFtsFunctionId }) => childFtsFunctionId),
    ...row.parents.map(({ parentFtsFunctionId }) => parentFtsFunctionId),
  ]);
  const style = buildPresentationStyles(c, Number(row.id), linkedIds, selectedRowId);


  const FeedbackStatusDot = useMemo(() => {
    const acceptStatuses = row.feedbacks
      .map(({ acceptStatus }) => acceptStatus?.code)
      .filter(s => s !== undefined);
    const commonStatus = getFinalFeedbacksStatus(acceptStatuses as AcceptStatus[]);

    const title = commonStatus && {
      [AcceptStatus.PENDING]: 'Есть обратная связь на согласовании',
      [AcceptStatus.REJECTED]: 'Есть не согласованная обратная связь',
      [AcceptStatus.ACCEPTED]: undefined,
    }[commonStatus] || 'Все обратные связи согласованы';

    if (!commonStatus) return <></>;

    return (
      <Tooltip title={title}>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            flexShrink: 0,
          }}
        >
          {commonStatus === "PENDING" ? (
            <RadioButtonUncheckedRounded
              sx={{
                width: 15,
                height: 15,
                display: "block",
                color: c.textMuted,
              }}
            />
          ) : commonStatus === "REJECTED" ? (
            <CancelRounded
              sx={{
                width: 15,
                height: 15,
                display: "block",
                color: theme.palette.error.main,
              }}
            />
          ) : (
            <CheckCircleRounded
              sx={{
                width: 15,
                height: 15,
                display: "block",
                color: theme.palette.success.main,
              }}
            />
          )}
        </Box>
      </Tooltip>
    )
  }, [row])




  return (
    <TableRow
      ref={rowRef}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      sx={{
        height: 44,
        maxHeight: 44,
        cursor: "pointer",
        opacity: style.dimmed ? 0.3 : 1,
        transition: "all 0.15s",
        bgcolor: isDragging ? c.selectedBgHover : style.bgcolor,
        "&:hover": { bgcolor: isDragging ? c.selectedBgHover : style.hoverBgcolor },
        "&.Mui-selected, &.Mui-selected:hover": {
          bgcolor: style.bgcolor,
        },
        ...style.outline,
      }}
    >
      <TableCell
        sx={{
          py: 0,
          height: 44,
          maxHeight: 44,
          boxSizing: "border-box" as const,
          borderBottom: `1px solid ${c.borderLight}`,
          verticalAlign: "middle" as const,
          width: 54,
          minWidth: 54,
          maxWidth: 54,
          color: c.textDim,
          fontSize: "0.72rem",
          px: 0.25,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.95 }}>
          <Box
            component="span"
            onMouseDown={onDragHandleMouseDown}
            onClick={(event) => event.stopPropagation()}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              cursor: "grab",
              color: c.textMuted,
              opacity: 0.5,
              "&:hover": { opacity: 1 },
              "&:active": { cursor: "grabbing" },
            }}
          >
            <DragIndicator sx={{ fontSize: 14 }} />
          </Box>

          <Box component="span" sx={{ whiteSpace: "nowrap" }}>
            {indexLabel}
          </Box>
        </Box>
      </TableCell>

      <TableCell
        sx={{
          py: 0,
          height: 44,
          maxHeight: 44,
          boxSizing: "border-box" as const,
          borderBottom: `1px solid ${c.borderLight}`,
          verticalAlign: "middle" as const,
          color: c.textBody,
          fontSize: "0.78rem",
          px: 1,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "inherit",
            fontSize: "inherit",
            lineHeight: 1.25,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {row.ftsFunctionDetails || ""}
        </Typography>
      </TableCell>

      <TableCell
        sx={{
          py: 0,
          height: 44,
          maxHeight: 44,
          boxSizing: "border-box" as const,
          borderBottom: `1px solid ${c.borderLight}`,
          verticalAlign: "middle" as const,
          width: 120,
          maxWidth: 120,
          color: c.textSecondary,
          fontSize: "0.74rem",
          px: 1,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "inherit",
            fontSize: "inherit",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {row.whoPerformsAction?.name || ""}
        </Typography>
      </TableCell>

      <TableCell
        sx={{
          py: 0,
          height: 44,
          maxHeight: 44,
          boxSizing: "border-box" as const,
          borderBottom: `1px solid ${c.borderLight}`,
          verticalAlign: "middle" as const,
          width: 44,
          minWidth: 44,
          maxWidth: 44,
          px: 0.25,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 0.25,
            minWidth: 0,
          }}
        >
          {FeedbackStatusDot}
          <Tooltip title="Удалить строку">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              sx={{
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
            >
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
}

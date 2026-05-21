import type { SxProps } from "@mui/material";
import type { CustomPalette } from "src/app/App";
import type { RowPresentationResolver } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import type { Row } from "src/entities/fts-function/types";

import { Close } from "@mui/icons-material";
import {
    Box,
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
import { FeedbackStatusDot } from "./FeedbackStatusDot";

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
    dimmed: boolean;
    bgcolor: string;
    hoverBgcolor: string;
    outline?: SxProps;
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
            onClick={(event) => {
                event.stopPropagation();
                onClick(row.id);
            }}
            sx={{
                height: ROW_HEIGHT,
                maxHeight: ROW_HEIGHT,
                cursor: "pointer",
                opacity: style.dimmed ? 0.3 : 1,
                transition: "all 0.15s",
                bgcolor: style.bgcolor,
                "&:hover": { bgcolor: style.hoverBgcolor },
                "&.Mui-selected, &.Mui-selected:hover": {
                    bgcolor: style.bgcolor,
                },
                ...style.outline,
            }}
            data-testid={`row-${row.id}`}
        >
            <TableCell
                sx={{
                    ...cellBase,
                    width: 44,
                    minWidth: 44,
                    maxWidth: 44,
                    color: c.textDim,
                    fontSize: "0.72rem",
                    textAlign: "center",
                    px: 0.75,
                }}
            >
                {indexLabel}
            </TableCell>

            <TableCell
                sx={{
                    ...cellBase,
                    color: c.textBody,
                    fontSize: "0.78rem",
                    px: 1,
                    minWidth: 180,
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
                    {row.detailText || ""}
                </Typography>
            </TableCell>

            <TableCell
                sx={{
                    ...cellBase,
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
                    {row.who || ""}
                </Typography>
            </TableCell>

            <TableCell sx={{ ...cellBase, width: 148, px: 1 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        minWidth: 0,
                    }}
                >
                    <ActionChip action={row.actionLabel} colorByCode={colorByCode} />
                    <FeedbackStatusDot row={row} />
                </Box>
            </TableCell>

            <TableCell
                sx={{
                    ...cellBase,
                    width: 28,
                    minWidth: 28,
                    maxWidth: 28,
                    px: 0,
                    position: "relative",
                }}
            >
                <Tooltip title="Удалить строку">
                    <IconButton
                        size="small"
                        onClick={(event) => {
                            event.stopPropagation();
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
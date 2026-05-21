import type { Row } from "src/entities/fts-function/types";

import { Box, Tooltip, useTheme } from "@mui/material";

import {
    getFeedbackStatus,
    isActualActionCategory,
} from "src/entities/fts-function/lib/detail-technology";

export type FeedbackStatusDotProps = {
    row: Row;
};

export function FeedbackStatusDot({ row }: FeedbackStatusDotProps) {
    const theme = useTheme();
    const c = theme.custom;

    if (!isActualActionCategory(row.category)) return null;

    const status = getFeedbackStatus(row);
    if (!status) return null;

    const config =
        status === "accepted"
            ? {
                title: "Обратная связь согласована",
                bgcolor: theme.palette.success.main,
                borderColor: theme.palette.success.main,
            }
            : status === "rejected"
                ? {
                    title: "Обратная связь не согласована",
                    bgcolor: theme.palette.error.main,
                    borderColor: theme.palette.error.main,
                }
                : {
                    title: "Обратная связь на согласовании",
                    bgcolor: "transparent",
                    borderColor: c.textMuted,
                };

    return (
        <Tooltip title={config.title}>
            <Box
                component="span"
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    bgcolor: config.bgcolor,
                    border: `1.5px solid ${config.borderColor}`,
                    display: "inline-block",
                }}
            />
        </Tooltip>
    );
}
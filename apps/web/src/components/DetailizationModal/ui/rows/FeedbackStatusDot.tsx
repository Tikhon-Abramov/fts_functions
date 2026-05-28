import type { Feedback, Row } from "src/entities/fts-function/types";

import {
    CancelRounded,
    CheckCircleRounded,
    RadioButtonUncheckedRounded,
} from "@mui/icons-material";
import { Box, Tooltip, useTheme } from "@mui/material";

import { isActualActionCategory } from "src/entities/fts-function/lib/detail-technology";

export type RowFeedbackAggregateStatus = "pending" | "rejected" | "accepted";

export type FeedbackStatusDotProps = {
    row: Row;
};

function getFeedbackItemStatus(
    feedback: Feedback,
): RowFeedbackAggregateStatus {
    if (feedback.isAccepted === true) return "accepted";
    if (feedback.isAccepted === false) return "rejected";

    return "pending";
}

export function getRowFeedbackAggregateStatus(
    row: Row,
): RowFeedbackAggregateStatus | null {
    if (!isActualActionCategory(row.category)) return null;

    const feedbacks = row.feedbacks ?? [];

    if (feedbacks.length === 0) return null;

    const statuses = feedbacks.map(getFeedbackItemStatus);

    if (statuses.includes("pending")) return "pending";
    if (statuses.includes("rejected")) return "rejected";

    return "accepted";
}

export function FeedbackStatusDot({ row }: FeedbackStatusDotProps) {
    const theme = useTheme();
    const c = theme.custom;

    const status = getRowFeedbackAggregateStatus(row);

    if (!status) return null;

    const title =
        status === "pending"
            ? "Есть обратная связь на согласовании"
            : status === "rejected"
                ? "Есть не согласованная обратная связь"
                : "Все обратные связи согласованы";

    const iconSx = {
        width: 15,
        height: 15,
        display: "block",
    };

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
                {status === "pending" ? (
                    <RadioButtonUncheckedRounded
                        sx={{
                            ...iconSx,
                            color: c.textMuted,
                        }}
                    />
                ) : status === "rejected" ? (
                    <CancelRounded
                        sx={{
                            ...iconSx,
                            color: theme.palette.error.main,
                        }}
                    />
                ) : (
                    <CheckCircleRounded
                        sx={{
                            ...iconSx,
                            color: theme.palette.success.main,
                        }}
                    />
                )}
            </Box>
        </Tooltip>
    );
}
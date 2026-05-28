import type { ReactNode } from "react";

import { Box, Button, Paper, Typography, useTheme } from "@mui/material";

/**
 * `EmptyState` — shared empty / "no results" placeholder used across
 * lists and tables (admin lists, registry home, etc).
 *
 * Mirrors the existing surface palette (`bgPaper` / `borderMain`) so
 * the empty card sits inside the page without a visual seam, and pulls
 * a muted label colour from `theme.custom.textSecondary` so the message
 * reads as *informational*, not *erroneous*.
 *
 * Two display contexts are supported:
 *  - inside a `Paper`-styled card (`variant="card"`, default) — used by
 *    admin lists where the card is the visual unit.
 *  - inline / no surrounding card (`variant="inline"`) — used inside
 *    pages that already supply a Paper wrapper (e.g. registry table).
 */
export const EMPTY_STATE_TEST_IDS = {
  ROOT: "empty-state",
  ICON: "empty-state-icon",
  TITLE: "empty-state-title",
  DESCRIPTION: "empty-state-description",
  PRIMARY_ACTION: "empty-state-primary-action",
  SECONDARY_ACTION: "empty-state-secondary-action",
} as const;

type EmptyStateVariant = "card" | "inline";

type EmptyStateProps = {
  /** A muted MUI icon node (e.g. `<InboxIcon />`). Rendered ~48px. */
  icon?: ReactNode | undefined;
  /** Short, bolded headline. */
  title: string;
  /** Optional paragraph under the title. */
  description?: string | undefined;
  /** Optional primary CTA. */
  primaryActionLabel?: string | undefined;
  onPrimaryAction?: (() => void) | undefined;
  /** Optional secondary CTA, typically "Сбросить фильтр". */
  secondaryActionLabel?: string | undefined;
  onSecondaryAction?: (() => void) | undefined;
  variant?: EmptyStateVariant | undefined;
  testId?: string | undefined;
};

const ICON_BOX_SX = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 48,
  mb: 2,
} as const;

export function EmptyState({
  icon,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = "card",
  testId,
}: EmptyStateProps) {
  const theme = useTheme();
  const c = theme.custom;

  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        py: variant === "card" ? 6 : 4,
        px: 3,
      }}
      data-testid={testId ?? EMPTY_STATE_TEST_IDS.ROOT}
    >
      {icon ? (
        <Box
          sx={{ ...ICON_BOX_SX, color: c.textMuted }}
          data-testid={EMPTY_STATE_TEST_IDS.ICON}
        >
          {icon}
        </Box>
      ) : null}
      <Typography
        variant="subtitle1"
        sx={{ color: c.textBright, fontWeight: 600, mb: description ? 1 : 0 }}
        data-testid={EMPTY_STATE_TEST_IDS.TITLE}
      >
        {title}
      </Typography>
      {description ? (
        <Typography
          variant="body2"
          sx={{ color: c.textSecondary, maxWidth: 420, mb: 3 }}
          data-testid={EMPTY_STATE_TEST_IDS.DESCRIPTION}
        >
          {description}
        </Typography>
      ) : null}
      {(primaryActionLabel || secondaryActionLabel) && (
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              variant="text"
              size="small"
              onClick={onSecondaryAction}
              data-testid={EMPTY_STATE_TEST_IDS.SECONDARY_ACTION}
              sx={{ textTransform: "none", color: c.textSecondary }}
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
          {primaryActionLabel && onPrimaryAction ? (
            <Button
              variant="contained"
              size="small"
              onClick={onPrimaryAction}
              data-testid={EMPTY_STATE_TEST_IDS.PRIMARY_ACTION}
              sx={{ textTransform: "none" }}
            >
              {primaryActionLabel}
            </Button>
          ) : null}
        </Box>
      )}
    </Box>
  );

  if (variant === "inline") {
    return content;
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: c.bgPaper,
        border: `1px solid ${c.borderMain}`,
        borderRadius: 2,
      }}
    >
      {content}
    </Paper>
  );
}

export default EmptyState;

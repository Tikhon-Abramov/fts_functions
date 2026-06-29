import type { ReactNode } from "react";
import { Box, Button, Paper, Typography, useTheme } from "@mui/material";


type EmptyStateProps = {
  icon?: ReactNode | undefined;
  title: string;
  description?: string | undefined;
  primaryActionLabel?: string | undefined;
  onPrimaryAction?: (() => void) | undefined;
  secondaryActionLabel?: string | undefined;
  onSecondaryAction?: (() => void) | undefined;
};


export function EmptyState(props: EmptyStateProps) {
  const theme = useTheme();
  const c = theme.custom;

  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: c.bgPaper,
        border: `1px solid ${c.borderMain}`,
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          py: 6,
          px: 3,
        }}
      >
        {props.icon ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              mb: 2,
              color: c.textMuted,
            }}
          >
            {props.icon}
          </Box>
        ) : null}
        <Typography
          variant="subtitle1"
          sx={{ color: c.textBright, fontWeight: 600, mb: props.description ? 1 : 0 }}
        >
          {props.title}
        </Typography>
        {props.description ? (
          <Typography
            variant="body2"
            sx={{ color: c.textSecondary, maxWidth: 420, mb: 3 }}
          >
            {props.description}
          </Typography>
        ) : null}
        {(props.primaryActionLabel || props.secondaryActionLabel) && (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {props.secondaryActionLabel && props.onSecondaryAction ? (
              <Button
                variant="text"
                size="small"
                onClick={props.onSecondaryAction}
                sx={{ textTransform: "none", color: c.textSecondary }}
              >
                {props.secondaryActionLabel}
              </Button>
            ) : null}
            {props.primaryActionLabel && props.onPrimaryAction ? (
              <Button
                variant="contained"
                size="small"
                onClick={props.onPrimaryAction}
                sx={{ textTransform: "none" }}
              >
                {props.primaryActionLabel}
              </Button>
            ) : null}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

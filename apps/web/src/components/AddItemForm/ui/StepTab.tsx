import type { Theme } from "@mui/material";
import type { SxProps } from "@mui/material/styles";
import type { FtsFunctionStep } from "src/entities/fts-function/model";

import { Button, Chip } from "@mui/material";
import { FTS_FUNCTION_STEP_NUMBER } from "src/entities/fts-function/model";

/**
 * Two-state visual variant for the step tab. Class 23 paired-ternary fix:
 * the active vs. inactive style sets are looked up by discriminator instead
 * of restated as ternaries inside `sx`.
 */
const StepTabVariant = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
type StepTabVariant = (typeof StepTabVariant)[keyof typeof StepTabVariant];

function styleByVariant(theme: Theme): Record<StepTabVariant, SxProps<Theme>> {
  const c = theme.custom;
  return {
    [StepTabVariant.ACTIVE]: {
      bgcolor: theme.palette.primary.main,
      "&:hover": { bgcolor: theme.palette.primary.dark },
    },
    [StepTabVariant.INACTIVE]: {
      borderColor: c.borderMedium,
      color: c.textSecondary,
      "&:hover": {
        borderColor: c.borderHover,
        bgcolor: c.hoverOverlayMed,
      },
    },
  };
}

function chipBgByVariant(theme: Theme): Record<StepTabVariant, string> {
  return {
    [StepTabVariant.ACTIVE]: "rgba(255,255,255,0.25)",
    [StepTabVariant.INACTIVE]: theme.palette.success.main,
  };
}

export type StepTabProps = {
  step: FtsFunctionStep;
  activeStep: FtsFunctionStep;
  label: string;
  filled: boolean;
  onSelect: () => void;
  theme: Theme;
};

/**
 * Tab pill for switching between the two add-item steps. Active vs. inactive
 * styles flow through the `StepTabVariant` registry; only the discriminator
 * is computed at the call site.
 */
export function StepTab({
  step,
  activeStep,
  label,
  filled,
  onSelect,
  theme,
}: StepTabProps) {
  const variant: StepTabVariant =
    step === activeStep ? StepTabVariant.ACTIVE : StepTabVariant.INACTIVE;
  const stepNumber = FTS_FUNCTION_STEP_NUMBER[step];
  return (
    <Button
      variant={variant === StepTabVariant.ACTIVE ? "contained" : "outlined"}
      size="small"
      onClick={onSelect}
      sx={{
        flex: 1,
        fontSize: "0.72rem",
        textTransform: "none",
        position: "relative",
        ...styleByVariant(theme)[variant],
      }}
      data-testid={`button-step-${stepNumber}`}
    >
      {label}
      {filled && (
        <Chip
          label="OK"
          size="small"
          sx={{
            ml: 0.5,
            height: 16,
            fontSize: "0.55rem",
            fontWeight: 700,
            bgcolor: chipBgByVariant(theme)[variant],
            color: "#fff",
            "& .MuiChip-label": { px: 0.5 },
          }}
          data-testid={`chip-filled-step-${stepNumber}`}
        />
      )}
    </Button>
  );
}

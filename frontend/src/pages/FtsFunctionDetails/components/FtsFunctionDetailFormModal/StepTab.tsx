import { type Theme, Button, Chip } from "@mui/material";


const StepTabVariant = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StepTabVariant = (typeof StepTabVariant)[keyof typeof StepTabVariant];

const FtsFunctionStep = {
  OBJECT_SELECTION: "OBJECT_SELECTION",
  CLUSTERING_IMPACT: "CLUSTERING_IMPACT",
} as const;

type FtsFunctionStep = (typeof FtsFunctionStep)[keyof typeof FtsFunctionStep];

type StepTabProps = {
  step: FtsFunctionStep;
  activeStep: FtsFunctionStep;
  label: string;
  filled: boolean;
  onSelect: () => void;
  theme: Theme;
};


export function StepTab({
  step,
  activeStep,
  label,
  filled,
  onSelect,
  theme,
}: StepTabProps) {
  const variant: StepTabVariant = step === activeStep ? StepTabVariant.ACTIVE : StepTabVariant.INACTIVE;

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
        ... {
          [StepTabVariant.ACTIVE]: {
            bgcolor: theme.palette.primary.main,
            "&:hover": { bgcolor: theme.palette.primary.dark },
          },
          [StepTabVariant.INACTIVE]: {
            borderColor: theme.custom.borderMedium,
            color: theme.custom.textSecondary,
            "&:hover": {
              borderColor: theme.custom.borderHover,
              bgcolor: theme.custom.hoverOverlayMed,
            },
          },
        }[variant],
      }}
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
            bgcolor: {
              [StepTabVariant.ACTIVE]: "rgba(255,255,255,0.25)",
              [StepTabVariant.INACTIVE]: theme.palette.success.main,
            }[variant],
            color: "#fff",
            "& .MuiChip-label": { px: 0.5 },
          }}
        />
      )}
    </Button>
  );
}

import type { CustomPalette } from "src/app/App";

import { Chip, useTheme } from "@mui/material";

/**
 * Visual emphasis variants for `CountChip`. Class 2 const-as-const registry —
 * call sites use `Emphasis.SUBTLE` / `Emphasis.ACCENT` rather than raw string
 * literals.
 */
export const Emphasis = {
  SUBTLE: "subtle",
  ACCENT: "accent",
} as const;
export type Emphasis = (typeof Emphasis)[keyof typeof Emphasis];

export type CountChipProps = {
  label: string;
  /** Painted "subtle" by default; pass `Emphasis.ACCENT` for the blue link variant. */
  emphasis?: Emphasis;
};

const COUNT_CHIP_HEIGHT = 18;

type CountChipStyle = {
  bgcolor: string;
  color: string;
  borderColor: string;
};

function styleByEmphasis(c: CustomPalette): Record<Emphasis, CountChipStyle> {
  return {
    [Emphasis.SUBTLE]: {
      bgcolor: c.chipSubtle,
      color: c.textSecondary,
      borderColor: c.borderMedium,
    },
    [Emphasis.ACCENT]: {
      bgcolor: c.linkCountChipBg,
      color: c.accentBlue,
      borderColor: c.accentBlue,
    },
  };
}

/**
 * Compact count badge used in the category banner. Replaces three identical
 * inline `<Chip>` blocks the modal used to copy-paste.
 */
export function CountChip({
  label,
  emphasis = Emphasis.SUBTLE,
}: CountChipProps) {
  const theme = useTheme();
  const style = styleByEmphasis(theme.custom)[emphasis];
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{
        fontSize: "0.6rem",
        height: COUNT_CHIP_HEIGHT,
        ...style,
        "& .MuiChip-label": { px: 0.5 },
      }}
    />
  );
}

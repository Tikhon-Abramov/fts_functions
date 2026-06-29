import { Chip, useTheme, type Theme } from "@mui/material";



export const Emphasis = {
  SUBTLE: "subtle",
  ACCENT: "accent",
} as const;
export type Emphasis = (typeof Emphasis)[keyof typeof Emphasis];

export type CountChipProps = {
  label: string;
  emphasis?: Emphasis;
};

type CountChipStyle = {
  bgcolor: string;
  color: string;
  borderColor: string;
};

function styleByEmphasis(t: Theme): Record<Emphasis, CountChipStyle> {
  return {
    [Emphasis.SUBTLE]: {
      bgcolor: t.custom.chipSubtle,
      color: t.custom.textSecondary,
      borderColor: t.custom.borderMedium,
    },
    [Emphasis.ACCENT]: {
      bgcolor: t.custom.linkCountChipBg,
      color: t.custom.accentBlue,
      borderColor: t.custom.accentBlue,
    },
  };
}



export function CountChip({ label, emphasis = Emphasis.SUBTLE }: CountChipProps) {
  const theme = useTheme();
  
  const style = styleByEmphasis(theme)[emphasis];

  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{
        fontSize: "0.6rem",
        height: 18,
        ...style,
        "& .MuiChip-label": { px: 0.5 },
      }}
    />
  );
}

import { Chip } from "@mui/material";



const TypeChipVariant = {
  OUTLINED: "outlined",
  FILLED: "filled",
} as const;

type TypeChipVariant = (typeof TypeChipVariant)[keyof typeof TypeChipVariant];

export type TypeChipProps = {
  code?: string | undefined;
  name: string;
  color?: string | null | undefined;
  size?: "small" | "medium" | undefined;
  variant?: TypeChipVariant | undefined;
  fallbackColor?: string | undefined;
};



export function TypeChip({
  code,
  name,
  color,
  size = "small",
  variant = TypeChipVariant.OUTLINED,
  fallbackColor,
}: TypeChipProps) {
  const c = color ?? fallbackColor;
  const colorStyleByVariant: Record<
    TypeChipVariant,
    (resolved: string) => Record<string, string>
  > = {
    [TypeChipVariant.OUTLINED]: (resolved) => ({
      borderColor: resolved,
      color: resolved,
    }),
    [TypeChipVariant.FILLED]: (resolved) => ({
      bgcolor: `${resolved}22`,
      color: resolved,
      borderColor: `${resolved}55`,
    }),
  };
  const colorStyle = c ? colorStyleByVariant[variant](c) : {};
  return (
    <Chip
      label={name}
      size={size}
      variant={variant}
      data-type-code={code}
      sx={{
        ...colorStyle,
        height: 22,
        fontSize: "0.7rem",
        "& .MuiChip-label": { px: 0.75 },
      }}
    />
  );
}

export default TypeChip;

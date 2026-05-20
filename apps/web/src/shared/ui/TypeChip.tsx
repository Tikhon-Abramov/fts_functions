import { Chip } from "@mui/material";

const TypeChipVariant = {
  OUTLINED: "outlined",
  FILLED: "filled",
} as const;
type TypeChipVariant = (typeof TypeChipVariant)[keyof typeof TypeChipVariant];

export type TypeChipProps = {
  /** Code from the backend Type dictionary (for keying / debugging). */
  code?: string | undefined;
  /** Display label. */
  name: string;
  /** HEX color resolved from the Type dictionary (nullable). */
  color?: string | null | undefined;
  size?: "small" | "medium" | undefined;
  variant?: TypeChipVariant | undefined;
  /** Color to fall back to when `color` is missing. */
  fallbackColor?: string | undefined;
  /** Optional testid for Playwright. */
  "data-testid"?: string | undefined;
};

/**
 * A compact Chip that renders a `Type` dictionary value (name + color).
 *
 * The color comes from the backend (per-row in the `type` table). Pieces of
 * UI that still only have the `name` string — not the full Type row — can
 * pass `fallbackColor` (or nothing) to keep the previous look until they are
 * migrated.
 */
export function TypeChip({
  code,
  name,
  color,
  size = "small",
  variant = TypeChipVariant.OUTLINED,
  fallbackColor,
  "data-testid": testid,
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
      data-testid={testid}
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

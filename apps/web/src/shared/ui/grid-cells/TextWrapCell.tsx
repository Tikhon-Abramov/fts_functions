/**
 * `TextWrapCell` — DataGrid cell that wraps long strings on word/grapheme
 * boundaries. Replaces seven near-identical `<Box sx={{ whiteSpace:"normal",
 * wordBreak:"break-word", lineHeight:1.35, width:"100%", py:0.5 }}>` blocks
 * that previously lived in `home.tsx`.
 */
import type { SxProps, Theme } from "@mui/material";
import type { ReactNode } from "react";

import { Box } from "@mui/material";

/**
 * Horizontal alignment variants accepted by `TextWrapCell`. Class 2 const-as-const
 * registry — call sites use `TextWrapCellAlign.CENTER` instead of bare `"center"`.
 */
export const TextWrapCellAlign = {
  LEFT: "left",
  CENTER: "center",
} as const;
export type TextWrapCellAlign =
  (typeof TextWrapCellAlign)[keyof typeof TextWrapCellAlign];

export type TextWrapCellProps = {
  children: ReactNode;
  align?: TextWrapCellAlign;
  /** Optional sx overrides merged on top of the base wrap styles. */
  sx?: SxProps<Theme>;
  "data-testid"?: string;
};

function buildBaseSx(align: TextWrapCellAlign): SxProps<Theme> {
  const base = {
    whiteSpace: "normal" as const,
    wordBreak: "break-word" as const,
    lineHeight: 1.35,
    width: "100%",
    py: 0.5,
    textAlign: align,
  };
  if (align === TextWrapCellAlign.CENTER) {
    return {
      ...base,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
  }
  return base;
}

export function TextWrapCell({
  children,
  align = TextWrapCellAlign.LEFT,
  sx,
  "data-testid": testId,
}: TextWrapCellProps) {
  const baseSx = buildBaseSx(align);
  // MUI `Box` accepts `SxProps<Theme>` (object | array | function) — merging
  // base + caller overrides via array form lets the override layer win.
  const merged: SxProps<Theme> = sx
    ? [baseSx, ...(Array.isArray(sx) ? sx : [sx])]
    : baseSx;
  return (
    <Box data-testid={testId} sx={merged}>
      {children}
    </Box>
  );
}

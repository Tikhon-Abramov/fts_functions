import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material";
import { Box } from "@mui/material";



export const TextWrapCellAlign = {
  LEFT: "left",
  CENTER: "center",
} as const;

export type TextWrapCellAlign = (typeof TextWrapCellAlign)[keyof typeof TextWrapCellAlign];

export type TextWrapCellProps = {
  children: ReactNode;
  align?: TextWrapCellAlign;
  sx?: SxProps<Theme>;
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
}: TextWrapCellProps) {
  const baseSx = buildBaseSx(align);
  const merged: SxProps<Theme> = sx
    ? [baseSx, ...(Array.isArray(sx) ? sx : [sx])]
    : baseSx;
  return (
    <Box sx={merged}>
      {children}
    </Box>
  );
}

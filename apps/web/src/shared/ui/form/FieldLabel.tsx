import type { ReactNode } from "react";

import { Typography, useTheme } from "@mui/material";

export type FieldLabelProps = {
  children: ReactNode;
  /** Override font size — defaults to 0.6rem (the canonical caption triad). */
  fontSize?: string;
  /** Optional bold caption variant (used for section headers). */
  bold?: boolean;
  /** Add bottom margin (block display). */
  block?: boolean;
};

/**
 * Canonical caption triad: textDim + 0.6rem + uppercase + letterSpacing 0.05em.
 * Replaces the hand-rolled Typography caption blocks across LinksPanel,
 * RowDetailsPanel, and AddItemForm. Per Class 26's anti-anti-pattern, this
 * lives in its own file as a real sub-component, so calling `useTheme()`
 * inside it is correct.
 */
export function FieldLabel({
  children,
  fontSize = "0.6rem",
  bold = false,
  block = false,
}: FieldLabelProps) {
  const theme = useTheme();
  return (
    <Typography
      variant="caption"
      sx={{
        color: theme.custom.textDim,
        fontSize,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontWeight: bold ? 600 : undefined,
        display: block ? "block" : undefined,
      }}
    >
      {children}
    </Typography>
  );
}

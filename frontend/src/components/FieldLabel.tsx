import type { ReactNode } from "react";
import { Typography, useTheme } from "@mui/material";



export type FieldLabelProps = {
  children: ReactNode;
  fontSize?: string;
  bold?: boolean;
  block?: boolean;
};


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

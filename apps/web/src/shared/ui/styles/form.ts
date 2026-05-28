import type { Theme } from "@mui/material";

/**
 * Shared MUI sx builders for form primitives across panels.
 * Single source of truth — replaces byte-identical sx blocks previously
 * duplicated in RowDetailsPanel and AddItemForm.
 */

export function formInputSx(theme: Theme) {
  const c = theme.custom;
  return {
    "& .MuiOutlinedInput-root": {
      bgcolor: c.bgInput,
      color: c.textBody,
      fontSize: "0.78rem",
      "& fieldset": { borderColor: c.borderMedium },
      "&:hover fieldset": { borderColor: c.borderHover },
      "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    },
    "& .MuiInputLabel-root": { color: c.textMuted, fontSize: "0.72rem" },
    "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main },
  } as const;
}

export function formSelectSx(theme: Theme) {
  const c = theme.custom;
  return {
    bgcolor: c.bgInput,
    color: c.textBody,
    fontSize: "0.78rem",
    "& fieldset": { borderColor: c.borderMedium },
    "&:hover fieldset": { borderColor: c.borderHover },
    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    "& .MuiSelect-icon": { color: c.textMuted },
  } as const;
}

export function formLabelSx(theme: Theme) {
  const c = theme.custom;
  return {
    color: c.textMuted,
    fontSize: "0.72rem",
    "&.Mui-focused": { color: theme.palette.primary.main },
  } as const;
}

export function formMenuSx(theme: Theme) {
  const c = theme.custom;
  return {
    PaperProps: {
      sx: {
        bgcolor: c.bgMenu,
        color: c.textBody,
        maxHeight: 200,
        border: `1px solid ${c.borderMain}`,
        "& .MuiMenuItem-root": {
          "&:hover": { bgcolor: c.hoverOverlayStrong },
          "&.Mui-selected": { bgcolor: c.selectedBg },
        },
      },
    },
  } as const;
}

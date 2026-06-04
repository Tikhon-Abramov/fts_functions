import type { Row } from "src/entities/fts-function/types";

import { Delete } from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import { resolveActionDisplay } from "src/entities/fts-function/lib/resolveActionDisplay";
import { FTS_FUNCTION_STEP_NUMBER } from "src/entities/fts-function/model";
import { useConstantControllerGetTypesV1Query } from "src/shared/api/ftsFunctionsApi";
import { DICTIONARY_QUERY_OPTIONS } from "src/shared/api/query-options";
import { I18N, useTranslation } from "src/shared/i18n";

export type LinkRowProps = {
  linkId: string;
  targetRow: Row;
  onNavigate: (id: string) => void;
  onRemove: (linkId: string) => void;
};

/**
 * Real sub-component (own file, own export, used multiple times) — Class 26
 * anti-anti-pattern allows `useTheme()` here.
 */
export function LinkRow({
  linkId,
  targetRow,
  onNavigate,
  onRemove,
}: LinkRowProps) {
  const { t } = useTranslation();
  const { data: typesAll = [] } = useConstantControllerGetTypesV1Query(
    {},
    DICTIONARY_QUERY_OPTIONS,
  );
  const theme = useTheme();
  const c = theme.custom;
  return (
    <ListItemButton
      onClick={() => onNavigate(targetRow.id)}
      sx={{
        py: 0.5,
        px: 1.5,
        borderRadius: 1,
        mx: 0.5,
        my: 0.25,
        "&:hover": { bgcolor: c.hoverOverlayStrong },
      }}
      data-testid={`link-item-${linkId}`}
    >
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Chip
              label={"Связь"}
              size="small"
              variant="outlined"
              sx={{
                fontSize: "0.58rem",
                height: 18,
                bgcolor: c.linkBadgeBg,
                color: c.linkBadgeColor,
                borderColor: c.linkBadgeBorder,
                "& .MuiChip-label": { px: 0.5 },
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: c.textBody,
                fontSize: "0.72rem",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {targetRow.detailText}
            </Typography>
          </Box>
        }
        secondary={
          <Typography
            variant="caption"
            sx={{ color: c.textMuted, fontSize: "0.6rem" }}
          >
            {t(I18N.linksPanel.stepLabel, {
              step: FTS_FUNCTION_STEP_NUMBER[targetRow.step],
            })}
            {targetRow.who ? ` · ${targetRow.who}` : ""} ·{" "}
            {resolveActionDisplay(typesAll, targetRow.actionLabel)}
          </Typography>
        }
      />
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(linkId);
        }}
        sx={{
          color: c.textMuted,
          "&:hover": { color: c.dangerHover },
          ml: 0.5,
          flexShrink: 0,
        }}
        data-testid={`button-remove-link-${linkId}`}
      >
        <Delete sx={{ fontSize: 14 }} />
      </IconButton>
    </ListItemButton>
  );
}

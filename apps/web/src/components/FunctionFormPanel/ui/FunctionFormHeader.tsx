import type { ReactNode } from "react";

import { Close, ExpandLess, ExpandMore } from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { formatAuditTimestamp } from "src/components/FunctionFormPanel/lib/formatAuditTimestamp";
export const FUNCTION_FORM_HEADER_TEST_IDS = {
  TOGGLE: "fn-form-toggle",
  TITLE: "text-form-title",
  CLOSE: "fn-form-close",
  TOGGLE_BUTTON: "button-toggle-form",
  AUDIT: "fn-form-header-audit",
} as const;

export type FunctionFormHeaderAudit = {
  createdAt: string;
  updatedAt: string;
};

export type FunctionFormHeaderProps = {
  title: string;
  icon: ReactNode;
  expanded: boolean;
  isEdit: boolean;
  showHint: boolean;
  onToggle: () => void;
  onClose: () => void;
  audit?: FunctionFormHeaderAudit | undefined;
};

export function FunctionFormHeader({
  title,
  icon,
  expanded,
  isEdit,
  showHint,
  onToggle,
  onClose,
  audit,
}: FunctionFormHeaderProps) {
  const theme = useTheme();
  const c = theme.custom;

  // Audit is meaningless until the form is open AND we have data (edit mode
  // only). Hiding it on collapse keeps the header bar visually identical to
  // the create-mode header — the only thing that should peek out at rest is
  // the title + chevron.
  const showAudit = Boolean(expanded && audit);

  return (
    <Box
      onClick={onToggle}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        cursor: "pointer",
        "&:hover": { bgcolor: c.hoverOverlay },
        transition: "background-color 0.15s",
      }}
      data-testid={FUNCTION_FORM_HEADER_TEST_IDS.TOGGLE}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {icon}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              color: c.textPrimary,
              fontSize: "0.82rem",
              fontWeight: 600,
              lineHeight: 1.3,
            }}
            data-testid={FUNCTION_FORM_HEADER_TEST_IDS.TITLE}
          >
            {title}
          </Typography>
          {showHint && (
            <Typography
              variant="caption"
              sx={{ color: c.textMuted, fontSize: "0.68rem" }}
            >
              {"Нажмите, чтобы добавить новую функцию"}
            </Typography>
          )}
        </Box>
      </Box>
      {showAudit && audit && (
        <HeaderAudit
          createdAt={audit.createdAt}
          updatedAt={audit.updatedAt}
          textColor={c.textMuted}
          labelColor={c.textDim}
        />
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
        {isEdit && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            sx={{ color: c.textMuted, "&:hover": { color: c.textPrimary } }}
            data-testid={FUNCTION_FORM_HEADER_TEST_IDS.CLOSE}
            title={"Закрыть"}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        <IconButton
          size="small"
          sx={{ color: c.textMuted }}
          data-testid={FUNCTION_FORM_HEADER_TEST_IDS.TOGGLE_BUTTON}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {expanded ? (
            <ExpandLess sx={{ fontSize: 20 }} />
          ) : (
            <ExpandMore sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}

type HeaderAuditProps = {
  createdAt: string;
  updatedAt: string;
  textColor: string;
  labelColor: string;
};

/**
 * Compact created/updated stamps that live flush-right of the title. Mirrors
 * the previous `FunctionAuditFooter` layout (label in dim caps + tabular-num
 * value) but at header scale: smaller font, single row, no top border.
 *
 * `flex: 1` + `justifyContent: flex-end` pushes the block to the right edge
 * while still letting it shrink before the action buttons on narrow screens.
 */
function HeaderAudit({
  createdAt,
  updatedAt,
  textColor,
  labelColor,
}: HeaderAuditProps) {
  const created = formatAuditTimestamp(createdAt);
  const updated = formatAuditTimestamp(updatedAt);
  const sameTime = created === updated;
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 0.25,
        fontSize: "0.7rem",
      }}
      data-testid={FUNCTION_FORM_HEADER_TEST_IDS.AUDIT}
    >
      <HeaderAuditEntry
        label="Создано"
        value={created}
        labelColor={labelColor}
        textColor={textColor}
      />
      {!sameTime && (
        <>
          <Box
            aria-hidden
            sx={{
              width: 80,
              borderTop: `1px solid ${labelColor}`,
              opacity: 0.4,
            }}
          />
          <HeaderAuditEntry
            label="Обновлено"
            value={updated}
            labelColor={labelColor}
            textColor={textColor}
          />
        </>
      )}
    </Box>
  );
}

type HeaderAuditEntryProps = {
  label: string;
  value: string;
  labelColor: string;
  textColor: string;
};

function HeaderAuditEntry({
  label,
  value,
  labelColor,
  textColor,
}: HeaderAuditEntryProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
      <Typography
        component="span"
        sx={{
          color: labelColor,
          fontSize: "inherit",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography
        component="span"
        sx={{
          color: textColor,
          fontSize: "inherit",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

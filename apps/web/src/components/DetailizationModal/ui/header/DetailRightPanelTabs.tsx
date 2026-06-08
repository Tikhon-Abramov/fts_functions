import type { RightTabDef } from "src/entities/fts-function/hooks/detail-modal/useRightTabConfig";

import { Box, Tab, Tabs, Tooltip, useTheme } from "@mui/material";

import { RightTab } from "src/entities/fts-function/model";
import { useTranslation } from "src/shared/i18n";

export type DetailRightPanelTabsProps = {
  value: RightTab;
  tabs: RightTabDef[];
  onChange: (next: RightTab) => void;
};

function getDisabledReason(tabId: RightTab): string {
  if (tabId === RightTab.LINKER) {
    return "Сначала выберите строку в таблице — её можно будет связать с другими функциями.";
  }

  if (tabId === RightTab.FEEDBACK) {
    return "Обратная связь доступна только для строк блока «Фактическое действие».";
  }

  return "Раздел временно недоступен.";
}

/**
 * Tab strip header for the right-side panel.
 *
 * Важно: прямыми children у <Tabs /> должны быть именно <Tab />.
 * Нельзя оборачивать disabled Tab в Tooltip/Box снаружи, иначе MUI Tabs
 * прокидывает props вроде fullWidth/indicator/textColor/selectionFollowsFocus
 * в DOM span, и React показывает warning.
 */
export function DetailRightPanelTabs({
  value,
  tabs,
  onChange,
}: DetailRightPanelTabsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;

  return (
    <Tabs
      value={value}
      onChange={(_, next: RightTab) => onChange(next)}
      variant="fullWidth"
      sx={{
        minHeight: 36,
        borderBottom: `1px solid ${c.borderMain}`,
        flexShrink: 0,
        "& .MuiTab-root": {
          minHeight: 36,
          py: 0.5,
          fontSize: "0.72rem",
          fontWeight: 500,
          color: c.textMuted,
          textTransform: "none",
          "&.Mui-selected": {
            color: c.textPrimary,
          },
          "&.Mui-disabled": {
            color: c.textMuted,
            opacity: 0.35,
            cursor: "not-allowed",
            pointerEvents: "auto",
          },
        },
        "& .MuiTabs-indicator": {
          bgcolor: theme.palette.primary.main,
          height: 2,
        },
      }}
    >
      {tabs.map((tab) => {
        const label = tab.label ?? (tab.i18nKey ? t(tab.i18nKey) : "");

        return (
          <Tab
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            data-testid={tab.testId}
            label={
              tab.disabled ? (
                <Tooltip title={getDisabledReason(tab.id)}>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    {label}
                  </Box>
                </Tooltip>
              ) : (
                label
              )
            }
          />
        );
      })}
    </Tabs>
  );
}

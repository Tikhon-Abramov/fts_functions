import type { RightTabDef } from "src/entities/fts-function/hooks/detail-modal/useRightTabConfig";

import { Box, Tab, Tabs, Tooltip, useTheme } from "@mui/material";
import { RightTab } from "src/entities/fts-function/model";
import { useTranslation } from "src/shared/i18n";

export type DetailRightPanelTabsProps = {
  value: RightTab;
  tabs: RightTabDef[];
  onChange: (next: RightTab) => void;
};

/**
 * Tab strip header for the right-side panel. Each `<Tab>` is rendered from
 * a config entry, so adding a tab requires only an extra entry.
 *
 * Disabled tabs (e.g. Linker without a selected row) get a stronger visual
 * treatment than MUI's default — opacity bump + tooltip explaining why —
 * so users understand the gating instead of clicking and seeing nothing.
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
          "&.Mui-selected": { color: c.textPrimary },
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
        const tabNode = (
          <Tab
            key={tab.id}
            value={tab.id}
            label={t(tab.i18nKey)}
            disabled={tab.disabled}
            data-testid={tab.testId}
          />
        );
        if (!tab.disabled) return tabNode;
        const reason =
          tab.id === RightTab.LINKER
            ? "Сначала выберите строку в таблице — её можно будет связать с другими функциями."
            : "Раздел временно недоступен.";
        return (
          <Tooltip key={tab.id} title={reason} arrow placement="bottom">
            <Box component="span" sx={{ flex: 1, display: "flex" }}>
              {tabNode}
            </Box>
          </Tooltip>
        );
      })}
    </Tabs>
  );
}

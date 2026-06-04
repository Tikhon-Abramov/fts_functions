import type { RightTabDef } from "src/entities/fts-function/hooks/detail-modal/useRightTabConfig";
import type { RightTab } from "src/entities/fts-function/model";

import { Box, useTheme } from "@mui/material";
import { DETAIL_RIGHT_PANEL_MIN_PX } from "src/shared/config/ui";

import { DetailRightPanelTabs } from "./DetailRightPanelTabs";

export type DetailRightPanelProps = {
  rightTab: RightTab;
  tabs: RightTabDef[];
  onTabChange: (next: RightTab) => void;
};

/**
 * Right-side tabbed panel. Tab strip + a single body slot — body content
 * comes from the active tab's `render` function, looked up by id.
 */
export function DetailRightPanel({
  rightTab,
  tabs,
  onTabChange,
}: DetailRightPanelProps) {
  const theme = useTheme();
  const c = theme.custom;
  const active = tabs.find((tab) => tab.id === rightTab);

  return (
    <Box
      sx={{
        borderLeft: `1px solid ${c.borderMain}`,
        bgcolor: c.bgSurface,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: DETAIL_RIGHT_PANEL_MIN_PX,
        height: "100%",
      }}
    >
      <DetailRightPanelTabs
        value={rightTab}
        tabs={tabs}
        onChange={onTabChange}
      />
      <Box sx={{ flex: 1, overflow: "hidden" }}>{active?.render() ?? null}</Box>
    </Box>
  );
}

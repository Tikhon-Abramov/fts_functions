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
 * Tab strip header for the right-side panel.
 * Each <Tab /> is rendered from a config entry, so adding a tab requires
 * only an extra entry.
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

                const tabNode = (
                    <Tab
                        key={tab.id}
                        value={tab.id}
                        label={label}
                        disabled={tab.disabled}
                        data-testid={tab.testId}
                    />
                );

                if (!tab.disabled) return tabNode;

                const reason =
                    tab.id === RightTab.LINKER
                        ? "Сначала выберите строку в таблице — её можно будет связать с другими функциями."
                        : tab.id === RightTab.FEEDBACK
                            ? "Обратная связь доступна только для строк блока «Фактическое действие»."
                            : "Раздел временно недоступен.";

                return (
                    <Tooltip key={tab.id} title={reason}>
                        <Box component="span" sx={{ flex: 1 }}>
                            {tabNode}
                        </Box>
                    </Tooltip>
                );
            })}
        </Tabs>
    );
}
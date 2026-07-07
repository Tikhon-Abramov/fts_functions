import { Box, Tab, Tabs, Tooltip, useTheme } from "@mui/material";
import type { OptionType } from "../../../utils/create-options";
import { FtsFunctionDetailInfo } from "./FtsFunctionDetailInfo/FtsFunctionDetailInfo";
import { RightTab, selectSelectedFtsFunctionCategory } from "../../../store/uiSlice";
import { useMemo, useState } from "react";
import { Actions } from "./Action/Actions";
import { Feedbacks } from "./Feedback/Feedbacks";
import { Relations } from "./Relations/Relations";
import { useAppSelector } from "../../../store";


type FtsFunctionDetailRightPanelProps = {
  options: {
    ftsFunctionStepOptions: OptionType[];
    ftsFunctionCategoryOptions: OptionType[];
    ftsFunctionComplexityOptions: OptionType[];
    ftsFunctionExecutionFrequencyOptions: OptionType[];
    whoPerformsActionOptions: OptionType[];
    personPerformingActionOptions: OptionType[];
    ftsFunctionActionTypeOptions: OptionType[];
    ftsFunctionEffectivenessOptions: OptionType[];
    technologicalSolutionOptions: OptionType[];
    feedbackSourceOptions: OptionType[];
    ftsMethodologyStatusOptions: OptionType[];
    responsibleOptions: OptionType[];
  };
};


type TabDataType = {
  key: RightTab;
  label: string;
  content: React.JSX.Element;
  disabled?: boolean;
}


function getDisabledReason(tabId: RightTab): string {
  if (tabId === RightTab.RELATIONS) {
    return "Сначала выберите строку в таблице — её можно будет связать с другими функциями.";
  }

  if (tabId === RightTab.FEEDBACK) {
    return "Обратная связь доступна только для строк блока «Фактическое действие».";
  }

  return "Раздел временно недоступен.";
}





export function FtsFunctionDetailRightPanel({ options }: FtsFunctionDetailRightPanelProps) {
  const theme = useTheme();
  const c = theme.custom;

  const selectedFtsFunctionCategory = useAppSelector(selectSelectedFtsFunctionCategory);

  const [currentTab, setCurrentTab] = useState<RightTab>(RightTab.DETAILS);

  const tabs = useMemo<TabDataType[]>(() => [
    {
      key: RightTab.DETAILS,
      label: 'Сведения',
      content: <FtsFunctionDetailInfo options={options} />
    },
    {
      key: RightTab.RELATIONS,
      label: 'Связи',
      content: <Relations />
    },
    {
      key: RightTab.FEEDBACK,
      label: 'Обратная связь',
      content: <Feedbacks />,
      disabled: selectedFtsFunctionCategory !== 'ACTUAL_ACTION',
    },
    {
      key: RightTab.ACTION,
      label: 'Операции',
      content: <Actions />
    },
  ], [options, selectedFtsFunctionCategory]);

  const activeContent = tabs.find((tab) => tab.key === currentTab)?.content ?? null;

  return (
    <Box
      sx={{
        borderLeft: `1px solid ${c.borderMain}`,
        bgcolor: c.bgSurface,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 320,
        height: "100%",
      }}
    >
      <Tabs
        value={currentTab}
        onChange={(_, next: RightTab) => setCurrentTab(next)}
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
        {tabs.map((tab) => (
            <Tab
              key={tab.key}
              value={tab.key}
              disabled={tab.disabled}
              label={
                tab.disabled ? (
                  <Tooltip title={getDisabledReason(tab.key)}>
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                      }}
                    >
                      {tab.label}
                    </Box>
                  </Tooltip>
                ) : (
                  tab.label
                )
              }
            />
          )
        )}
      </Tabs>
      


      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {activeContent}
      </Box>
    </Box>
  );
}

import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionDetailId } from "../../../../store/uiSlice";
import { useFtsFunctionDetailControllerGetFtsFunctionDetailByIdV1Query } from "../../../../store/ftsFunctionRegistry";
import type { OptionType } from "../../../../utils/create-options";
import { FtsFunctionDetailInfoView } from "./FtsFunctionDetailInfoView";
import { FtsFunctionDetailInfoEdit } from "./FtsFunctionDetailInfoEdit";

type FtsFunctionDetailInfoProps = {
  options: {
    ftsFunctionStepOptions: OptionType[];
    ftsFunctionCategoryOptions: OptionType[];
    ftsFunctionComplexityOptions: OptionType[];
    ftsFunctionExecutionFrequencyOptions: OptionType[];
    whoPerformsActionOptions: OptionType[];
    ftsFunctionActionTypeOptions: OptionType[];
    ftsFunctionEffectivenessOptions: OptionType[];
    technologicalSolutionOptions: OptionType[];
    feedbackSourceOptions: OptionType[];
    ftsMethodologyStatusOptions: OptionType[];
    responsibleOptions: OptionType[];
  };
};

export function FtsFunctionDetailInfo({ options }: FtsFunctionDetailInfoProps) {
  const theme = useTheme();
  const c = theme.custom;

  const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);

  const { data, isFetching } = useFtsFunctionDetailControllerGetFtsFunctionDetailByIdV1Query(
    selectedFtsFunctionDetailId ? { id: String(selectedFtsFunctionDetailId) } : skipToken,
  );
  const detail = data?.data;

  const [editing, setEditing] = useState(false);

  // При смене выбранной строки выходим из режима редактирования.
  useEffect(() => {
    setEditing(false);
  }, [selectedFtsFunctionDetailId]);

  if (!selectedFtsFunctionDetailId) {
    return (
      <Box
        sx={{
          height: "100%",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          textAlign: "center",
          bgcolor: c.bgSurface,
        }}
      >
        <Typography sx={{ color: c.textMuted, fontSize: "0.8rem", lineHeight: 1.4 }}>
          {"Выберите строку в таблице, чтобы увидеть сведения"}
        </Typography>
      </Box>
    );
  }

  if (isFetching || !detail) {
    return (
      <Box sx={{ p: 4, textAlign: "center", bgcolor: c.bgSurface, height: "100%" }}>
        <CircularProgress size={24} sx={{ color: c.accentBlue }} />
      </Box>
    );
  }

  if (editing) {
    return (
      <FtsFunctionDetailInfoEdit
        detail={detail}
        options={options}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return <FtsFunctionDetailInfoView detail={detail} onStartEdit={() => setEditing(true)} />;
}

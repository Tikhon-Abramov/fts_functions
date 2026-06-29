import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Typography, useTheme } from "@mui/material";
import { ChevronLeft, ChevronRight, Close } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../store";
import { selectFtsFunctionName, selectSelectedFtsFunctionDetailId, selectSelectedFtsFunctionId, setSelectedFtsFunction, setSelectedFtsFunctionDetail } from "../../store/uiSlice";
import { FtsFunctionDetailFormModal } from "./components/FtsFunctionDetailFormModal/FtsFunctionDetailFormModal";
import { useConstantControllerGetTypesV1Query, useFtsFunctionDetailControllerGetAllFtsFunctionDetailsV1Query } from "../../store/ftsFunctionRegistry";
import { FtsFunctionDetailGrid } from "./components/FtsFunctionDetailGrid/FtsFunctionDetailGrid";
import { skipToken } from "@reduxjs/toolkit/query";
import { createOtionsFromTypes } from "../../utils/create-options";
import { FtsFunctionDetailRightPanel } from "./components/FtsFunctionDetailRightPanel";



export function FtsFunctionDetails() {
  const theme = useTheme();
  const c = theme.custom;

  const dispatch = useAppDispatch();

  const selectedFtsFunctionName = useAppSelector(selectFtsFunctionName);
  const selectedFtsFunctionId = useAppSelector(selectSelectedFtsFunctionId);
  const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);

  const open = selectedFtsFunctionId !== null;

  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(selectedFtsFunctionDetailId !== null);

  useEffect(() => {
    setRightPanelOpen(selectedFtsFunctionDetailId !== null)
  }, [selectedFtsFunctionDetailId]);


  const { data: ftsFunctionStep } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_STEP'] });
  const { data: ftsFunctionCategory } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_CATEGORY'] });
  const { data: ftsFunctionComplexity } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_COMPLEXITY'] });
  const { data: ftsFunctionExecutionFrequency } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_EXECUTION_FREQUENCY'] });
  const { data: whoPerformsAction } = useConstantControllerGetTypesV1Query({ categories: ['WHO_PERFORMS_ACTION'] });
  const { data: ftsFunctionActionType } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_ACTION_TYPE'] });
  const { data: ftsFunctionEffectiveness } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_EFFECTIVENESS'] });
  const { data: technologicalSolution } = useConstantControllerGetTypesV1Query({ categories: ['TECHNOLOGICAL_SOLUTION'] });
  const { data: feedbackSource } = useConstantControllerGetTypesV1Query({ categories: ['FEEDBACK_SOURCE'] });
  const { data: ftsMethodologyStatus } = useConstantControllerGetTypesV1Query({ categories: ['FTS_METHODOLOGY_STATUS'] });
  const { data: responsible } = useConstantControllerGetTypesV1Query({ categories: ['RESPONSIBLE'] });

  const ftsFunctionStepOptions = useMemo(() => createOtionsFromTypes(ftsFunctionStep), [ftsFunctionStep]);
  const ftsFunctionCategoryOptions = useMemo(() => createOtionsFromTypes(ftsFunctionCategory), [ftsFunctionCategory]);
  const ftsFunctionComplexityOptions = useMemo(() => createOtionsFromTypes(ftsFunctionComplexity), [ftsFunctionComplexity]);
  const ftsFunctionExecutionFrequencyOptions = useMemo(() => createOtionsFromTypes(ftsFunctionExecutionFrequency), [ftsFunctionExecutionFrequency]);
  const whoPerformsActionOptions = useMemo(() => createOtionsFromTypes(whoPerformsAction), [whoPerformsAction]);
  const ftsFunctionActionTypeOptions = useMemo(() => createOtionsFromTypes(ftsFunctionActionType), [ftsFunctionActionType]);
  const ftsFunctionEffectivenessOptions = useMemo(() => createOtionsFromTypes(ftsFunctionEffectiveness), [ftsFunctionEffectiveness]);
  const technologicalSolutionOptions = useMemo(() => createOtionsFromTypes(technologicalSolution), [technologicalSolution]);
  const feedbackSourceOptions = useMemo(() => createOtionsFromTypes(feedbackSource), [feedbackSource]);
  const ftsMethodologyStatusOptions = useMemo(() => createOtionsFromTypes(ftsMethodologyStatus), [ftsMethodologyStatus]);
  const responsibleOptions = useMemo(() => createOtionsFromTypes(responsible), [responsible]);

  const options = useMemo(() => ({
    ftsFunctionStepOptions,
    ftsFunctionCategoryOptions,
    ftsFunctionComplexityOptions,
    ftsFunctionExecutionFrequencyOptions,
    whoPerformsActionOptions,
    ftsFunctionActionTypeOptions,
    ftsFunctionEffectivenessOptions,
    technologicalSolutionOptions,
    feedbackSourceOptions,
    ftsMethodologyStatusOptions,
    responsibleOptions,
  }), [
    ftsFunctionStepOptions,
    ftsFunctionCategoryOptions,
    ftsFunctionComplexityOptions,
    ftsFunctionExecutionFrequencyOptions,
    whoPerformsActionOptions,
    ftsFunctionActionTypeOptions,
    ftsFunctionEffectivenessOptions,
    technologicalSolutionOptions,
    feedbackSourceOptions,
    ftsMethodologyStatusOptions,
    responsibleOptions,
  ]);

  const { data: ftsFunctionDetailsData, isLoading, isError } = useFtsFunctionDetailControllerGetAllFtsFunctionDetailsV1Query(
    selectedFtsFunctionId ? { ftsFunctionId: selectedFtsFunctionId } : skipToken,
    {
      pollingInterval: 0,
      skipPollingIfUnfocused: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const ftsFunctionDetails = useMemo(() => ftsFunctionDetailsData?.data?.itemsByCategory, [ftsFunctionDetailsData?.data?.itemsByCategory]);
  const meta = useMemo(() => ftsFunctionDetailsData?.data?.meta, [ftsFunctionDetailsData?.data?.meta]);

  const handleCloseDetails = useCallback(() => {
    dispatch(setSelectedFtsFunction({}));
  }, [dispatch]);

  const handleToggleRight = useCallback(() => {
    setRightPanelOpen(value => !value);
  }, []);

  const handleGridBackgroundClick = useCallback(() => {
    dispatch(setSelectedFtsFunctionDetail(null));
  }, [dispatch]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseDetails}
        fullScreen
        slotProps={{
          paper: {
            sx: {
              bgcolor: c.bgDeep,
              color: c.textBody,
              overflow: "hidden",
            },
          },
          backdrop: {
            sx: {
              bgcolor: theme.palette.mode === "dark" ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            px: 3,
            py: 1.5,
            borderBottom: `1px solid ${c.borderMain}`,
            flexShrink: 0,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{ color: c.textBright, fontWeight: 600, fontSize: "1.1rem" }}
            >
              {"Детализация"}
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: c.textMuted, fontSize: "0.75rem" }}
            >
              {selectedFtsFunctionName}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: c.textDim, fontSize: "0.7rem" }}
            >
              Шаг 1: {meta?.stepOne ?? 0}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: c.textDim, fontSize: "0.7rem" }}
            >
              Шаг 2: {meta?.stepTwo ?? 0}
            </Typography>
            {/* <Typography
              variant="caption"
              sx={{ color: c.textDim, fontSize: "0.7rem" }}
            >
              Связей: {meta?.countRelations ?? 0}
            </Typography> */}
            <Button
              onClick={() => setAddModalOpen(true)}
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                bgcolor: c.selectedBg,
                color: c.markerGreen,
                boxShadow: "none",
                "&:hover": {
                  color: c.bgMenu,
                  bgcolor: c.markerGreen,
                  boxShadow: "none",
                },
              }}
            >
              {"Добавить"}
            </Button>

            <IconButton
              onClick={handleCloseDetails}
              sx={{ color: c.textSecondary, "&:hover": { color: c.textBright } }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            minHeight: 0,
            height: "100%",
            display: "flex",
            overflow: "hidden",
            bgcolor: c.bgDeep,
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              overflow: "auto",
            }}
            onClick={handleGridBackgroundClick}
          >
            {isLoading && (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress size={24} sx={{ color: c.accentBlue }} />
              </Box>
            )}
            {isError && (
              <Box sx={{ p: 4, textAlign: "center", color: c.textMuted }}>
                <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                  Не удалось загрузить детализацию функции
                </Typography>
              </Box>
            )}

            {ftsFunctionDetails && (
              <FtsFunctionDetailGrid data={ftsFunctionDetails} />
            )}
          </Box>

          <Box
            sx={{
              width: rightPanelOpen ? '30vw' : 48,
              minWidth: rightPanelOpen ? 420 : 48,
              maxWidth: rightPanelOpen ? 620 : 48,
              borderLeft: `1px solid ${c.borderMain}`,
              bgcolor: c.bgSurface,
              display: "flex",
              flexDirection: "column",
              transition: "width 0.2s ease, min-width 0.2s ease",
              overflow: "hidden",
            }}
          >
            <Button
              startIcon={
                rightPanelOpen ? (
                  <ChevronRight sx={{ fontSize: 18 }} />
                ) : (
                  <ChevronLeft sx={{ fontSize: 18 }} />
                )
              }
              onClick={handleToggleRight}
              sx={{
                borderBottom: `1px solid ${c.borderMain}`,
                borderRadius: 0,
                py: 1,
                textTransform: "none",
                fontSize: "0.75rem",
                color: c.textSecondary,
                justifyContent: rightPanelOpen ? "flex-start" : "center",
                px: 1.5,
                minWidth: 0,
                "& .MuiButton-startIcon": {
                  mr: rightPanelOpen ? 1 : 0,
                  ml: 0,
                },
                "&:hover": {
                  bgcolor: c.hoverOverlayStrong,
                  color: c.textPrimary,
                },
              }}
              data-testid="button-toggle-right-panel"
            >
              {rightPanelOpen ? "Скрыть панель" : ""}
            </Button>

            {rightPanelOpen ? (
              <FtsFunctionDetailRightPanel options={options} />
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  color: c.textMuted,
                  fontSize: "0.72rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Панель
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <FtsFunctionDetailFormModal
        options={options}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </>
  );
}
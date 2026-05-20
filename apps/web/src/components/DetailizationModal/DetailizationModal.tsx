import type { RightTab } from "src/entities/fts-function/model";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Snackbar,
  useTheme,
} from "@mui/material";
import { useDetailActions } from "src/entities/fts-function/hooks/detail-modal/useDetailActions";
import { useRightTabConfig } from "src/entities/fts-function/hooks/detail-modal/useRightTabConfig";
import { useRowPresentation } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import { useSelectionLinks } from "src/entities/fts-function/hooks/detail-modal/useSelectionLinks";
import { useStepRowsModel } from "src/entities/fts-function/hooks/detail-modal/useStepRowsModel";
import {
  useConstantControllerGetTypesV1Query,
  useFtsFunctionControllerGetByIdV1Query,
} from "src/shared/api/ftsFunctionsApi";
import {
  DETAIL_QUERY_OPTIONS,
  DICTIONARY_QUERY_OPTIONS,
} from "src/shared/api/query-options";
import { SNACKBAR } from "src/shared/config/snackbar";
import { DETAIL_RIGHT_PANEL_DEFAULT_PX } from "src/shared/config/ui";
import { useTranslation } from "src/shared/i18n";
import { useAppDispatch, useAppSelector } from "src/shared/store";
import {
  closeModal,
  hideSnackbar,
  selectModalFunctionId,
  selectRightTab,
  selectSelectedRowId,
  selectSnackbar,
  setRightTab as setRightTabAction,
  setSelectedRowId,
  toggleSelectedRow,
} from "src/shared/store/uiSlice";

import AddItemForm from "../AddItemForm/AddItemForm";
import LinkPicker from "../LinkPicker/LinkPicker";
import LinksPanel from "../LinksPanel/LinksPanel";
import RowDetailsPanel from "../RowDetailsPanel/RowDetailsPanel";

import { DetailStepGrid } from "./ui/grid/DetailStepGrid";
import { DetailHeader } from "./ui/header/DetailHeader";
import { DetailRightPanel } from "./ui/header/DetailRightPanel";

export default function DetailizationModal() {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;

  const dispatch = useAppDispatch();
  const modalFunctionId = useAppSelector(selectModalFunctionId);
  const selectedId = useAppSelector(selectSelectedRowId);
  const rightTab = useAppSelector(selectRightTab) as RightTab;
  const snackbar = useAppSelector(selectSnackbar);

  const detailQuery = useFtsFunctionControllerGetByIdV1Query(
    { id: modalFunctionId ?? "" },
    { skip: !modalFunctionId, ...DETAIL_QUERY_OPTIONS },
  );
  const { data: typesAll } = useConstantControllerGetTypesV1Query(
    {},
    DICTIONARY_QUERY_OPTIONS,
  );

  // Right-side card visibility — local-only, defaults to hidden so the modal
  // opens with the table at full width. Toggled via the full-width button at
  // the bottom of the rail. Width animates between the rail (collapsed) and
  // `DETAIL_RIGHT_PANEL_DEFAULT_PX` (expanded).
  const [rightOpen, setRightOpen] = useState(false);
  const handleToggleRight = useCallback(() => setRightOpen((v) => !v), []);

  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const functionRecord = detailQuery.data ?? null;
  const model = useStepRowsModel(functionRecord, typesAll);
  const { linkedIds, selectedLinks, selectedRow } = useSelectionLinks(
    model.links,
    selectedId,
    model.rowMap,
  );
  const presentation = useRowPresentation(selectedId, linkedIds);
  const actions = useDetailActions({
    modalFunctionId,
    selectedId,
    rowMap: model.rowMap,
    links: model.links,
    typesAll,
    t,
  });

  const handleRowClick = useCallback(
    (id: string) => {
      dispatch(toggleSelectedRow(id));
    },
    [dispatch],
  );
  const handleNavigate = useCallback(
    (id: string) => {
      dispatch(setSelectedRowId(id));
      const el = rowRefs.current.get(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [dispatch],
  );
  const handleClose = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);
  const handleTabChange = useCallback(
    (next: RightTab) => {
      dispatch(setRightTabAction(next));
    },
    [dispatch],
  );
  const handleSnackbarClose = useCallback(() => {
    dispatch(hideSnackbar());
  }, [dispatch]);
  const registerRowRef = useCallback(
    (id: string) => (el: HTMLTableRowElement | null) => {
      if (el) rowRefs.current.set(id, el);
      else rowRefs.current.delete(id);
    },
    [],
  );

  const tabs = useRightTabConfig({
    hasSelectedRow: selectedRow !== null,
    renderLinks: () => (
      <LinksPanel
        selectedRow={selectedRow}
        allLinks={selectedLinks}
        rowMap={model.rowMap}
        onNavigate={handleNavigate}
        onRemoveLink={actions.removeLink}
      />
    ),
    renderDetails: () => (
      <RowDetailsPanel
        row={selectedRow}
        typesAll={typesAll}
        onUpdateRow={actions.updateRow}
      />
    ),
    renderAdd: () => (
      <AddItemForm
        allRows={model.rows}
        typesAll={typesAll ?? []}
        onSaveSingle={actions.addRow}
        onSaveDual={actions.saveDual}
        onQuickLink={actions.quickLink}
      />
    ),
    renderLinker: () =>
      selectedRow ? (
        <LinkPicker
          sourceRow={selectedRow}
          allRows={model.rows}
          existingLinks={model.links}
          onCreateLinks={actions.createLinks}
        />
      ) : null,
  });

  if (!modalFunctionId) return null;

  const modalTitle = functionRecord?.ftsFunctionName?.name ?? "";
  const backdropBg =
    theme.palette.mode === "dark" ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)";

  return (
    <>
      <Dialog
        open
        onClose={handleClose}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: c.bgPaper,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
        slotProps={{ backdrop: { sx: { bgcolor: backdropBg } } }}
      >
        <DetailHeader
          title={modalTitle}
          step1Count={model.step1Count}
          step2Count={model.step2Count}
          linkCount={model.links.length}
          onClose={handleClose}
        />
        <DialogContent
          sx={{ p: 0, flex: 1, display: "flex", overflow: "hidden" }}
        >
          <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <Box sx={{ flex: 1, overflow: "auto", minWidth: 0 }}>
              <DetailStepGrid
                isLoading={detailQuery.isLoading}
                isError={detailQuery.isError && !detailQuery.isLoading}
                step1ByCategory={model.step1ByCategory}
                step2ByCategory={model.step2ByCategory}
                step1IndexMap={model.step1IndexMap}
                step2IndexMap={model.step2IndexMap}
                linkCountsPerCategory={model.linkCountsPerCategory}
                presentation={presentation}
                colorByCode={model.colorByCode}
                onRowClick={handleRowClick}
                onRemoveRow={actions.removeRow}
                registerRowRef={registerRowRef}
              />
            </Box>
            <Box
              sx={{
                width: rightOpen ? DETAIL_RIGHT_PANEL_DEFAULT_PX : 48,
                flexShrink: 0,
                transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                borderLeft: `1px solid ${c.borderMain}`,
                bgcolor: c.bgPaper,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              data-testid="right-rail"
            >
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                  visibility: rightOpen ? "visible" : "hidden",
                }}
              >
                <DetailRightPanel
                  rightTab={rightTab}
                  tabs={tabs}
                  onTabChange={handleTabChange}
                />
              </Box>
              <Button
                onClick={handleToggleRight}
                fullWidth
                size="small"
                startIcon={
                  rightOpen ? (
                    <ChevronRight sx={{ fontSize: 18 }} />
                  ) : (
                    <ChevronLeft sx={{ fontSize: 18 }} />
                  )
                }
                sx={{
                  borderTop: `1px solid ${c.borderMain}`,
                  borderRadius: 0,
                  py: 1,
                  textTransform: "none",
                  fontSize: "0.75rem",
                  color: c.textSecondary,
                  justifyContent: rightOpen ? "flex-start" : "center",
                  px: 1.5,
                  minWidth: 0,
                  "& .MuiButton-startIcon": {
                    mr: rightOpen ? 1 : 0,
                    ml: 0,
                  },
                  "&:hover": {
                    bgcolor: c.hoverOverlayStrong,
                    color: c.textPrimary,
                  },
                }}
                data-testid="button-toggle-right-panel"
              >
                {rightOpen ? "Скрыть панель" : ""}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={SNACKBAR.AUTO_HIDE_MS_SHORT}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        sx={{
          "& .MuiSnackbarContent-root": {
            bgcolor: c.bgSnack,
            color: c.textPrimary,
            border: `1px solid ${c.borderMedium}`,
            fontSize: "0.8rem",
          },
        }}
      />
    </>
  );
}

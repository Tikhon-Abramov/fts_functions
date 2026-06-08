import type { Row } from "src/entities/fts-function/types";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Snackbar,
    Typography,
    useTheme,
} from "@mui/material";
import { useDetailActions } from "src/entities/fts-function/hooks/detail-modal/useDetailActions";
import { useRightTabConfig } from "src/entities/fts-function/hooks/detail-modal/useRightTabConfig";
import { useRowPresentation } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import { useSelectionLinks } from "src/entities/fts-function/hooks/detail-modal/useSelectionLinks";
import { useStepRowsModel } from "src/entities/fts-function/hooks/detail-modal/useStepRowsModel";
import { isActualActionCategory } from "src/entities/fts-function/lib/detail-technology";
import {
    FtsFunctionStep,
    RightTab,
    type RightTab as RightTabValue,
} from "src/entities/fts-function/model";
import {
    useConstantControllerGetTypesV1Query,
    useFtsFunctionControllerGetByIdV1Query,
} from "src/shared/api/ftsFunctionsApi";
import {
    DETAIL_QUERY_OPTIONS,
    DICTIONARY_QUERY_OPTIONS,
} from "src/shared/api/query-options";
import { SNACKBAR } from "src/shared/config/snackbar";
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
} from "src/shared/store/uiSlice";

import ActionPanel from "../ActionPanel/ActionPanel";
import AddItemForm, { type NewRowData } from "../AddItemForm/AddItemForm";
import FeedbackPanel from "../FeedbackPanel/FeedbackPanel";
import LinkPicker from "../LinkPicker/LinkPicker";
import LinksPanel from "../LinksPanel/LinksPanel";
import RowDetailsPanel from "../RowDetailsPanel/RowDetailsPanel";
import { DetailStepGrid } from "./ui/grid/DetailStepGrid";
import { DetailHeader } from "./ui/header/DetailHeader";
import { DetailRightPanel } from "./ui/header/DetailRightPanel";

const DETAIL_RIGHT_PANEL_WIDTH = "30vw";
const DETAIL_RIGHT_PANEL_MIN_WIDTH = 420;
const DETAIL_RIGHT_PANEL_MAX_WIDTH = 620;
const DETAIL_RIGHT_PANEL_COLLAPSED_WIDTH = 48;

type AddRowPayload = Partial<Row> & {
    step: NewRowData["step"];
    category: NewRowData["category"];
    detailText: string;
    actionLabel: NewRowData["actionLabel"];
    algorithmFile?: File | null;
};

type NewRowDataExtended = NewRowData &
    Partial<Pick<Row, "actionsСompleteness" | "actionsEffectiveness">>;

function toAddRowPayload(data: NewRowData): AddRowPayload {
    const extended = data as NewRowDataExtended;

    const payload: AddRowPayload = {
        step: data.step,
        category: data.category,
        detailText: data.detailText,
        actionLabel: data.actionLabel,
    };

    if (data.who !== undefined) payload.who = data.who;
    if (data.periodicity !== undefined) payload.periodicity = data.periodicity;
    if (data.complexity !== undefined) payload.complexity = data.complexity;
    if (data.artifact !== undefined) payload.artifact = data.artifact;
    if (data.basis !== undefined) payload.basis = data.basis;

    if (data.artifactUsage !== undefined) {
        payload.artifactUsage = data.artifactUsage;
    }

    if (data.purpose !== undefined) payload.purpose = data.purpose;

    if (extended.actionsСompleteness !== undefined) {
        payload.actionsСompleteness = extended.actionsСompleteness;
    }

    if (extended.actionsEffectiveness !== undefined) {
        payload.actionsEffectiveness = extended.actionsEffectiveness;
    }

    if (data.technologicalSolution !== undefined) {
        payload.technologicalSolution = data.technologicalSolution;
    }

    if (data.number !== undefined) payload.number = data.number;
    if (data.responsible !== undefined) payload.responsible = data.responsible;
    if (data.algorithm !== undefined) payload.algorithm = data.algorithm;

    if (data.algorithmFile !== undefined) {
        payload.algorithmFile = data.algorithmFile;
    }

    return payload;
}

export default function DetailizationModal() {
    const { t } = useTranslation();
    const theme = useTheme();
    const c = theme.custom;
    const dispatch = useAppDispatch();

    const modalFunctionId = useAppSelector(selectModalFunctionId);
    const selectedId = useAppSelector(selectSelectedRowId);
    const rightTab = useAppSelector(selectRightTab) as RightTabValue;
    const snackbar = useAppSelector(selectSnackbar);

    const detailQuery = useFtsFunctionControllerGetByIdV1Query(
        { id: modalFunctionId ?? "" },
        { skip: !modalFunctionId, ...DETAIL_QUERY_OPTIONS },
    );

    const { data: typesAll } = useConstantControllerGetTypesV1Query(
        {},
        DICTIONARY_QUERY_OPTIONS,
    );

    const [rightOpen, setRightOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

    const functionRecord = detailQuery.data ?? null;
    const model = useStepRowsModel(functionRecord, typesAll);

    const { linkedIds, selectedLinks, selectedRow } = useSelectionLinks(
        model.links,
        selectedId,
        model.rowMap,
    );

    const hasFeedbackRow = Boolean(
        selectedRow && isActualActionCategory(selectedRow.category),
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

    const handleToggleRight = useCallback(() => {
        setRightOpen((value) => !value);
    }, []);

    const handleOpenAdd = useCallback(() => {
        setAddOpen(true);
    }, []);

    const handleCloseAdd = useCallback(() => {
        setAddOpen(false);
    }, []);

    const handleSaveSingle = useCallback(
        async (data: NewRowData): Promise<string> => {
            const createdId = await actions.addRow(toAddRowPayload(data));

            if (createdId) {
                setAddOpen(false);
                void detailQuery.refetch();
            }

            return createdId;
        },
        [actions, detailQuery],
    );

    const handleSaveDetachedDual = useCallback(
        async (s1: Omit<NewRowData, "step">, s2: Omit<NewRowData, "step">) => {
            await actions.addRow(
                toAddRowPayload({
                    step: FtsFunctionStep.OBJECT_SELECTION,
                    ...s1,
                }),
            );

            await actions.addRow(
                toAddRowPayload({
                    step: FtsFunctionStep.CLUSTERING_IMPACT,
                    ...s2,
                }),
            );

            setAddOpen(false);
            void detailQuery.refetch();
        },
        [actions, detailQuery],
    );

    const handleRowClick = useCallback(
        (id: string) => {
            if (selectedId === id) {
                dispatch(setSelectedRowId(null));
                setRightOpen(false);

                return;
            }

            dispatch(setSelectedRowId(id));
            setRightOpen(true);
        },
        [dispatch, selectedId],
    );

    const handleGridBackgroundClick = useCallback(() => {
        if (!selectedId) return;

        dispatch(setSelectedRowId(null));
        setRightOpen(false);
    }, [dispatch, selectedId]);

    const handleNavigate = useCallback(
        (id: string) => {
            dispatch(setSelectedRowId(id));
            setRightOpen(true);

            const element = rowRefs.current.get(id);

            if (element) {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        },
        [dispatch],
    );

    const handleClose = useCallback(() => {
        dispatch(closeModal());
    }, [dispatch]);

    const handleTabChange = useCallback(
        (next: RightTabValue) => {
            dispatch(setRightTabAction(next));
        },
        [dispatch],
    );

    const handleSnackbarClose = useCallback(() => {
        dispatch(hideSnackbar());
    }, [dispatch]);

    const registerRowRef = useCallback(
        (id: string) => (element: HTMLTableRowElement | null) => {
            if (element) {
                rowRefs.current.set(id, element);
            } else {
                rowRefs.current.delete(id);
            }
        },
        [],
    );

    const tabs = useRightTabConfig({
        hasSelectedRow: selectedRow !== null,
        hasFeedbackRow,
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
                typesAll={typesAll ?? []}
                onUpdateRow={actions.updateRow}
                onUploadAlgorithmFile={actions.uploadAlgorithmFile}
            />
        ),
        renderFeedback: () =>
            selectedRow ? (
                <FeedbackPanel
                    row={selectedRow}
                    typesAll={typesAll ?? []}
                    onCreateFeedback={actions.createFeedback}
                    onUpdateFeedback={actions.updateFeedback}
                    onSetFeedbackAcceptance={actions.setFeedbackAcceptance}
                    onDeleteFeedback={actions.deleteFeedback}
                />
            ) : null,
        renderLinker: () =>
            selectedRow ? (
                <LinkPicker
                    sourceRow={selectedRow}
                    allRows={model.rows}
                    existingLinks={model.links}
                    onCreateLinks={actions.createLinks}
                />
            ) : null,
        renderAction: () =>
            selectedRow ? (
                <ActionPanel
                    row={selectedRow}
                    typesAll={typesAll ?? []}
                    onCreateAction={actions.createAction}
                    onUpdateAction={actions.updateAction}
                    onDeleteAction={actions.deleteAction}
                />
            ) : null,
    });

    if (!modalFunctionId) return null;

    const modalTitle = functionRecord?.ftsFunctionName?.name ?? "";

    const backdropBg =
        theme.palette.mode === "dark" ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)";

    const visibleRightTab =
        rightTab === RightTab.ADD ||
        (rightTab === RightTab.FEEDBACK && !hasFeedbackRow) ||
        (rightTab === RightTab.ACTION && !selectedRow)
            ? RightTab.DETAILS
            : rightTab;

    return (
        <>
            <Dialog
                open={Boolean(modalFunctionId)}
                onClose={handleClose}
                fullScreen
                PaperProps={{
                    sx: {
                        bgcolor: c.bgDeep,
                        color: c.textBody,
                        overflow: "hidden",
                    },
                }}
                BackdropProps={{
                    sx: {
                        bgcolor: backdropBg,
                    },
                }}
            >
                <DetailHeader
                    title={modalTitle}
                    step1Count={model.step1Count}
                    step2Count={model.step2Count}
                    linkCount={model.links.length}
                    onAdd={handleOpenAdd}
                    onClose={handleClose}
                />

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
                        <DetailStepGrid
                            isLoading={detailQuery.isFetching}
                            isError={detailQuery.isError}
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
                            width: rightOpen
                                ? DETAIL_RIGHT_PANEL_WIDTH
                                : DETAIL_RIGHT_PANEL_COLLAPSED_WIDTH,
                            minWidth: rightOpen
                                ? DETAIL_RIGHT_PANEL_MIN_WIDTH
                                : DETAIL_RIGHT_PANEL_COLLAPSED_WIDTH,
                            maxWidth: rightOpen
                                ? DETAIL_RIGHT_PANEL_MAX_WIDTH
                                : DETAIL_RIGHT_PANEL_COLLAPSED_WIDTH,
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
                                rightOpen ? (
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

                        {rightOpen ? (
                            <DetailRightPanel
                                rightTab={visibleRightTab}
                                tabs={tabs}
                                onTabChange={handleTabChange}
                            />
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
                                {"Панель"}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog
                open={addOpen}
                onClose={handleCloseAdd}
                fullWidth
                maxWidth="lg"
                PaperProps={{
                    sx: {
                        bgcolor: c.bgPaper,
                        color: c.textBody,
                        border: `1px solid ${c.borderMain}`,
                        maxHeight: "90vh",
                    },
                }}
            >
                <AddItemForm
                    allRows={model.rows}
                    typesAll={typesAll ?? []}
                    onSaveSingle={handleSaveSingle}
                    onSaveDual={handleSaveDetachedDual}
                    onQuickLink={actions.quickLink}
                    showQuickLink
                />
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={SNACKBAR.AUTO_HIDE_MS}
                onClose={handleSnackbarClose}
                message={snackbar.message}
                anchorOrigin={{
                    vertical: SNACKBAR.ANCHOR_VERTICAL,
                    horizontal: SNACKBAR.ANCHOR_HORIZONTAL,
                }}
            />
        </>
    );
}
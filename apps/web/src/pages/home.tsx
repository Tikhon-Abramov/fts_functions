/**
 * `Home` — orchestration shell for the FTS-function registry page.
 *
 * Reads the full filtered list in one go via RTK Query — RTK's tag-based
 * invalidation refetches automatically after any mutation. Filter/sort/search
 * stay server-side via the translators.
 */
import type { Theme } from "@mui/material";
import type {
    GridFilterModel,
    GridRowProps,
    GridSortModel,
} from "@mui/x-data-grid";
import type { FunctionRecord } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    DarkMode,
    InboxOutlined,
    Layers,
    LightMode,
    Search as SearchIcon,
    SearchOff,
} from "@mui/icons-material";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Paper,
    Skeleton,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import { DataGrid, GridRow } from "@mui/x-data-grid";
import { ruRU } from "@mui/x-data-grid/locales";

import DetailizationModal from "src/components/DetailizationModal/DetailizationModal";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import FunctionFormPanel from "src/components/FunctionFormPanel/FunctionFormPanel";
import {
    translateFilterModel,
    translateSortModel,
} from "src/entities/fts-function/api/list-translators";
import {
    buildConstantsLookup,
    mapFtsFunctionApiToFunctionRecord,
} from "src/entities/fts-function/api/mappers";
import {
    createFunctionColumns,
    MARKER_DEBT_SETTLEMENT_CODE,
} from "src/entities/fts-function/config/columns";
import { useTypeColorLookup } from "src/entities/fts-function/hooks/colors/useTypeColorLookup";
import {
      UserSlot,
      useUsersBySlot,
  } from "src/entities/fts-function/hooks/selectors/useUsersBySlot";
import { useDictionary } from "src/entities/fts-function/hooks/data/useDictionary";
import {
    useConstantControllerGetTypesV1Query,
    useConstantControllerGetUsersV1Query,
    useFtsFunctionControllerListV1Query,
    useFtsFunctionControllerSoftDeleteV1Mutation,
} from "src/shared/api/ftsFunctionsApi";
import {
    DICTIONARY_QUERY_OPTIONS,
    LIST_QUERY_OPTIONS,
} from "src/shared/api/query-options";
import { DEBOUNCE_MS, HEAD_HEIGHT, ROW_HEIGHT } from "src/shared/config";
import { useDebouncedValue } from "src/shared/hooks/useDebouncedValue";
import { useTranslation } from "src/shared/i18n";
import { useAppDispatch, useAppSelector } from "src/shared/store";
import {
    closeDeleteDialog,
    closeEditPanel,
    openDeleteDialog,
    openEditPanel,
    openModal,
    type PersistedFilterModel,
    type PersistedSortModel,
    selectDeleteDialog,
    selectEditingId,
    selectFilterModel,
    selectPanelExpanded,
    selectPanelMode,
    selectSearchInput,
    selectSortModel,
    selectThemeMode,
    setCaptchaInput,
    setFilterModel,
    setSearchInput,
    setSortModel,
    togglePanelExpanded,
    toggleTheme,
} from "src/shared/store/uiSlice";
import { registryGridSx } from "src/shared/ui/styles/registryGrid";
import { ThemeMode } from "src/shared/ui/theme-mode";

import { Category } from "@registry/shared/enums";

import { useExportFtsFunctionsMutation } from '../shared/api/baseApi'

import { SnackbarSeverity, useSnackbar } from "src/shared/ui/snackbar";



export const HOME_TEST_IDS = {
    TABLE: "functions-table",
    PAGE_TITLE: "text-page-title",
    TOGGLE_THEME: "button-toggle-theme",
    DOWNLOAD: "button-download",
    TABLE_TITLE: "text-table-title",
    SEARCH_INPUT: "input-search",
    SEARCH_CLEAR: "button-search-clear",
    FILTERS_CLEAR: "button-filters-clear",
    FN_COUNT: "text-fn-count",
    LIST_ERROR: "text-list-error",
    DELETE_DIALOG_TITLE: "text-delete-dialog-title",
    DELETE_FUNCTION_NAME: "text-delete-function-name",
    DELETE_CONFIRM_QUESTION: "text-delete-confirm-question",
    DELETE_CAPTCHA_PROMPT: "text-delete-captcha-prompt",
    CAPTCHA_INPUT: "input-captcha",
    DELETE_NO: "button-delete-no",
    DELETE_YES: "button-delete-yes",
    DELETE_CANCEL: "button-delete-cancel",
    DELETE_CONFIRM: "button-delete-confirm",
} as const;

const PAGE_MAX_WIDTH_PX = 1600;
const SEARCH_INPUT_MAX_WIDTH_PX = 320;
const ROW_BUFFER_PX = 2000;
const HEADER_ICON_SIZE_PX = 36;

const EMPTY_FILTER_MODEL: GridFilterModel = { items: [] };

function findMarkerDebtSettlementName(
    types: TypeResponseDto[],
): string | undefined {
    return types.find(
        (type) =>
            type.category === Category.FTS_FUNCTION_MARKER &&
            type.code === MARKER_DEBT_SETTLEMENT_CODE,
    )?.name;
}

function hasFilterValue(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0;
    if (value == null) return false;

    return String(value).trim().length > 0;
}

function hasActiveGridFilters(model: GridFilterModel): boolean {
    return model.items.some((item) => hasFilterValue(item.value));
}

export default function Home() {
    const { t } = useTranslation();
    const theme = useTheme();
    const c = theme.custom;

    const dispatch = useAppDispatch();

    const mode = useAppSelector(selectThemeMode);
    const deleteDialog = useAppSelector(selectDeleteDialog);

    const { data: typesAll = [] } = useConstantControllerGetTypesV1Query(
        {},
        DICTIONARY_QUERY_OPTIONS,
    );

    const { data: usersAll = [] } = useConstantControllerGetUsersV1Query(
        {},
        DICTIONARY_QUERY_OPTIONS,
    );

    const [softDeleteFn] = useFtsFunctionControllerSoftDeleteV1Mutation();

    const  [downloadReport, { isLoading: isExportUsersLoading }] = useExportFtsFunctionsMutation();

    const { optionsByCategory } = useDictionary(typesAll);
    const lookupTypeByName = useTypeColorLookup(typesAll);

  
  const curatorCAUsers = useUsersBySlot(usersAll, UserSlot.CURATOR_CA);
  const deptHeadCAUsers = useUsersBySlot(usersAll, UserSlot.DEPT_HEAD_CA);
  const managerMiudolUsers = useUsersBySlot(usersAll, UserSlot.MANAGER_MIUDOL);
  const deptHeadMiudolUsers = useUsersBySlot(
      usersAll,
      UserSlot.DEPT_HEAD_MIUDOL,
  );

  const userOptionsBySlot = useMemo(() => {
      const toOption = (user: (typeof usersAll)[number]) => ({
          value: user.id,
          label: user.shortName ?? user.fullName ?? `ID ${user.id}`,
      });
      return {
          [UserSlot.CURATOR_CA]: curatorCAUsers.map(toOption),
          [UserSlot.DEPT_HEAD_CA]: deptHeadCAUsers.map(toOption),
          [UserSlot.MANAGER_MIUDOL]: managerMiudolUsers.map(toOption),
          [UserSlot.DEPT_HEAD_MIUDOL]: deptHeadMiudolUsers.map(toOption),
      };
  }, [
      curatorCAUsers,
      deptHeadCAUsers,
      managerMiudolUsers,
      deptHeadMiudolUsers,
  ]);

    const panelMode = useAppSelector(selectPanelMode);
    const editingIdRaw = useAppSelector(selectEditingId);
    const editingId = editingIdRaw ?? undefined;
    const panelExpanded = useAppSelector(selectPanelExpanded);

    const persistedFilterModel = useAppSelector(selectFilterModel);
    const persistedSortModel = useAppSelector(selectSortModel);
    const searchInput = useAppSelector(selectSearchInput);

    const filterModel = persistedFilterModel as GridFilterModel;
    const sortModel = persistedSortModel as GridSortModel;

    const panelRef = useRef<HTMLDivElement | null>(null);

    const handleFilterModelChange = useCallback(
        (next: GridFilterModel) => {
            dispatch(setFilterModel(next as PersistedFilterModel));
        },
        [dispatch],
    );

    const handleSortModelChange = useCallback(
        (next: GridSortModel) => {
            dispatch(setSortModel(next as PersistedSortModel));
        },
        [dispatch],
    );

    const handleSearchChange = useCallback(
        (next: string) => {
            dispatch(setSearchInput(next));
        },
        [dispatch],
    );

    const debouncedSearch = useDebouncedValue(
        searchInput.trim(),
        DEBOUNCE_MS.SEARCH,
    );

    const baseArgs = useMemo(
        () => ({
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
            ...translateFilterModel(filterModel),
            ...translateSortModel(sortModel),
        }),
        [debouncedSearch, filterModel, sortModel],
    );

    const listQuery = useFtsFunctionControllerListV1Query(
        baseArgs,
        LIST_QUERY_OPTIONS,
    );

    const rows = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
    const loading = listQuery.isFetching;
    const isError = listQuery.isError;

    const filteredTotal = listQuery.data?.filteredTotal ?? 0;
    const overallTotal = listQuery.data?.overallTotal ?? 0;

    const lookup = useMemo(
        () => buildConstantsLookup(typesAll, usersAll),
        [typesAll, usersAll],
    );

    const functions = useMemo(
        () => rows.map((item) => mapFtsFunctionApiToFunctionRecord(item, lookup)),
        [rows, lookup],
    );

    const deleteTarget = deleteDialog.targetId
        ? (functions.find((item) => String(item.id) === deleteDialog.targetId) ??
            null)
        : null;

    const markerDebtSettlementName = useMemo(
        () => findMarkerDebtSettlementName(typesAll),
        [typesAll],
    );
    
    const { showMessage } = useSnackbar();

    const hasActiveFilters = hasActiveGridFilters(filterModel);
    const hasActiveSearch = Boolean(searchInput.trim());
    const hasActiveSearchOrFilters = hasActiveSearch || hasActiveFilters;

    const handleOpenEdit = useCallback(
        (id: number) => {
            dispatch(openEditPanel(id));

            requestAnimationFrame(() => {
                panelRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            });
        },
        [dispatch],
    );

    const handleTogglePanel = useCallback(() => {
        dispatch(togglePanelExpanded());
    }, [dispatch]);

    const handleCancelEdit = useCallback(() => {
        dispatch(closeEditPanel());
    }, [dispatch]);

    const handleRequestDelete = useCallback(
        (id: number) => {
            dispatch(openDeleteDialog(String(id)));
        },
        [dispatch],
    );

    const handleOpenDetails = useCallback(
        (id: number) => {
            dispatch(openModal(String(id)));
        },
        [dispatch],
    );

    const expectedDeleteCaptcha = deleteDialog.targetId
        ? `delete id ${deleteDialog.targetId}`
        : "";

    const handleConfirmDelete = useCallback(async () => {
        if (
            !deleteDialog.targetId ||
            deleteDialog.captchaInput !== expectedDeleteCaptcha
        ) {
            return;
        }

        const deletedId = Number(deleteDialog.targetId);

        await softDeleteFn({ id: deletedId })
            .unwrap()
            .catch((error: unknown) => {
                // eslint-disable-next-line no-console
                console.error(error);
            });

        dispatch(closeDeleteDialog());
    }, [
        deleteDialog.targetId,
        deleteDialog.captchaInput,
        expectedDeleteCaptcha,
        softDeleteFn,
        dispatch,
    ]);

    const handleCloseDeleteDialog = useCallback(() => {
        dispatch(closeDeleteDialog());
    }, [dispatch]);

    const handleCaptchaChange = useCallback(
        (raw: string) => {
            dispatch(setCaptchaInput(raw));
        },
        [dispatch],
    );

    const handleToggleTheme = useCallback(() => {
        dispatch(toggleTheme());
    }, [dispatch]);

    const handleDownload = useCallback(async () => {
        try {
            await downloadReport().unwrap();
            showMessage("Файл успешно скачан", SnackbarSeverity.SUCCESS);
        } catch (error) {
            console.error('Export failed:', error);
            showMessage("Ошибка при скачивании файла", SnackbarSeverity.ERROR);
        }   
    }, [downloadReport, dispatch]);

    const handleClearSearch = useCallback(() => {
        dispatch(setSearchInput(""));
    }, [dispatch]);

    const handleResetSearchAndFilters = useCallback(() => {
        dispatch(setSearchInput(""));
        dispatch(setFilterModel(EMPTY_FILTER_MODEL as PersistedFilterModel));
    }, [dispatch]);

    const columns = useMemo(
        () =>
            createFunctionColumns({
                t,
                theme,
                optionsByCategory,
                userOptionsBySlot,
                markerDebtSettlementName,
                lookupTypeByName,
                editingId,
                onEdit: handleOpenEdit,
                onCloseEdit: handleCancelEdit,
                onDelete: handleRequestDelete,
                onOpenDetails: handleOpenDetails,
            }),
        [
            t,
            theme,
            optionsByCategory,
            userOptionsBySlot,
            markerDebtSettlementName,
            lookupTypeByName,
            editingId,
            handleOpenEdit,
            handleCancelEdit,
            handleRequestDelete,
            handleOpenDetails,
        ],
    );

    const hasFirstResponse = listQuery.data !== undefined;
    const showLoadingOverlay = !hasFirstResponse && !isError;
    const showStatusOverlay = isError || showLoadingOverlay;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: c.bgDeep,
                color: c.textBody,
                px: { xs: 1.5, md: 3 },
                py: 2,
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    maxWidth: PAGE_MAX_WIDTH_PX,
                    mx: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <RegistryHeader
                    theme={theme}
                    mode={mode}
                    onToggleTheme={handleToggleTheme}
                    onDownload={handleDownload}
                />

                <Box ref={panelRef}>
                    <FunctionFormPanel
                        expanded={panelExpanded}
                        onToggleExpanded={handleTogglePanel}
                        mode={panelMode}
                        editingFunctionId={editingId}
                        onCancelEdit={handleCancelEdit}
                    />
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: c.bgPaper,
                        border: `1px solid ${c.borderMain}`,
                        borderRadius: 2,
                        overflow: "hidden",
                        minHeight: 520,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <RegistryToolbar
                        theme={theme}
                        searchInput={searchInput}
                        isSearching={loading && hasFirstResponse}
                        shown={functions.length}
                        filteredTotal={filteredTotal}
                        overallTotal={overallTotal}
                        hasActiveFilters={hasActiveFilters}
                        onSearchChange={handleSearchChange}
                        onClearSearch={handleClearSearch}
                        onClearFilters={handleResetSearchAndFilters}
                    />

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {showStatusOverlay ? (
                            <ListStatus
                                showSkeleton={showLoadingOverlay}
                                isError={isError}
                                mutedColor={c.textMuted}
                            />
                        ) : (
                            <DataGrid
                                rows={functions}
                                columns={columns}
                                getRowId={(row) => row.id}
                                isCellEditable={() => false}
                                disableRowSelectionOnClick
                                hideFooter
                                localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
                                filterModel={filterModel}
                                onFilterModelChange={handleFilterModelChange}
                                filterMode="server"
                                sortModel={sortModel}
                                onSortModelChange={handleSortModelChange}
                                sortingMode="server"
                                columnHeaderHeight={HEAD_HEIGHT}
                                getRowHeight={() => "auto"}
                                getEstimatedRowHeight={() => ROW_HEIGHT}
                                rowBufferPx={ROW_BUFFER_PX}
                                data-testid={HOME_TEST_IDS.TABLE}
                                getRowClassName={() => "fts-fn-row"}
                                sx={registryGridSx(c)}
                                slots={{
                                    row: (props: GridRowProps) => <GridRow {...props} />,
                                    noRowsOverlay: () => (
                                        <RegistryNoRowsOverlay
                                            hasActiveSearchOrFilters={hasActiveSearchOrFilters}
                                            onReset={handleResetSearchAndFilters}
                                        />
                                    ),
                                }}
                            />
                        )}
                    </Box>
                </Paper>
            </Box>

            <DetailizationModal />

            <DeleteFunctionDialog
                theme={theme}
                open={Boolean(deleteDialog.targetId)}
                targetName={deleteTarget?.name ?? null}
                expectedCaptcha={expectedDeleteCaptcha}
                captchaInput={deleteDialog.captchaInput}
                onClose={handleCloseDeleteDialog}
                onCaptchaChange={handleCaptchaChange}
                onConfirm={handleConfirmDelete}
            />
        </Box>
    );
}

type RegistryHeaderProps = {
    theme: Theme;
    mode: ThemeMode;
    onToggleTheme: () => void;
    onDownload: () => void;
};

function RegistryHeader({ theme, mode, onToggleTheme, onDownload }: RegistryHeaderProps) {
    const c = theme.custom;

    const headerIconButtonSx = {
        color: c.textSecondary,
        border: `1px solid ${c.borderMain}`,
        "&:hover": { bgcolor: c.hoverOverlay },
    } as const;

    return (
        <Paper
            elevation={0}
            sx={{
                bgcolor: c.bgPaper,
                border: `1px solid ${c.borderMain}`,
                borderRadius: 2,
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                    sx={{
                        width: HEADER_ICON_SIZE_PX,
                        height: HEADER_ICON_SIZE_PX,
                        borderRadius: 1.5,
                        bgcolor: c.hoverOverlay,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: c.accentBlue,
                    }}
                >
                    <Layers sx={{ fontSize: 20 }} />
                </Box>

                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            color: c.textPrimary,
                            fontWeight: 700,
                            lineHeight: 1.15,
                        }}
                        data-testid={HOME_TEST_IDS.PAGE_TITLE}
                    >
                        {"Реестр функций"}
                    </Typography>

                    <Typography
                        variant="caption"
                        sx={{ color: c.textSecondary, fontSize: "0.74rem" }}
                    >
                        {"Функциональный анализ · Управление функциями и детализация"}
                    </Typography>
                </Box>
            </Box>


            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton
                    onClick={onDownload}
                    size="small"
                    sx={headerIconButtonSx}
                    data-testid={HOME_TEST_IDS.DOWNLOAD}
                >
                    <DownloadIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                    onClick={onToggleTheme}
                    size="small"
                    sx={headerIconButtonSx}
                    data-testid={HOME_TEST_IDS.TOGGLE_THEME}
                >
                    {mode === ThemeMode.DARK ? (
                        <LightMode sx={{ fontSize: 18 }} />
                    ) : (
                        <DarkMode sx={{ fontSize: 18 }} />
                    )}
                </IconButton>
            </Box>
        </Paper>
    );
}

type RegistryToolbarProps = {
    theme: Theme;
    searchInput: string;
    isSearching: boolean;
    shown: number;
    filteredTotal: number;
    overallTotal: number;
    hasActiveFilters: boolean;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
    onClearFilters: () => void;
};

function RegistryToolbar({
                             theme,
                             searchInput,
                             isSearching,
                             shown,
                             filteredTotal,
                             overallTotal,
                             hasActiveFilters,
                             onSearchChange,
                             onClearSearch,
                             onClearFilters,
                         }: RegistryToolbarProps) {
    const c = theme.custom;

    return (
        <Box
            sx={{
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${c.borderLight}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
            }}
        >
            <Box>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: c.textPrimary,
                        fontWeight: 700,
                        lineHeight: 1.2,
                    }}
                    data-testid={HOME_TEST_IDS.TABLE_TITLE}
                >
                    {"Список функций"}
                </Typography>

                <RegistryCounter
                    shown={shown}
                    filteredTotal={filteredTotal}
                    overallTotal={overallTotal}
                    mutedColor={c.textMuted}
                />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {hasActiveFilters && (
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={onClearFilters}
                        sx={{
                            height: 30,
                            textTransform: "none",
                            fontSize: "0.74rem",
                            borderColor: c.borderMain,
                            color: c.textSecondary,
                            "&:hover": {
                                borderColor: c.borderHover,
                                bgcolor: c.hoverOverlay,
                            },
                        }}
                        data-testid={HOME_TEST_IDS.FILTERS_CLEAR}
                    >
                        {"Сбросить фильтры"}
                    </Button>
                )}

                <TextField
                    value={searchInput}
                    onChange={(event) => onSearchChange(event.target.value)}
                    size="small"
                    placeholder={"Поиск по функциям..."}
                    data-testid={HOME_TEST_IDS.SEARCH_INPUT}
                    sx={{
                        width: SEARCH_INPUT_MAX_WIDTH_PX,
                        "& .MuiOutlinedInput-root": {
                            height: 30,
                            fontSize: "0.78rem",
                            bgcolor: c.hoverOverlay,
                        },
                        "& .MuiOutlinedInput-input": {
                            py: 0,
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                {isSearching ? (
                                    <CircularProgress size={14} sx={{ color: c.textMuted }} />
                                ) : (
                                    <SearchIcon sx={{ fontSize: 17, color: c.textMuted }} />
                                )}
                            </InputAdornment>
                        ),
                        endAdornment: searchInput ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={onClearSearch}
                                    data-testid={HOME_TEST_IDS.SEARCH_CLEAR}
                                    sx={{ p: 0.25, color: c.textMuted }}
                                >
                                    <CloseIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                />
            </Box>
        </Box>
    );
}

type RegistryCounterProps = {
    shown: number;
    filteredTotal: number;
    overallTotal: number;
    mutedColor: string;
};

const COUNTER_BOLD_SX = {
    fontWeight: 600,
    fontSize: "inherit",
    color: "inherit",
} as const;

function RegistryCounter({
                             shown,
                             filteredTotal,
                             overallTotal,
                             mutedColor,
                         }: RegistryCounterProps) {
    return (
        <Typography
            variant="caption"
            sx={{ color: mutedColor, fontSize: "0.72rem" }}
            data-testid={HOME_TEST_IDS.FN_COUNT}
        >
            {"Отображено"}{" "}
            <Box component="span" sx={COUNTER_BOLD_SX}>
                {shown}
            </Box>{" "}
            {"из"}{" "}
            <Box component="span" sx={COUNTER_BOLD_SX}>
                {filteredTotal}
            </Box>
            {", всего"}{" "}
            <Box component="span" sx={COUNTER_BOLD_SX}>
                {overallTotal}
            </Box>
        </Typography>
    );
}

type ListStatusProps = {
    showSkeleton: boolean;
    isError: boolean;
    mutedColor: string;
};

const STATUS_OVERLAY_SX = {
    p: 4,
    textAlign: "center",
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
} as const;

const SKELETON_VIEWPORT_RESERVE_PX = 280;
const SKELETON_ROW_HEIGHT_PX = 48;
const SKELETON_MIN_ROWS = 6;
const SKELETON_MAX_ROWS = 24;

function useSkeletonRowCount(): number {
    const compute = (): number => {
        if (typeof window === "undefined") return SKELETON_MIN_ROWS;

        const usable = window.innerHeight - SKELETON_VIEWPORT_RESERVE_PX;
        const fit = Math.floor(usable / SKELETON_ROW_HEIGHT_PX);

        return Math.min(SKELETON_MAX_ROWS, Math.max(SKELETON_MIN_ROWS, fit));
    };

    const [count, setCount] = useState(compute);

    useEffect(() => {
        const onResize = (): void => setCount(compute());

        window.addEventListener("resize", onResize);

        return () => window.removeEventListener("resize", onResize);
    }, []);

    return count;
}

function TableSkeleton() {
    const rowCount = useSkeletonRowCount();

    return (
        <Box sx={{ width: "100%", p: 2 }}>
            {Array.from({ length: rowCount }).map((_, index) => (
                <Skeleton
                    key={index}
                    variant="rounded"
                    height={36}
                    sx={{ mb: 1, bgcolor: "rgba(148, 163, 184, 0.12)" }}
                />
            ))}
        </Box>
    );
}

function ListStatus({ showSkeleton, isError, mutedColor }: ListStatusProps) {
    if (isError) {
        return (
            <Box sx={STATUS_OVERLAY_SX}>
                <Typography
                    sx={{ color: mutedColor, fontSize: "0.85rem" }}
                    data-testid={HOME_TEST_IDS.LIST_ERROR}
                >
                    {"Не удалось загрузить список функций"}
                </Typography>
            </Box>
        );
    }

    if (showSkeleton) {
        return <TableSkeleton />;
    }

    return null;
}

type RegistryNoRowsOverlayProps = {
    hasActiveSearchOrFilters: boolean;
    onReset: () => void;
};

function RegistryNoRowsOverlay({
                                   hasActiveSearchOrFilters,
                                   onReset,
                               }: RegistryNoRowsOverlayProps) {
    return (
        <Box
            sx={{
                minHeight: 260,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
            }}
        >
            <EmptyState
                icon={
                    hasActiveSearchOrFilters ? (
                        <SearchOff sx={{ fontSize: 34 }} />
                    ) : (
                        <InboxOutlined sx={{ fontSize: 34 }} />
                    )
                }
                title={
                    hasActiveSearchOrFilters
                        ? "По заданным фильтрам ничего не найдено."
                        : "Функций ещё нет"
                }
                secondaryActionLabel={
                    hasActiveSearchOrFilters ? "Сбросить поиск и фильтры" : undefined
                }
                onSecondaryAction={hasActiveSearchOrFilters ? onReset : undefined}
            />
        </Box>
    );
}

type DeleteFunctionDialogProps = {
    theme: Theme;
    open: boolean;
    targetName: string | null;
    expectedCaptcha: string;
    captchaInput: string;
    onClose: () => void;
    onCaptchaChange: (value: string) => void;
    onConfirm: () => void | Promise<void>;
};

const DANGER_HOVER_DARK = "#dc2626";
const DANGER_HOVER_LIGHT = "#b91c1c";
const BACKDROP_DARK = "rgba(0,0,0,0.6)";
const BACKDROP_LIGHT = "rgba(0,0,0,0.4)";

function DeleteFunctionDialog({
                                  theme,
                                  open,
                                  targetName,
                                  expectedCaptcha,
                                  captchaInput,
                                  onClose,
                                  onCaptchaChange,
                                  onConfirm,
                              }: DeleteFunctionDialogProps) {
    const c = theme.custom;
    const isDarkMode = theme.palette.mode === ThemeMode.DARK;

    const captchaMatches =
        captchaInput.length > 0 && captchaInput === expectedCaptcha;

    const captchaWrong =
        captchaInput.length >= expectedCaptcha.length && !captchaMatches;

    const dangerHoverStrong = isDarkMode
        ? DANGER_HOVER_DARK
        : DANGER_HOVER_LIGHT;

    const backdropColor = isDarkMode ? BACKDROP_DARK : BACKDROP_LIGHT;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                backdrop: {
                    sx: {
                        bgcolor: backdropColor,
                    },
                },
                paper: {
                    sx: {
                        bgcolor: c.bgPaper,
                        color: c.textBody,
                        border: `1px solid ${c.borderMain}`,
                    },
                },
            }}
        >
            <DialogTitle
                sx={{ color: c.textPrimary, fontWeight: 700 }}
                data-testid={HOME_TEST_IDS.DELETE_DIALOG_TITLE}
            >
                {"Подтверждение удаления"}
            </DialogTitle>

            <DialogContent>
                {targetName && (
                    <Box sx={{ mb: 2 }}>
                        <Typography
                            variant="caption"
                            sx={{ color: c.textMuted, display: "block", mb: 0.5 }}
                        >
                            {"Наименование функции:"}
                        </Typography>

                        <Typography
                            sx={{ color: c.textPrimary, fontWeight: 600 }}
                            data-testid={HOME_TEST_IDS.DELETE_FUNCTION_NAME}
                        >
                            {targetName}
                        </Typography>
                    </Box>
                )}

                <Typography
                    sx={{ color: c.textBody, fontSize: "0.88rem", mb: 1 }}
                    data-testid={HOME_TEST_IDS.DELETE_CONFIRM_QUESTION}
                >
                    {"Это действие необратимо."}
                </Typography>

                <Typography
                    sx={{ color: c.textSecondary, fontSize: "0.82rem", mb: 1.5 }}
                    data-testid={HOME_TEST_IDS.DELETE_CAPTCHA_PROMPT}
                >
                    {"Чтобы подтвердить удаление, введите"}{" "}
                    <Box
                        component="span"
                        sx={{
                            color: c.textPrimary,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                        }}
                    >
                        {expectedCaptcha}
                    </Box>{" "}
                    {"в поле ниже:"}
                </Typography>

                <TextField
                    value={captchaInput}
                    onChange={(event) => onCaptchaChange(event.target.value)}
                    placeholder={expectedCaptcha}
                    fullWidth
                    size="small"
                    autoFocus
                    error={captchaWrong}
                    helperText={captchaWrong ? "Текст не совпадает — проверьте ID." : " "}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            bgcolor: c.bgInput,
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.85rem",
                            "& fieldset": {
                                borderColor: c.borderMedium,
                            },
                            "&:hover fieldset": {
                                borderColor: c.borderHover,
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: theme.palette.primary.main,
                            },
                        },
                    }}
                    data-testid={HOME_TEST_IDS.CAPTCHA_INPUT}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{ textTransform: "none", fontSize: "0.82rem" }}
                    data-testid={HOME_TEST_IDS.DELETE_CANCEL}
                >
                    {"Отмена"}
                </Button>

                <Button
                    variant="contained"
                    onClick={() => void onConfirm()}
                    disabled={!captchaMatches}
                    sx={{
                        textTransform: "none",
                        fontSize: "0.82rem",
                        bgcolor: c.dangerHover,
                        "&:hover": { bgcolor: dangerHoverStrong },
                        "&.Mui-disabled": {
                            bgcolor: c.borderMain,
                            color: c.textDim,
                        },
                    }}
                    data-testid={HOME_TEST_IDS.DELETE_CONFIRM}
                >
                    {"Удалить"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
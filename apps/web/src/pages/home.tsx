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
  DarkMode,
  DeleteForeverOutlined,
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
import { GridRow } from "@mui/x-data-grid";
import { ruRU } from "@mui/x-data-grid/locales";
import { DataGridPro } from "@mui/x-data-grid-pro";
import DetailizationModal from "src/components/DetailizationModal/DetailizationModal";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import FunctionFormPanel from "src/components/FunctionFormPanel/FunctionFormPanel";
import {
  type ListQueryArgs,
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

// ---------- module-level constants ----------

export const HOME_TEST_IDS = {
  TABLE: "functions-table",
  PAGE_TITLE: "text-page-title",
  TOGGLE_THEME: "button-toggle-theme",
  TABLE_TITLE: "text-table-title",
  SEARCH_INPUT: "input-search",
  SEARCH_CLEAR: "button-search-clear",
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

// ---------- pure helpers ----------

function findMarkerDebtSettlementName(
  types: TypeResponseDto[],
): string | undefined {
  return types.find(
    (tp) =>
      tp.category === Category.FTS_FUNCTION_MARKER &&
      tp.code === MARKER_DEBT_SETTLEMENT_CODE,
  )?.name;
}

// ---------- main component ----------

// `Home` is mounted via `wouter`'s `<Route component={Home} />`. wouter passes
// a `RouteComponentProps` arg the page does not read; keeping the signature
// parameter-less matches the original component shape and avoids fighting
// the router's `JSXElementConstructor<RouteComponentProps<...>>` slot.
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

  const { optionsByCategory } = useDictionary(typesAll);
  const lookupTypeByName = useTypeColorLookup(typesAll);

  // Panel + filter/sort/search state lives in `uiSlice` so redux-persist can
  // survive a hard reload — see `apps/web/src/shared/store/index.ts` for the
  // whitelist. Local refs/handlers below dispatch into that slice rather than
  // `useState`. `editingId` is stored as `number | null` (JSON-friendly), so
  // we coerce to the panel's `number | undefined` prop at the read site.
  const panelMode = useAppSelector(selectPanelMode);
  const editingIdRaw = useAppSelector(selectEditingId);
  const editingId = editingIdRaw ?? undefined;
  const panelExpanded = useAppSelector(selectPanelExpanded);
  const persistedFilterModel = useAppSelector(selectFilterModel);
  const persistedSortModel = useAppSelector(selectSortModel);
  const searchInput = useAppSelector(selectSearchInput);

  // Reuse the persisted shapes as the grid's `filterModel`/`sortModel` —
  // `PersistedFilterModel` is a strict subset of `GridFilterModel` (no Date /
  // regex / function values reach here from the registry's filter operators)
  // and `PersistedSortModel` is identical to `GridSortModel`.
  const filterModel = persistedFilterModel as GridFilterModel;
  const sortModel = persistedSortModel as GridSortModel;

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

  const panelRef = useRef<HTMLDivElement | null>(null);

  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    DEBOUNCE_MS.SEARCH,
  );

  const baseArgs = useMemo<ListQueryArgs>(
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

  const functions = useMemo<FunctionRecord[]>(
    () => rows.map((item) => mapFtsFunctionApiToFunctionRecord(item, lookup)),
    [rows, lookup],
  );

  const deleteTarget = deleteDialog.targetId
    ? (functions.find((f) => String(f.id) === deleteDialog.targetId) ?? null)
    : null;

  const markerDebtSettlementName = useMemo(
    () => findMarkerDebtSettlementName(typesAll),
    [typesAll],
  );

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
    // Close the panel when leaving edit mode — user explicitly tapped the
    // active edit icon (or the cancel button) so they want the card gone,
    // not switched to CREATE.
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
      .catch((e: unknown) => {
        // Defence-in-depth: rtkErrorMiddleware already snackbars typed errors.
        // eslint-disable-next-line no-console
        console.error(e);
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

  const handleClearSearch = useCallback(() => {
    dispatch(setSearchInput(""));
  }, [dispatch]);

  // RTK Query's `invalidatesTags: ["FtsFunction"]` on create/update/delete
  // mutations triggers an automatic refetch of the list — no callbacks needed.

  const columns = useMemo(
    () =>
      createFunctionColumns({
        t,
        theme,
        optionsByCategory,
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
      markerDebtSettlementName,
      lookupTypeByName,
      editingId,
      handleOpenEdit,
      handleCancelEdit,
      handleRequestDelete,
      handleOpenDetails,
    ],
  );

  const isEmpty = rows.length === 0;
  const hasFirstResponse = listQuery.data !== undefined;
  const showLoadingOverlay = !hasFirstResponse && !isError;
  const showEmptyOverlay = hasFirstResponse && !isError && isEmpty;
  const showStatusOverlay = isError || showLoadingOverlay || showEmptyOverlay;

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: c.bgDeep,
        px: 3,
        py: 3,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          maxWidth: PAGE_MAX_WIDTH_PX,
          mx: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <RegistryHeader
          theme={theme}
          mode={mode}
          onToggleTheme={handleToggleTheme}
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
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <RegistryToolbar
            theme={theme}
            searchInput={searchInput}
            isSearching={
              searchInput.trim() !== debouncedSearch ||
              (loading && Boolean(debouncedSearch))
            }
            shown={functions.length}
            filteredTotal={filteredTotal}
            overallTotal={overallTotal}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
          />

          <ListStatus
            showSkeleton={showLoadingOverlay}
            isError={isError}
            isEmpty={isEmpty}
            hasSearch={debouncedSearch.length > 0}
            onClearSearch={handleClearSearch}
            mutedColor={c.textMuted}
          />
          {!showStatusOverlay && (
            <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
              <DataGridPro
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
                  row: (props: GridRowProps) => (
                    <GridRow {...props} data-testid={`row-fn-${props.rowId}`} />
                  ),
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>

      <DetailizationModal />

      <DeleteFunctionDialog
        theme={theme}
        open={Boolean(deleteTarget)}
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

// ---------- helper components ----------

type RegistryHeaderProps = {
  theme: Theme;
  mode: ThemeMode;
  onToggleTheme: () => void;
};

function RegistryHeader({ theme, mode, onToggleTheme }: RegistryHeaderProps) {
  const c = theme.custom;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        mb: 2,
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          width: HEADER_ICON_SIZE_PX,
          height: HEADER_ICON_SIZE_PX,
          borderRadius: 1.5,
          background: `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientTo})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Layers sx={{ color: "white", fontSize: 20 }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h6"
          sx={{
            color: c.textBright,
            fontWeight: 700,
            fontSize: "1.05rem",
            lineHeight: 1.2,
          }}
          data-testid={HOME_TEST_IDS.PAGE_TITLE}
        >
          {"Реестр функций"}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: c.textMuted, fontSize: "0.7rem" }}
        >
          {"Функциональный анализ · Управление функциями и детализация"}
        </Typography>
      </Box>
      <IconButton
        onClick={onToggleTheme}
        sx={{ color: c.textSecondary, "&:hover": { color: c.textPrimary } }}
        data-testid={HOME_TEST_IDS.TOGGLE_THEME}
        title={"Переключить тему"}
      >
        {mode === ThemeMode.DARK ? (
          <LightMode sx={{ fontSize: 20 }} />
        ) : (
          <DarkMode sx={{ fontSize: 20 }} />
        )}
      </IconButton>
      {/* FTS-NO-AUTH BRANCH: UserMenu removed (no profile, no logout, no admin link) */}
    </Box>
  );
}

type RegistryToolbarProps = {
  theme: Theme;
  searchInput: string;
  isSearching: boolean;
  shown: number;
  filteredTotal: number;
  overallTotal: number;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
};

function RegistryToolbar({
  theme,
  searchInput,
  isSearching,
  shown,
  filteredTotal,
  overallTotal,
  onSearchChange,
  onClearSearch,
}: RegistryToolbarProps) {
  const c = theme.custom;
  return (
    <Box
      sx={{
        px: 2.5,
        py: 1,
        borderBottom: `1px solid ${c.borderMain}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexShrink: 0,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ color: c.textPrimary, fontSize: "0.82rem", fontWeight: 600 }}
        data-testid={HOME_TEST_IDS.TABLE_TITLE}
      >
        {"Список функций"}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
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
              <InputAdornment position="start" sx={{ mr: 0.5 }}>
                {isSearching ? (
                  <CircularProgress
                    size={14}
                    thickness={5}
                    sx={{ color: c.accentBlue }}
                  />
                ) : (
                  <SearchIcon sx={{ fontSize: 16, color: c.textMuted }} />
                )}
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={onClearSearch}
                  data-testid={HOME_TEST_IDS.SEARCH_CLEAR}
                  sx={{ p: 0.25 }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <RegistryCounter
          shown={shown}
          filteredTotal={filteredTotal}
          overallTotal={overallTotal}
          mutedColor={c.textDim}
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
      sx={{ color: mutedColor, fontSize: "0.7rem" }}
      data-testid={HOME_TEST_IDS.FN_COUNT}
    >
      {"Отображено"}{" "}
      <Typography component="span" sx={COUNTER_BOLD_SX}>
        {shown}
      </Typography>{" "}
      {"из"}{" "}
      <Typography component="span" sx={COUNTER_BOLD_SX}>
        {filteredTotal}
      </Typography>
      , {"всего"}{" "}
      <Typography component="span" sx={COUNTER_BOLD_SX}>
        {overallTotal}
      </Typography>
    </Typography>
  );
}

type ListStatusProps = {
  showSkeleton: boolean;
  isError: boolean;
  isEmpty: boolean;
  hasSearch: boolean;
  onClearSearch: () => void;
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

// Reserve some chrome space (toolbar + paddings + status bar) when guessing
// how many skeleton rows fill the viewport. Tuned by eye on a 1080p display.
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
  const [count, setCount] = useState<number>(compute);
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
    <Box sx={{ flex: 1, px: 2, pt: 2, overflow: "hidden" }}>
      {Array.from({ length: rowCount }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={SKELETON_ROW_HEIGHT_PX - 8}
          sx={{ mb: 1, opacity: Math.max(0.25, 1 - i * 0.06) }}
        />
      ))}
    </Box>
  );
}

function ListStatus({
  showSkeleton,
  isError,
  isEmpty,
  hasSearch,
  onClearSearch,
  mutedColor,
}: ListStatusProps) {
  if (isError) {
    return (
      <Box sx={{ ...STATUS_OVERLAY_SX, color: mutedColor }}>
        <Typography
          variant="body2"
          sx={{ fontSize: "0.82rem" }}
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
  if (!showSkeleton && isEmpty) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EmptyState
          variant="inline"
          icon={
            hasSearch ? (
              <SearchOff sx={{ fontSize: "inherit" }} />
            ) : (
              <InboxOutlined sx={{ fontSize: "inherit" }} />
            )
          }
          title={
            hasSearch
              ? "По вашему запросу ничего не найдено. Попробуйте изменить условия поиска."
              : "Функций ещё нет"
          }
          secondaryActionLabel={hasSearch ? "Сбросить фильтр" : undefined}
          onSecondaryAction={hasSearch ? onClearSearch : undefined}
        />
      </Box>
    );
  }
  return null;
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
  const dangerHoverStrong = isDarkMode ? DANGER_HOVER_DARK : DANGER_HOVER_LIGHT;
  const backdropColor = isDarkMode ? BACKDROP_DARK : BACKDROP_LIGHT;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: c.bgPaper,
          border: `1px solid ${c.borderMain}`,
          borderRadius: 2,
        },
      }}
      slotProps={{ backdrop: { sx: { bgcolor: backdropColor } } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          color: c.textBright,
          fontSize: "1rem",
          fontWeight: 600,
          pb: 1,
        }}
        data-testid={HOME_TEST_IDS.DELETE_DIALOG_TITLE}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            bgcolor: "rgba(239,68,68,0.12)",
            color: "#f87171",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <DeleteForeverOutlined sx={{ fontSize: 18 }} />
        </Box>
        {"Подтверждение удаления"}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {targetName && (
          <Box
            sx={{
              border: `1px solid ${c.borderMain}`,
              borderLeft: `3px solid #f87171`,
              borderRadius: 1,
              bgcolor: c.hoverOverlay,
              px: 1.5,
              py: 1,
              mb: 2,
            }}
            data-testid={HOME_TEST_IDS.DELETE_FUNCTION_NAME}
          >
            <Typography
              variant="caption"
              sx={{
                color: c.textMuted,
                fontSize: "0.68rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                display: "block",
                mb: 0.25,
              }}
            >
              {"Наименование функции:"}
            </Typography>
            <Typography
              sx={{
                color: c.textBright,
                fontSize: "0.85rem",
                fontWeight: 500,
                lineHeight: 1.35,
              }}
            >
              {targetName}
            </Typography>
          </Box>
        )}

        <Typography
          variant="body2"
          sx={{ color: c.textBody, fontSize: "0.82rem", mb: 1.5 }}
          data-testid={HOME_TEST_IDS.DELETE_CAPTCHA_PROMPT}
        >
          Это действие необратимо. Чтобы подтвердить удаление, введите{" "}
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              bgcolor: c.bgInput,
              border: `1px solid ${c.borderMain}`,
              borderRadius: 0.5,
              px: 0.75,
              py: 0.25,
              color: c.textBright,
              fontSize: "0.78rem",
              whiteSpace: "nowrap",
            }}
          >
            {expectedCaptcha}
          </Box>{" "}
          в поле ниже:
        </Typography>
        <TextField
          value={captchaInput}
          onChange={(e) => onCaptchaChange(e.target.value)}
          placeholder={expectedCaptcha}
          fullWidth
          size="small"
          // autoFocus is intentional: this dialog only mounts in response to an
          // explicit user action (clicking a row's "Удалить" button), so focus
          // moves predictably to the captcha input.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          error={captchaWrong}
          helperText={captchaWrong ? "Текст не совпадает — проверьте ID." : " "}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: c.bgInput,
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              "& fieldset": { borderColor: c.borderMedium },
              "&:hover fieldset": { borderColor: c.borderHover },
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
          sx={{
            textTransform: "none",
            color: c.textSecondary,
            fontSize: "0.82rem",
          }}
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
            "&.Mui-disabled": { bgcolor: c.borderMain, color: c.textDim },
          }}
          data-testid={HOME_TEST_IDS.DELETE_CONFIRM}
        >
          {"Удалить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

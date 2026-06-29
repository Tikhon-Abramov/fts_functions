import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Paper, Skeleton, Typography, useTheme } from "@mui/material";
import { InboxOutlined, SearchOff } from "@mui/icons-material";
import { DataGridPro, GridRow, type GridFilterModel, type GridRowProps, type GridSortModel } from "@mui/x-data-grid-pro";
import { ruRU } from "@mui/x-data-grid/locales";
import { useAppDispatch, useAppSelector } from "../../store";
import { clearFilters, selectFilterModel, selectHasActiveFilters, selectSortModel, setFilterModel, setSortModel } from "../../store/uiSlice";
import { useConstantControllerGetTypesV1Query, useConstantControllerGetUsersV1Query, useFtsFunctionControllerGetAllFtsFunctionsV1Query } from "../../store/ftsFunctionRegistry";
import { createDtiOtions, createOtionsFromTypes, createOtionsFromUsers } from "../../utils/create-options";
import { EmptyState } from "./EmptyState";
import { getColumns } from "./columns";
import { FtsFunctionForm } from "./FtsFunctionForm";
import { DeleteFunctionDialog } from "./DeleteFtsFunctionModal";
import { buildFtsFunctionQuery } from "./build-fts-function-query.ts";
import { FtsFunctionDetails } from "../FtsFunctionDetails/FtsFunctionDetails.tsx";



export function FtsFunctions() {
  const dispatch = useAppDispatch();

  const filterModel = useAppSelector(selectFilterModel);
  const sortModel = useAppSelector(selectSortModel);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);

  const theme = useTheme();
  const c = theme.custom;

  const [availableHeight, setAvailableHeight] = useState<string>("100vh");

  const rootRef = useRef<HTMLDivElement | null>(null);
  const addFormRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    const elForm = addFormRef.current;
    if (!el || !elForm) return;

    const update = () => {
      const top = el.getBoundingClientRect().top;
      setAvailableHeight(`calc(100vh - ${top}px - 16px)`);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { data: ftsFunctionNames } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_NAME'] });
  const { data: ftsFunctionMarkers } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_MARKER'] });
  const { data: ftsDtis } = useConstantControllerGetTypesV1Query({ categories: ['FTS_DTI'] });
  const { data: ftsCentralizations } = useConstantControllerGetTypesV1Query({ categories: ['FTS_CENTRALIZATION'] });
  const { data: ftsCompetencyCenters } = useConstantControllerGetTypesV1Query({ categories: ['FTS_COMPETENCY_CENTER'] });

  const { data: centralOfficeCurators } = useConstantControllerGetUsersV1Query(
    { roles: ['USER'], ftsBranchTypes: ['CENTRAL_OFFICE'], ftsFunctionRoles: ['CURATOR'] },
  );
  const { data: centralOfficeUsers } = useConstantControllerGetUsersV1Query(
    { roles: ['USER'], ftsBranchTypes: ['CENTRAL_OFFICE'], ftsPositionRoles: ['CHIEF', 'DEPUTY_CHIEF'] },
  );
  const { data: interregionalInspectionManagers } = useConstantControllerGetUsersV1Query(
    { roles: ['USER'], ftsBranchTypes: ['INTERREGIONAL_INSPECTION'], ftsFunctionRoles: ['MANAGER'] },
  );
  const { data: interregionalInspectionUsers } = useConstantControllerGetUsersV1Query(
    { roles: ['USER'], ftsBranchTypes: ['INTERREGIONAL_INSPECTION'], ftsPositionRoles: ['CHIEF', 'DEPUTY_CHIEF'] },
  );

  const queryArgs = useMemo(() => buildFtsFunctionQuery(filterModel, sortModel), [filterModel, sortModel]);

  const { data: ftsFunctionData, isError, isFetching } = useFtsFunctionControllerGetAllFtsFunctionsV1Query(
    queryArgs,
    {
      pollingInterval: 0,
      skipPollingIfUnfocused: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const ftsFunctions = useMemo(() => ftsFunctionData?.data?.items ?? [], [ftsFunctionData?.data?.items]);
  const meta = useMemo(() => ftsFunctionData?.data?.meta, [ftsFunctionData?.data?.meta]);

  const usedFtsFunctionNameIds = useMemo(() => {
    const ids = ftsFunctions?.map(
      ({ ftsFunctionName }) => ftsFunctionName.id
    ) || [];
    return new Set(ids);
  }, [ftsFunctions]);

  const ftsFunctionNameOptions = useMemo(() => createOtionsFromTypes(ftsFunctionNames), [ftsFunctionNames]);
  const ftsFunctionMarkerOptions = useMemo(() => createOtionsFromTypes(ftsFunctionMarkers), [ftsFunctionMarkers]);
  const ftsDtiOptions = useMemo(() => createDtiOtions(ftsDtis), [ftsDtis]);
  const ftsCentralizationOptions = useMemo(() => createOtionsFromTypes(ftsCentralizations), [ftsCentralizations]);
  const ftsCompetencyCenterOptions = useMemo(() => createOtionsFromTypes(ftsCompetencyCenters), [ftsCompetencyCenters]);

  const centralOfficeCuratorOptions = useMemo(() => createOtionsFromUsers(centralOfficeCurators), [centralOfficeCurators]);
  const centralOfficeUserOptions = useMemo(() => createOtionsFromUsers(centralOfficeUsers), [centralOfficeUsers]);
  const interregionalInspectionManagerOptions = useMemo(() => createOtionsFromUsers(interregionalInspectionManagers), [interregionalInspectionManagers]);
  const interregionalInspectionUserOptions = useMemo(() => createOtionsFromUsers(interregionalInspectionUsers), [interregionalInspectionUsers]);

  const options = useMemo(() => ({
    ftsFunctionNameOptions,
    ftsFunctionMarkerOptions,
    ftsDtiOptions,
    ftsCentralizationOptions,
    ftsCompetencyCenterOptions,
    centralOfficeCuratorOptions,
    centralOfficeUserOptions,
    interregionalInspectionManagerOptions,
    interregionalInspectionUserOptions,
  }), [
    ftsFunctionNameOptions,
    ftsFunctionMarkerOptions,
    ftsDtiOptions,
    ftsCentralizationOptions,
    ftsCompetencyCenterOptions,
    centralOfficeCuratorOptions,
    centralOfficeUserOptions,
    interregionalInspectionManagerOptions,
    interregionalInspectionUserOptions,
  ]);

  const columns = useMemo(() => getColumns(options), [options]);

  const handleFilterModelChange = useCallback((next: GridFilterModel) => {
    dispatch(setFilterModel(next));
  }, [dispatch]);

  const handleSortModelChange = useCallback((next: GridSortModel) => {
    dispatch(setSortModel(next));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters())
  }, [dispatch])


  const content = useMemo(() => {
    if (isFetching && !hasActiveFilters) {
      return (
        <Box sx={{ width: "100%", p: 2 }}>
          {Array.from({ length: 36 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={36}
              sx={{ mb: 1, bgcolor: "rgba(148, 163, 184, 0.12)" }}
            />
          ))}
        </Box>
      )
    }

    if (isError) {
      return (
        <Box sx={{
          p: 4,
          textAlign: "center",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Typography
            sx={{ color: c.textMuted, fontSize: "0.85rem" }}
          >
            {"Не удалось загрузить список функций"}
          </Typography>
        </Box>
      )
    }

    return (
      <DataGridPro
        rows={ftsFunctions}
        columns={columns}
        getRowId={(row) => row.id}
        isCellEditable={() => false}
        disableRowSelectionOnClick
        hideFooter
        localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={handleFilterModelChange}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
        columnHeaderHeight={36}
        getRowHeight={() => "auto"}
        getEstimatedRowHeight={() => 44}
        rowBufferPx={2000}
        getRowClassName={() => "fts-fn-row"}
        slotProps={{
          filterPanel: {
            filterFormProps: {
              logicOperatorInputProps: { sx: { display: 'none' } },
              operatorInputProps: { sx: { display: "none" } },
              columnInputProps: { sx: { width: 250 } },
            },
            sx: { width: 700 }
          },
        }}
        slots={{
          row: (props: GridRowProps) => <GridRow {...props} />,
          noRowsOverlay: () => (
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
                  hasActiveFilters ? (
                    <SearchOff sx={{ fontSize: 34 }} />
                  ) : (
                    <InboxOutlined sx={{ fontSize: 34 }} />
                  )
                }
                title={
                  hasActiveFilters
                    ? "По заданным фильтрам ничего не найдено."
                    : "Функций ещё нет"
                }
                secondaryActionLabel={
                  hasActiveFilters ? "Сбросить поиск и фильтры" : undefined
                }
                onSecondaryAction={hasActiveFilters ? handleClearFilters : undefined}
              />
            </Box>
          ),
        }}
        sx={{
          flex: 1,
          minHeight: 0,
          border: "none",
          bgcolor: c.bgPaper,
          color: c.textBody,
          fontSize: "0.78rem",
          "& .MuiDataGrid-columnHeaders": {
            borderBottom: `1px solid ${c.borderMain}`,
            bgcolor: c.bgPaper,
          },
          "& .MuiDataGrid-columnHeader": {
            color: c.textMuted,
            fontSize: "0.65rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
            whiteSpace: "normal",
            lineHeight: 1.2,
          },
          "& .MuiDataGrid-cell": {
            borderBottom: `1px solid ${c.borderLight}`,
            py: 0.75,
            display: "flex",
            alignItems: "center",
            verticalAlign: "middle",
            whiteSpace: "normal !important",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            lineHeight: 1.35,
            minHeight: '44px',
          },
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
            outline: "none !important",
          },
          "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
          {
            outline: "none !important",
          },
          "& .MuiDataGrid-row": {
            "&:hover": { bgcolor: c.hoverOverlay },
          },
          "& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover": {
            bgcolor: "transparent",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: `1px solid ${c.borderMain}`,
            bgcolor: c.bgPaper,
          },
          "& .MuiTablePagination-root": {
            color: c.textSecondary,
            fontSize: "0.75rem",
          },
          "& .MuiDataGrid-iconSeparator": { color: c.borderMedium },
          "& .MuiDataGrid-menuIcon button, & .MuiDataGrid-sortIcon": {
            color: c.textMuted,
          },
          "& .MuiDataGrid-filler, & .MuiDataGrid-scrollbarFiller": {
            bgcolor: c.bgPaper,
          },
        }}
      />
    )
  }, [
    c,
    isFetching,
    isError,
    ftsFunctions,
    columns,
    hasActiveFilters,
    filterModel,
    sortModel,
    handleFilterModelChange,
    handleSortModelChange,
    handleClearFilters,
  ]);


  return (
    <Box
      ref={rootRef}
      sx={{
        height: availableHeight,
        bgcolor: c.bgDeep,
        color: c.textBody,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1600,
          mx: "auto",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box ref={addFormRef} sx={{ flexShrink: 0 }}>
          <FtsFunctionForm options={options} usedFtsFunctionNameIds={usedFtsFunctionNameIds} />
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
              >
                {"Список функций"}
              </Typography>

              <Typography
                variant="caption"
                sx={{ color: c.textMuted, fontSize: "0.72rem" }}
              >
                {"Отображено "}
                <Box component="span" sx={{ fontWeight: 600, fontSize: "inherit", color: "inherit" }}>
                  {meta?.filteredTotal}
                </Box>
                {", всего "}
                <Box component="span" sx={{ fontWeight: 600, fontSize: "inherit", color: "inherit" }}>
                  {meta?.total}
                </Box>
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {hasActiveFilters && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleClearFilters}
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
                >
                  {"Сбросить фильтры"}
                </Button>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {content}
          </Box>
        </Paper>
      </Box>

      <DeleteFunctionDialog />

      <FtsFunctionDetails />
    </Box>
  );
}
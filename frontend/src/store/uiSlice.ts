import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GridFilterModel, GridSortModel } from "@mui/x-data-grid";


export const ThemeMode = {
  LIGHT: "light",
  DARK: "dark",
} as const;
export type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode];

export const RightTab = {
  DETAILS: 1,
  RELATIONS: 2,
  FEEDBACK: 3,
  ACTION: 4,
} as const;
export type RightTab = (typeof RightTab)[keyof typeof RightTab];

export type FtsFunctionStep = 'OBJECT_SELECTION' | 'CLUSTERING_IMPACT';

export type FtsFunctionCategory = 'METHODOLOGY' | 'ACTUAL_ACTION' | 'CONTROL_ANALYTICS';

type SnackbarState = {
  open: boolean;
  message: string;
};

const EMPTY_FILTER_MODEL: GridFilterModel = { items: [] };
const EMPTY_SORT_MODEL: GridSortModel = [];

type UiState = {
  themeMode: ThemeMode;
  ftsFunctionFormOpen: boolean;
  ftsFunctionName: string | null;
  editableFtsFunctionId: number | null;
  deleteableFtsFunctionId: number | null;
  selectedFtsFunctionId: number | null;
  selectedFtsFunctionDetailId: number | null;
  selectedFtsFunctionDetailName: string | null;
  selectedFtsFunctionStep: FtsFunctionStep | null;
  selectedFtsFunctionCategory: FtsFunctionCategory | null;
  deleteableFtsFunctionDetailId: number | null;
  rightTab: number;
  snackbar: SnackbarState;
  filterModel: GridFilterModel;
  sortModel: GridSortModel;
  hasActiveFilters: boolean;
};


function loadThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem("themeMode");
    if (stored === ThemeMode.LIGHT || stored === ThemeMode.DARK) {
      return stored;
    }
  } catch { }
  return ThemeMode.DARK;
}


function hasActiveFilters(model: GridFilterModel): boolean {
  return model.items.some((item) => {
    const value = item.value;

    if (Array.isArray(value)) return value.length > 0;
    if (value == null) return false;

    return String(value).trim().length > 0;
  });
}


const initialState: UiState = {
  themeMode: loadThemeMode(),
  ftsFunctionFormOpen: false,
  ftsFunctionName: null,
  editableFtsFunctionId: null,
  deleteableFtsFunctionId: null,
  selectedFtsFunctionId: null,
  selectedFtsFunctionDetailId: null,
  selectedFtsFunctionDetailName: null,
  selectedFtsFunctionStep: null,
  selectedFtsFunctionCategory: null,
  deleteableFtsFunctionDetailId: null,
  rightTab: RightTab.DETAILS,
  snackbar: { open: false, message: "" },
  filterModel: EMPTY_FILTER_MODEL,
  sortModel: EMPTY_SORT_MODEL,
  hasActiveFilters: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.themeMode =
        state.themeMode === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
      try {
        localStorage.setItem("themeMode", state.themeMode);
      } catch { }
    },
    toggleFtsFunctionFormOpen(state) {
      state.ftsFunctionFormOpen = !state.ftsFunctionFormOpen;
    },
    setEditableFtsFunction(state, action: PayloadAction<number | null>) {
      state.editableFtsFunctionId = action.payload;
      state.ftsFunctionFormOpen = action.payload !== null;
    },
    setDeleteableFtsFunction(state, action: PayloadAction<{ id?: number | null; ftsFunctionName?: string | null }>) {
      state.deleteableFtsFunctionId = action.payload.id ?? null;
      state.ftsFunctionName = action.payload.ftsFunctionName ?? null;
    },
    setSelectedFtsFunction(state, action: PayloadAction<{ id?: number | null; ftsFunctionName?: string | null }>) {
      state.selectedFtsFunctionId = action.payload.id ?? null;
      state.ftsFunctionName = action.payload.ftsFunctionName ?? null;
      state.selectedFtsFunctionDetailId = null;
      state.selectedFtsFunctionDetailName = null;
      state.selectedFtsFunctionStep = null;
      state.selectedFtsFunctionCategory = null;
      state.rightTab = RightTab.DETAILS;
      state.snackbar = { open: false, message: "" };
    },
    setSelectedFtsFunctionDetail(state, action: PayloadAction<{ id: number, name: string; ftsFunctionStep: string; ftsFunctionCategory: string } | null>) {
      if (!action.payload || (state.selectedFtsFunctionDetailId === action.payload?.id)) {
        state.selectedFtsFunctionDetailId = null;
        state.selectedFtsFunctionDetailName = null;
        state.selectedFtsFunctionStep = null;
        state.selectedFtsFunctionCategory = null;
        if (state.rightTab === RightTab.RELATIONS)
          state.rightTab = RightTab.DETAILS;
      } else
        state.selectedFtsFunctionDetailId = action.payload.id;
        state.selectedFtsFunctionDetailName = action.payload?.name ?? null;
        state.selectedFtsFunctionStep = action.payload?.ftsFunctionStep ? (action.payload.ftsFunctionStep as FtsFunctionStep) : null;
        state.selectedFtsFunctionCategory = action.payload?.ftsFunctionCategory ? (action.payload.ftsFunctionCategory as FtsFunctionCategory) : null;
    },
    setDeleteableFtsFunctionDetail(state, action: PayloadAction<number | null>) {
      state.deleteableFtsFunctionDetailId = action.payload;
    },
    setRightTab(state, action: PayloadAction<number>) {
      state.rightTab = action.payload;
    },
    showSnackbar(
      state,
      action: PayloadAction<{
        message: string;
      }>,
    ) {
      state.snackbar = {
        open: true,
        message: action.payload.message,
      };
    },
    hideSnackbar(state) {
      state.snackbar = { open: false, message: "" };
    },

    // selectRowAndOpenLinkPicker(state, action: PayloadAction<string>) {
    //   state.selectedRowId = action.payload;
    //   state.rightTab = RightTab.LINKER;
    // },
    // setPanelMode(state, action: PayloadAction<PanelMode>) {
    //   state.panelMode = action.payload;
    // },
    // setEditingId(state, action: PayloadAction<number | null>) {
    //   state.editingId = action.payload;
    // },
    // setPanelExpanded(state, action: PayloadAction<boolean>) {
    //   state.panelExpanded = action.payload;
    // },
    // togglePanelExpanded(state) {
    //   state.panelExpanded = !state.panelExpanded;
    // },
    // openEditPanel(state, action: PayloadAction<number>) {
    //   state.panelMode = "edit";
    //   state.editingId = action.payload;
    //   state.panelExpanded = true;
    // },
    // closeEditPanel(state) {
    //   state.panelMode = "create";
    //   state.editingId = null;
    //   state.panelExpanded = false;
    // },

    setFilterModel(state, action: PayloadAction<GridFilterModel>) {
      state.filterModel = action.payload;
      state.hasActiveFilters = hasActiveFilters(action.payload);
    },
    setSortModel(state, action: PayloadAction<GridSortModel>) {
      state.sortModel = [...action.payload];
    },
    clearFilters(state) {
      state.filterModel = EMPTY_FILTER_MODEL;
      state.sortModel = [...EMPTY_SORT_MODEL];
    }
  },
});

export const {
  toggleTheme,
  toggleFtsFunctionFormOpen,
  setEditableFtsFunction,
  setDeleteableFtsFunction,
  setSelectedFtsFunction,
  setSelectedFtsFunctionDetail,
  setDeleteableFtsFunctionDetail,
  setRightTab,
  showSnackbar,
  hideSnackbar,
  setFilterModel,
  setSortModel,
  clearFilters,
} = uiSlice.actions;

export const selectThemeMode = (state: { ui: UiState }) => state.ui.themeMode;
export const selectFtsFunctionFormOpen = (state: { ui: UiState }) => state.ui.ftsFunctionFormOpen;
export const selectFtsFunctionName = (state: { ui: UiState }) => state.ui.ftsFunctionName;
export const selectEditableFtsFunctionId = (state: { ui: UiState }) => state.ui.editableFtsFunctionId;
export const selectDeleteableFtsFunctionId = (state: { ui: UiState }) => state.ui.deleteableFtsFunctionId;
export const selectSelectedFtsFunctionId = (state: { ui: UiState }) => state.ui.selectedFtsFunctionId;
export const selectSelectedFtsFunctionDetailId = (state: { ui: UiState }) => state.ui.selectedFtsFunctionDetailId;
export const selectSelectedFtsFunctionDetailName = (state: { ui: UiState }) => state.ui.selectedFtsFunctionDetailName;
export const selectSelectedFtsFunctionStep = (state: { ui: UiState }) => state.ui.selectedFtsFunctionStep;
export const selectSelectedFtsFunctionCategory = (state: { ui: UiState }) => state.ui.selectedFtsFunctionCategory;
export const selectDeleteableFtsFunctionDetailId = (state: { ui: UiState }) => state.ui.deleteableFtsFunctionDetailId;
export const selectRightTab = (state: { ui: UiState }) => state.ui.rightTab;
export const selectSnackbar = (state: { ui: UiState }) => state.ui.snackbar;
export const selectFilterModel = (state: { ui: UiState }) => state.ui.filterModel;
export const selectSortModel = (state: { ui: UiState }) => state.ui.sortModel;
export const selectHasActiveFilters = (state: { ui: UiState }) => state.ui.hasActiveFilters;

export default uiSlice.reducer;

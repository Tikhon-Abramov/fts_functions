import type { FunctionFormFields } from "src/entities/fts-function/mocks/validation";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { EMPTY_FUNCTION_FORM } from "src/entities/fts-function/mocks/validation";
import { RightTab } from "src/entities/fts-function/model/right-tab";
import { ThemeMode } from "src/shared/ui/theme-mode";

type DeleteDialogState = {
  targetId: string | null;
  step: 1 | 2;
  captchaInput: string;
};

type SnackbarState = {
  open: boolean;
  message: string;
};

/**
 * Mode for the FunctionForm panel above the table. Mirrors the
 * `FunctionFormPanelMode` const-as-const declared by the panel itself
 * (`apps/web/src/components/FunctionFormPanel/lib/types.ts`); keeping a local
 * literal-union here avoids a `shared/store` → `components/...` import that
 * would invert the layer dependency direction.
 */
export type PanelMode = "create" | "edit";

/**
 * Subset of `GridFilterModel` we persist. We deliberately keep this loose
 * (`unknown` value) — MUI x-data-grid filter values are arbitrary primitives
 * (string / number / boolean / null) and forcing a stricter type here would
 * couple the slice to the grid version. The grid serialises non-primitive
 * filter values back to its own DTOs on hydration, but the home page only
 * uses primitive operators (contains, equals, etc) so localStorage round-trip
 * is safe without a custom transform.
 */
export type PersistedFilterItem = {
  id?: string | number;
  field: string;
  operator: string;
  value?: unknown;
};

export type PersistedFilterModel = {
  items: PersistedFilterItem[];
  logicOperator?: "and" | "or";
  quickFilterValues?: unknown[];
  quickFilterLogicOperator?: "and" | "or";
};

export type PersistedSortItem = {
  field: string;
  sort: "asc" | "desc" | null | undefined;
};

export type PersistedSortModel = PersistedSortItem[];

const EMPTY_FILTER_MODEL: PersistedFilterModel = { items: [] };
const EMPTY_SORT_MODEL: PersistedSortModel = [];

type UiState = {
  themeMode: ThemeMode;
  formExpanded: boolean;
  functionForm: FunctionFormFields;
  modalFunctionId: string | null;
  selectedRowId: string | null;
  rightTab: number;
  deleteDialog: DeleteDialogState;
  snackbar: SnackbarState;
  // Lifted from `home.tsx` so they survive a page reload via redux-persist.
  panelMode: PanelMode;
  editingId: number | null;
  panelExpanded: boolean;
  filterModel: PersistedFilterModel;
  sortModel: PersistedSortModel;
  searchInput: string;
};

function loadThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem("themeMode");
    if (stored === ThemeMode.LIGHT || stored === ThemeMode.DARK) {
      return stored;
    }
  } catch {
    /* storage unavailable — non-fatal */
  }
  return ThemeMode.DARK;
}

const initialState: UiState = {
  themeMode: loadThemeMode(),
  formExpanded: false,
  functionForm: EMPTY_FUNCTION_FORM,
  modalFunctionId: null,
  selectedRowId: null,
  rightTab: RightTab.DETAILS,
  deleteDialog: { targetId: null, step: 1, captchaInput: "" },
  snackbar: { open: false, message: "" },
  panelMode: "create",
  editingId: null,
  panelExpanded: false,
  filterModel: EMPTY_FILTER_MODEL,
  sortModel: EMPTY_SORT_MODEL,
  searchInput: "",
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
      } catch {
        /* storage unavailable — non-fatal */
      }
    },
    setFormExpanded(state, action: PayloadAction<boolean>) {
      state.formExpanded = action.payload;
    },
    toggleFormExpanded(state) {
      state.formExpanded = !state.formExpanded;
    },
    updateFunctionForm(
      state,
      action: PayloadAction<Partial<FunctionFormFields>>,
    ) {
      Object.assign(state.functionForm, action.payload);
    },
    resetFunctionForm(state) {
      state.functionForm = EMPTY_FUNCTION_FORM;
    },
    openModal(state, action: PayloadAction<string>) {
      state.modalFunctionId = action.payload;
      state.selectedRowId = null;
      state.rightTab = RightTab.DETAILS;
      state.snackbar = { open: false, message: "" };
    },
    closeModal(state) {
      state.modalFunctionId = null;
      state.selectedRowId = null;
      state.rightTab = RightTab.DETAILS;
    },
    setSelectedRowId(state, action: PayloadAction<string | null>) {
      state.selectedRowId = action.payload;
    },
    toggleSelectedRow(state, action: PayloadAction<string>) {
      if (state.selectedRowId === action.payload) {
        state.selectedRowId = null;
      } else {
        state.selectedRowId = action.payload;
      }
      // Sidebar section (`rightTab`) intentionally persists across row
      // switches — switching rows is meant to change the shown *content*
      // inside the selected section, not reset the section itself.
      // The Linker tab is the only section tied to a specific row;
      // if the user is on that tab and deselects the row, fall back to Details.
      if (state.selectedRowId === null && state.rightTab === RightTab.LINKER) {
        state.rightTab = RightTab.DETAILS;
      }
    },
    setRightTab(state, action: PayloadAction<number>) {
      state.rightTab = action.payload;
    },
    openDeleteDialog(state, action: PayloadAction<string>) {
      state.deleteDialog = {
        targetId: action.payload,
        step: 1,
        captchaInput: "",
      };
    },
    closeDeleteDialog(state) {
      state.deleteDialog = { targetId: null, step: 1, captchaInput: "" };
    },
    setDeleteStep(state, action: PayloadAction<1 | 2>) {
      state.deleteDialog.step = action.payload;
    },
    setCaptchaInput(state, action: PayloadAction<string>) {
      state.deleteDialog.captchaInput = action.payload;
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
    selectRowAndOpenLinkPicker(state, action: PayloadAction<string>) {
      state.selectedRowId = action.payload;
      state.rightTab = RightTab.LINKER;
    },
    // ---------- panel + filter/sort/search (persisted) ----------
    setPanelMode(state, action: PayloadAction<PanelMode>) {
      state.panelMode = action.payload;
    },
    setEditingId(state, action: PayloadAction<number | null>) {
      state.editingId = action.payload;
    },
    setPanelExpanded(state, action: PayloadAction<boolean>) {
      state.panelExpanded = action.payload;
    },
    togglePanelExpanded(state) {
      state.panelExpanded = !state.panelExpanded;
    },
    /**
     * Single dispatch for the "open this row in EDIT mode" gesture — keeps
     * the three flips (mode → EDIT, editingId → id, panelExpanded → true)
     * atomic so renderers never see a half-applied transition.
     */
    openEditPanel(state, action: PayloadAction<number>) {
      state.panelMode = "edit";
      state.editingId = action.payload;
      state.panelExpanded = true;
    },
    /**
     * Inverse of `openEditPanel` — collapses the panel and resets to CREATE.
     * Used by the row's "active edit" toggle and by the cancel button.
     */
    closeEditPanel(state) {
      state.panelMode = "create";
      state.editingId = null;
      state.panelExpanded = false;
    },
    setFilterModel(state, action: PayloadAction<PersistedFilterModel>) {
      state.filterModel = action.payload;
    },
    setSortModel(state, action: PayloadAction<PersistedSortModel>) {
      state.sortModel = action.payload;
    },
    setSearchInput(state, action: PayloadAction<string>) {
      state.searchInput = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setFormExpanded,
  toggleFormExpanded,
  updateFunctionForm,
  resetFunctionForm,
  openModal,
  closeModal,
  setSelectedRowId,
  toggleSelectedRow,
  setRightTab,
  openDeleteDialog,
  closeDeleteDialog,
  setDeleteStep,
  setCaptchaInput,
  showSnackbar,
  hideSnackbar,
  selectRowAndOpenLinkPicker,
  setPanelMode,
  setEditingId,
  setPanelExpanded,
  togglePanelExpanded,
  openEditPanel,
  closeEditPanel,
  setFilterModel,
  setSortModel,
  setSearchInput,
} = uiSlice.actions;

export const selectThemeMode = (state: { ui: UiState }) => state.ui.themeMode;
export const selectFormExpanded = (state: { ui: UiState }) =>
  state.ui.formExpanded;
export const selectFunctionForm = (state: { ui: UiState }) =>
  state.ui.functionForm;
export const selectModalFunctionId = (state: { ui: UiState }) =>
  state.ui.modalFunctionId;
export const selectSelectedRowId = (state: { ui: UiState }) =>
  state.ui.selectedRowId;
export const selectRightTab = (state: { ui: UiState }) => state.ui.rightTab;
export const selectDeleteDialog = (state: { ui: UiState }) =>
  state.ui.deleteDialog;
export const selectSnackbar = (state: { ui: UiState }) => state.ui.snackbar;
export const selectPanelMode = (state: { ui: UiState }) => state.ui.panelMode;
export const selectEditingId = (state: { ui: UiState }) => state.ui.editingId;
export const selectPanelExpanded = (state: { ui: UiState }) =>
  state.ui.panelExpanded;
export const selectFilterModel = (state: { ui: UiState }) =>
  state.ui.filterModel;
export const selectSortModel = (state: { ui: UiState }) => state.ui.sortModel;
export const selectSearchInput = (state: { ui: UiState }) =>
  state.ui.searchInput;

export default uiSlice.reducer;

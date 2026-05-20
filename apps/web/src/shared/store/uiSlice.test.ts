import { configureStore } from "@reduxjs/toolkit";
import { RightTab } from "src/entities/fts-function/model/right-tab";
import uiReducer, {
  closeEditPanel,
  closeModal,
  openEditPanel,
  openModal,
  selectEditingId,
  selectFilterModel,
  selectPanelExpanded,
  selectPanelMode,
  selectRightTab,
  selectSearchInput,
  selectSortModel,
  setFilterModel,
  setRightTab,
  setSearchInput,
  setSelectedRowId,
  setSortModel,
  togglePanelExpanded,
  toggleSelectedRow,
} from "src/shared/store/uiSlice";
import { describe, expect, it } from "vitest";

function makeStore() {
  return configureStore({ reducer: { ui: uiReducer } });
}

describe("uiSlice", () => {
  it("openModal seeds rightTab=DETAILS and clears selection (REGRESSION: tab default order)", () => {
    const store = makeStore();
    store.dispatch(setRightTab(RightTab.LINKS));
    store.dispatch(openModal("123"));
    expect(selectRightTab(store.getState())).toBe(RightTab.DETAILS);
    expect(store.getState().ui.selectedRowId).toBeNull();
  });

  it("closeModal resets rightTab back to DETAILS too", () => {
    const store = makeStore();
    store.dispatch(openModal("1"));
    store.dispatch(setRightTab(RightTab.LINKS));
    store.dispatch(closeModal());
    expect(selectRightTab(store.getState())).toBe(RightTab.DETAILS);
  });

  it("toggleSelectedRow falls back from LINKER to DETAILS when row is deselected", () => {
    const store = makeStore();
    store.dispatch(openModal("1"));
    store.dispatch(setSelectedRowId("row-1"));
    store.dispatch(setRightTab(RightTab.LINKER));
    store.dispatch(toggleSelectedRow("row-1")); // deselects
    expect(store.getState().ui.selectedRowId).toBeNull();
    expect(selectRightTab(store.getState())).toBe(RightTab.DETAILS);
  });

  it("toggleSelectedRow does NOT touch rightTab when on a non-LINKER tab", () => {
    const store = makeStore();
    store.dispatch(openModal("1"));
    store.dispatch(setSelectedRowId("row-1"));
    store.dispatch(setRightTab(RightTab.LINKS));
    store.dispatch(toggleSelectedRow("row-1"));
    expect(selectRightTab(store.getState())).toBe(RightTab.LINKS);
  });

  it("toggleSelectedRow flips selection on / off", () => {
    const store = makeStore();
    store.dispatch(toggleSelectedRow("row-1"));
    expect(store.getState().ui.selectedRowId).toBe("row-1");
    store.dispatch(toggleSelectedRow("row-1"));
    expect(store.getState().ui.selectedRowId).toBeNull();
  });

  // ---------- panel + filter/sort/search (persisted) ----------

  it("openEditPanel atomically sets mode=edit, editingId, and expanded=true", () => {
    const store = makeStore();
    store.dispatch(openEditPanel(42));
    expect(selectPanelMode(store.getState())).toBe("edit");
    expect(selectEditingId(store.getState())).toBe(42);
    expect(selectPanelExpanded(store.getState())).toBe(true);
  });

  it("closeEditPanel resets mode=create, editingId=null, expanded=false", () => {
    const store = makeStore();
    store.dispatch(openEditPanel(7));
    store.dispatch(closeEditPanel());
    expect(selectPanelMode(store.getState())).toBe("create");
    expect(selectEditingId(store.getState())).toBeNull();
    expect(selectPanelExpanded(store.getState())).toBe(false);
  });

  it("togglePanelExpanded flips the boolean", () => {
    const store = makeStore();
    expect(selectPanelExpanded(store.getState())).toBe(false);
    store.dispatch(togglePanelExpanded());
    expect(selectPanelExpanded(store.getState())).toBe(true);
    store.dispatch(togglePanelExpanded());
    expect(selectPanelExpanded(store.getState())).toBe(false);
  });

  it("setFilterModel / setSortModel / setSearchInput round-trip", () => {
    const store = makeStore();
    store.dispatch(
      setFilterModel({
        items: [{ field: "name", operator: "contains", value: "hello" }],
      }),
    );
    store.dispatch(setSortModel([{ field: "id", sort: "desc" }]));
    store.dispatch(setSearchInput("query"));
    expect(selectFilterModel(store.getState()).items[0]?.value).toBe("hello");
    expect(selectSortModel(store.getState())[0]?.sort).toBe("desc");
    expect(selectSearchInput(store.getState())).toBe("query");
  });
});

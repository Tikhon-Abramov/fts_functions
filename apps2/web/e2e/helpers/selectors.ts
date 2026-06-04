import type { Page, Locator } from "@playwright/test";

/**
 * Centralized locators. We prefer `getByTestId` over brittle CSS selectors.
 * All data-testids used here must exist in the frontend source.
 *
 * Conventions:
 *  - Add kebab-case test-ids to production components.
 *  - Keep MUI portals in mind — use page-level queries (which match body-level
 *    dialogs/menus automatically) rather than scoping to a container.
 */
export const Selectors = {
  // Page chrome
  pageTitle: (page: Page): Locator => page.getByTestId("text-page-title"),
  functionsTable: (page: Page): Locator => page.getByTestId("functions-table"),
  functionsCount: (page: Page): Locator => page.getByTestId("text-fn-count"),

  // Unified function-form panel (inline, handles both create & edit)
  formPanel: (page: Page): Locator => page.getByTestId("fn-form-panel"),
  openCreatePanelButton: (page: Page): Locator =>
    page.getByTestId("fn-form-toggle"),
  toggleFormHeader: (page: Page): Locator => page.getByTestId("fn-form-toggle"),
  formFieldName: (page: Page): Locator =>
    page.getByTestId("create-name-select"),
  formFieldMarker: (page: Page): Locator =>
    page.getByTestId("create-marker-select"),
  formFieldCentralization: (page: Page): Locator =>
    page.getByTestId("create-centralization-select"),
  formFieldCompetenceCenter: (page: Page): Locator =>
    page.getByTestId("create-competence-center-select"),
  formFieldCuratorCA: (page: Page): Locator =>
    page.getByTestId("create-curator-ca-select"),
  formFieldNuZnu: (page: Page): Locator =>
    page.getByTestId("create-nu-znu-select"),
  formFieldManagerMiudol: (page: Page): Locator =>
    page.getByTestId("create-manager-miudol-select"),
  formFieldNiZni: (page: Page): Locator =>
    page.getByTestId("create-ni-zni-select"),
  submitForm: (page: Page): Locator => page.getByTestId("fn-form-save"),
  clearForm: (page: Page): Locator => page.getByTestId("button-clear-form"),

  // Edit-mode-only controls on the unified panel
  formClose: (page: Page): Locator => page.getByTestId("fn-form-close"),
  formCancel: (page: Page): Locator => page.getByTestId("fn-form-cancel"),

  // Function rows (parameterized)
  functionRow: (page: Page, id: string | number): Locator =>
    page.getByTestId(`row-fn-${id}`),
  anyFunctionRow: (page: Page): Locator =>
    page.locator('[data-testid^="row-fn-"]'),
  editFunctionButton: (page: Page, id: string | number): Locator =>
    page.getByTestId(`button-edit-function-${id}`),
  openDetailButton: (page: Page, id: string | number): Locator =>
    page.getByTestId(`button-detail-${id}`),
  deleteFunctionButton: (page: Page, id: string | number): Locator =>
    page.getByTestId(`button-delete-${id}`),

  // Delete confirmation
  deleteDialogTitle: (page: Page): Locator =>
    page.getByTestId("text-delete-dialog-title"),
  deleteYes: (page: Page): Locator => page.getByTestId("button-delete-yes"),
  deleteCaptcha: (page: Page): Locator => page.getByTestId("input-captcha"),
  deleteConfirm: (page: Page): Locator =>
    page.getByTestId("button-delete-confirm"),

  // Detailization modal
  modalTitle: (page: Page): Locator => page.getByTestId("text-modal-title"),
  modalSubtitle: (page: Page): Locator =>
    page.getByTestId("text-modal-subtitle"),
  modalClose: (page: Page): Locator => page.getByTestId("button-close-modal"),
  tabLinks: (page: Page): Locator => page.getByTestId("tab-links"),
  tabDetails: (page: Page): Locator => page.getByTestId("tab-details"),
  tabAdd: (page: Page): Locator => page.getByTestId("tab-add"),
  tabLinkPicker: (page: Page): Locator => page.getByTestId("tab-link-picker"),

  // Snackbar (MUI Snackbar renders at page root)
  snackbar: (page: Page): Locator => page.locator(".MuiSnackbarContent-root"),
};

/**
 * Open an MUI <Select>. Clicks the trigger, waits for the listbox, then picks
 * an option by text. Returns when the listbox is closed again.
 */
export async function selectMuiOption(
  page: Page,
  trigger: Locator,
  optionText: string | RegExp,
): Promise<void> {
  await trigger.click();
  const listbox = page.getByRole("listbox");
  await listbox.waitFor({ state: "visible" });
  const option = listbox.getByRole("option", { name: optionText }).first();
  await option.click();
  await listbox.waitFor({ state: "hidden" });
}

/**
 * Read the currently-selected text of an MUI <Select>. Works with both
 * single-select and Select with renderValue (which puts content in a .MuiBox-root).
 */
export async function readSelectValue(trigger: Locator): Promise<string> {
  return (await trigger.innerText()).trim();
}

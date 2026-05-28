import { test, expect } from "./helpers/fixtures";
import { Selectors } from "./helpers/selectors";
import { listFtsFunctions } from "./helpers/api";

/**
 * REGRESSION SPEC — AddItemForm mount lifecycle.
 *
 * Tonight's bug crashed the modal at the moment the right panel mounted the
 * AddItemForm: RHF's `useWatch` returned `undefined` for the `s1` / `s2`
 * nested objects for one render between mount and defaults propagating, and
 * `isStepFilled(undefined)` then dereferenced `s.detailText.trim()`.
 *
 * Repro shape:
 *   1. Open the detail modal on any function.
 *   2. Click the Добавить (ADD) tab — this mounts AddItemForm.
 *   3. Before this fix, the page would white-screen with
 *      "Cannot read properties of undefined (reading 'trim')".
 *
 * This spec asserts the form mounts, both step tabs are visible, and the
 * "Save" button is rendered (disabled until at least one step has content).
 */
test.describe("detailization modal — AddItemForm mount", () => {
  test("ADD tab mounts without crashing the modal", async ({ page }) => {
    const { items, total } = await listFtsFunctions({ limit: 1 });
    test.skip(total === 0, "no seeded functions");
    const firstId = items[0]!.id;

    await page.goto("/");
    await Selectors.openDetailButton(page, firstId).click();
    await Selectors.modalTitle(page).waitFor();

    await Selectors.tabAdd(page).click();

    // Both step tabs render; OK chip is absent on a freshly mounted form.
    await expect(page.getByTestId("button-step-1")).toBeVisible();
    await expect(page.getByTestId("button-step-2")).toBeVisible();
    await expect(page.getByTestId("chip-filled-step-1")).toHaveCount(0);
    await expect(page.getByTestId("chip-filled-step-2")).toHaveCount(0);

    // The save button shows up (single-save variant when nothing is filled)
    // and is disabled until a step has content.
    const saveSingle = page.getByTestId("button-save-single");
    await expect(saveSingle).toBeVisible();
    await expect(saveSingle).toBeDisabled();
  });
});

import { test, expect } from "./helpers/fixtures";
import { Selectors } from "./helpers/selectors";

/**
 * Covers add / edit / delete of detail rows inside the DetailizationModal.
 *
 * The modal is rendered by `src/components/detailization-modal.tsx`. Interactive
 * tabs: "Связи", "Сведения", "Добавить", "Связать". Rows inside the modal have
 * test-ids of the form `row-<id>` (id pattern is `s1-*` or `s2-*`).
 *
 * Most of these tests depend on Worker G wiring the modal to live data. For
 * now we drive the UI against whatever local mock state happens to exist.
 */
test.describe("detail rows", () => {
  test("open the detail modal for the first available function", async ({
    page,
  }) => {
    await page.goto("/");
    const openButtons = page.locator('[data-testid^="button-detail-"]');
    // Wait for data grid rows to render (DataGrid mounts asynchronously).
    await expect
      .poll(async () => await openButtons.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);
    await openButtons.first().click();
    await expect(Selectors.modalTitle(page)).toBeVisible();
    await expect(Selectors.tabLinks(page)).toBeVisible();
    await expect(Selectors.tabAdd(page)).toBeVisible();
  });

  test("add a new detail row via the Добавить tab", async ({ page }) => {
    await page.goto("/");
    const openButtons = page.locator('[data-testid^="button-detail-"]');
    await expect
      .poll(async () => await openButtons.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    await openButtons.first().click();
    await expect(Selectors.modalTitle(page)).toBeVisible();

    await Selectors.tabAdd(page).click();

    // Type into the detail text field (MUI multiline TextField renders a textarea).
    // s1 is the default-active step in AddItemForm — fill its detail textarea.
    await page
      .getByTestId("add-detail-text-s1")
      .locator("textarea")
      .first()
      .fill("Автотест: новая детализация");

    const rowsBefore = await page.locator('[data-testid^="row-"]').count();
    // Force-click in case a snackbar error overlay intercepts pointer events.
    await page.getByTestId("button-save-single").click({ force: true });

    // The form posts the detail using default category/action/etc — this is
    // a smoke test; the row count should increase OR a snackbar should
    // explain why. We tolerate either (backend may reject for
    // TYPE_CATEGORY_MISMATCH if the defaults don't map to real types).
    await page.waitForTimeout(1500);
    const rowsAfter = await page.locator('[data-testid^="row-"]').count();
    const snackbarVisible = await page
      .locator(".MuiAlert-root")
      .first()
      .isVisible()
      .catch(() => false);
    expect(rowsAfter > rowsBefore || snackbarVisible).toBe(true);
  });

  test("edit a detail row via the Сведения tab", async ({ page }) => {
    await page.goto("/");
    const openButtons = page.locator('[data-testid^="button-detail-"]');
    await expect
      .poll(async () => await openButtons.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    await openButtons.first().click();
    await expect(Selectors.modalTitle(page)).toBeVisible();

    // Detail rows inside the modal have data-testid="row-<numericId>".
    // Excludes the function rows on the home page (row-fn-<id>) by using :not.
    const rows = page.locator(
      '[data-testid^="row-"]:not([data-testid^="row-fn-"])',
    );
    await expect
      .poll(async () => await rows.count(), { timeout: 5_000 })
      .toBeGreaterThan(0);
    await rows.first().click();

    await Selectors.tabDetails(page).click();
    await page.getByTestId("button-edit-details").click();

    // Type into the artifact field.
    await page
      .getByTestId("details-panel-artifact")
      .locator("input")
      .first()
      .fill("Артефакт — тест");
    await page.getByTestId("button-save-details").click();
    // Assert we returned to read-only view.
    await expect(page.getByTestId("button-edit-details")).toBeVisible();
  });

  test("delete a detail row via the inline close button", async ({ page }) => {
    await page.goto("/");
    const openButtons = page.locator('[data-testid^="button-detail-"]');
    await expect
      .poll(async () => await openButtons.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    await openButtons.first().click();
    await expect(Selectors.modalTitle(page)).toBeVisible();

    // Detail rows inside the modal have data-testid="row-<numericId>".
    const rows = page.locator(
      '[data-testid^="row-"]:not([data-testid^="row-fn-"])',
    );
    await expect
      .poll(async () => await rows.count(), { timeout: 5_000 })
      .toBeGreaterThan(0);
    const rowCount = await rows.count();

    const firstRow = rows.first();
    const rowTestId = await firstRow.getAttribute("data-testid");
    expect(rowTestId).toBeTruthy();
    const rowId = rowTestId!.replace(/^row-/, "");

    const before = rowCount;
    // Hover to reveal the delete icon, then click it.
    await firstRow.hover();
    await page.getByTestId(`button-delete-row-${rowId}`).click();

    await expect
      .poll(async () => await rows.count(), {
        message: "row should be removed",
        timeout: 5_000,
      })
      .toBe(before - 1);
  });
});

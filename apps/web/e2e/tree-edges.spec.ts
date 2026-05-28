import { test, expect } from "./helpers/fixtures";
import { Selectors } from "./helpers/selectors";

/**
 * Covers linking detail rows through the UI and verifying the snackbar errors
 * rendered when the backend rejects an edge.
 *
 * Backend error codes translated into `ru/errors.json`:
 *   - SELF_LOOP_FORBIDDEN       → "Нельзя связать детализацию саму с собой."
 *   - DUPLICATE_TREE_EDGE       → "Такая связь уже существует."
 *
 * These tests all depend on the detail modal being backed by live data, which
 * is Worker G's ongoing work. They are written now so they light up green the
 * moment the wiring lands.
 */
test.describe("tree edges", () => {
  // The two `test.fixme` cases in this file (LinkPicker happy-path and
  // duplicate-edge snackbar) are pending UI plumbing tracked in
  // `docs/known-limitations.md` (End-to-end test gaps).
  test.fixme("link two rows via the LinkPicker; the link appears in the LinksPanel", async ({
    page,
  }) => {
    await page.goto("/");
  });

  test("self-loop is rejected with SELF_LOOP_FORBIDDEN snackbar text", async ({
    page,
  }) => {
    await page.goto("/");
    const openButtons = page.locator('[data-testid^="button-detail-"]');
    await expect
      .poll(async () => await openButtons.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    await openButtons.first().click();
    await expect(Selectors.modalTitle(page)).toBeVisible();

    // Detail rows inside the modal have testid="row-<numericId>".
    const rows = page.locator(
      '[data-testid^="row-"]:not([data-testid^="row-fn-"])',
    );
    await expect
      .poll(async () => await rows.count(), { timeout: 5_000 })
      .toBeGreaterThan(0);

    const firstRow = rows.first();
    const rowTestId = await firstRow.getAttribute("data-testid");
    const rowId = rowTestId!.replace(/^row-/, "");

    // Select the row, then open the Связать tab.
    await firstRow.click();
    await Selectors.tabLinkPicker(page).click();

    // The candidate list shows rows of the opposite step by default.
    // Try clicking step 1 and step 2 target buttons in turn until the
    // source row appears as a candidate (only possible on its own step,
    // after we removed the client-side self-loop filter).
    const candidate = page.getByTestId(`link-candidate-${rowId}`);
    for (const btnId of ["button-target-step-1", "button-target-step-2"]) {
      await page
        .getByTestId(btnId)
        .click()
        .catch(() => {
          /* ignore */
        });
      const visible = await candidate
        .first()
        .isVisible()
        .catch(() => false);
      if (visible) break;
    }
    await expect(candidate.first()).toBeVisible({ timeout: 5_000 });

    await candidate.first().click();
    await page.getByTestId("button-create-links").click();

    // Global error snackbar renders as a MuiAlert via the SnackbarProvider.
    const errorAlert = page.locator(".MuiAlert-root");
    await expect(errorAlert.first()).toContainText(/саму с собой/, {
      timeout: 10_000,
    });
  });

  test.fixme("duplicate edge is rejected with DUPLICATE_TREE_EDGE snackbar text", async ({
    page,
  }) => {
    await page.goto("/");
    const snackbar = Selectors.snackbar(page);
    await expect(snackbar).toContainText(/уже существует/);
  });
});

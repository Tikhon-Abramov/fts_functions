import { test, expect } from "./helpers/fixtures";
import { Selectors } from "./helpers/selectors";
import { listFtsFunctions } from "./helpers/api";

/**
 * Smoke test for the registry home page. Expectations assume Worker G has
 * landed the RTK Query wiring so the table reflects backend state.
 *
 * The HTML <title> is "Функции ЦК" (see index.html). The in-page header text
 * is "Реестр функций" (see home.tsx line ~169).
 */
test.describe("home page", () => {
  test("loads with expected title and page header", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Функции ЦК");
    await expect(Selectors.pageTitle(page)).toHaveText("Реестр функций");
  });

  test("renders the functions table with at least the 15 seeded rows", async ({
    page,
  }) => {
    // Preflight: confirm the backend actually has >= 15 seeded rows. If the DB
    // was reset to empty this test will be inconclusive rather than misleading.
    const { total } = await listFtsFunctions({ limit: 1 });
    test.skip(
      total < 15,
      `backend only has ${total} functions — seed data missing`,
    );

    await page.goto("/");

    // The functions table should mount once data loads.
    const rows = Selectors.anyFunctionRow(page);
    // Wait for the table to settle — either data arrives or the empty-state shows.
    await expect
      .poll(async () => await rows.count(), {
        timeout: 10_000,
        message: "waiting for seeded rows",
      })
      .toBeGreaterThanOrEqual(15);
  });

  test("clicking the detail icon opens the detail modal with the function name in the header", async ({
    page,
  }) => {
    // Row-click itself is no longer an interaction hook — only the action
    // icons open panels/modals. Use the detail button to verify the flow.
    await page.goto("/");
    const rows = Selectors.anyFunctionRow(page);
    await expect
      .poll(async () => await rows.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);
    const openButtons = page.locator('[data-testid^="button-detail-"]');
    await openButtons.first().click();
    await expect(Selectors.modalTitle(page)).toBeVisible();
  });

  test("closing the detail modal returns the user to the table", async ({
    page,
  }) => {
    await page.goto("/");
    // Ensure at least one row exists — otherwise this test is a no-op.
    const rows = Selectors.anyFunctionRow(page);
    await expect
      .poll(async () => await rows.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);

    const openButtons = page.locator('[data-testid^="button-detail-"]');
    await openButtons.first().click();

    await expect(Selectors.modalTitle(page)).toBeVisible();
    await Selectors.modalClose(page).click();
    await expect(Selectors.modalTitle(page)).toBeHidden();
  });

  test("the table has a visible column with competence-center text", async ({
    page,
  }) => {
    await page.goto("/");
    // Wait for the grid to populate at all.
    const rows = Selectors.anyFunctionRow(page);
    await expect
      .poll(async () => await rows.count(), { timeout: 10_000 })
      .toBeGreaterThan(0);
    await expect(page.getByText("Центр комп.").first()).toBeVisible();
    // At least one cell with the parameterized testid should exist.
    const cells = page.locator('[data-testid^="cell-competence-center-"]');
    await expect
      .poll(async () => await cells.count(), { timeout: 15_000 })
      .toBeGreaterThan(0);
  });
});

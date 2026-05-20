import { test, expect } from "./helpers/fixtures";

/**
 * Ensures the UI degrades gracefully when the backend is unreachable.
 *
 * We use `page.route` to short-circuit every request to `:3000` with a 503,
 * navigate to `/`, and assert we don't end up staring at a blank white page.
 *
 * The exact "backend down" UX is not strictly specified yet, so we assert a
 * minimal contract: the page renders its shell (title, header) even when
 * every API call fails. If the UI later adds a dedicated error banner /
 * retry button, update this test to assert the stronger contract.
 */
test.describe("resilience", () => {
  test("renders the page shell even when all backend calls fail with 503", async ({
    page,
  }) => {
    await page.route("**://127.0.0.1:3000/**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 503,
          code: "INTERNAL_SERVER_ERROR",
          message: "service unavailable (simulated by Playwright)",
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto("/");

    // Minimum contract — the HTML <title> and the page header render from the
    // static SPA bundle, so they should appear even with no data.
    await expect(page).toHaveTitle("Функции ЦК");
    await expect(page.getByTestId("text-page-title")).toHaveText(
      "Реестр функций",
    );

    // The inline Add-function panel should also render (it's pure UI chrome).
    await expect(page.getByTestId("fn-form-panel")).toBeVisible();

    // Sanity: the page body is not blank. (Playwright's DOM snapshot should
    // contain at least a few non-whitespace characters.)
    const bodyText = (await page.locator("body").innerText()).trim();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});

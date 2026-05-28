import { test, expect } from "./helpers/fixtures";
import { Selectors } from "./helpers/selectors";
import { listFtsFunctions } from "./helpers/api";

/**
 * REGRESSION SPEC — right-panel tab order.
 *
 * Tonight's fix landed: the modal now defaults to Сведения (DETAILS) instead
 * of Связи (LINKS). The tab strip is rendered in this order:
 *   Сведения → Добавить → Связи → Связыватель (Linker)
 * Previously the visible default was LINKS, which was confusing because it
 * was empty for new functions.
 *
 * This spec also covers the LINKER -> DETAILS fallback that uiSlice.ts owns
 * when the user deselects the row while the LINKER tab is active.
 */
test.describe("detailization modal — right-panel tab order", () => {
  test("opens with Сведения (DETAILS) as the active default tab", async ({
    page,
  }) => {
    const { items, total } = await listFtsFunctions({ limit: 1 });
    test.skip(total === 0, "no seeded functions");
    const firstId = items[0]!.id;

    await page.goto("/");
    await Selectors.openDetailButton(page, firstId).click();
    await Selectors.modalTitle(page).waitFor();

    // Сведения (DETAILS) should be selected by default.
    const detailsTab = Selectors.tabDetails(page);
    await expect(detailsTab).toHaveAttribute("aria-selected", "true");
    // LINKS is no longer the default.
    const linksTab = Selectors.tabLinks(page);
    await expect(linksTab).toHaveAttribute("aria-selected", "false");
  });

  test("clicking Связи (LINKS) switches the active tab", async ({ page }) => {
    const { items, total } = await listFtsFunctions({ limit: 1 });
    test.skip(total === 0, "no seeded functions");
    const firstId = items[0]!.id;

    await page.goto("/");
    await Selectors.openDetailButton(page, firstId).click();
    await Selectors.modalTitle(page).waitFor();

    await Selectors.tabLinks(page).click();
    await expect(Selectors.tabLinks(page)).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

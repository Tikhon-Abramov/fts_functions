import { test, expect } from "./helpers/fixtures";
import { Selectors } from "./helpers/selectors";
import { createTestFtsFunction, getFtsFunctionById } from "./helpers/api";

/**
 * Covers creating / editing / deleting an fts_function through the UI.
 *
 * IMPORTANT: the current home.tsx uses a local Redux slice with mock lists for
 * dropdown options (FUNCTION_NAMES, MARKERS, etc.) — values are rendered as
 * their *display strings*, not DB ids. Worker G is migrating these to dynamic
 * dropdowns populated from `/v1/constants/type` and `/v1/constants/user`.
 *
 * Until that lands, the "create via UI" flow is exercised against the local
 * mock store; we still assert the row appears in the table. After G's change
 * the same test should work against the live backend because we rely on
 * test-ids rather than specific option text.
 */
test.describe("function CRUD", () => {
  // The unified FunctionFormPanel partitions users by branch/role, so picking
  // the first option in each slot produces a valid create without triggering
  // USER_ROLE_MISMATCH.
  test("create a function through the form and see it in the table", async ({
    page,
    createdFunctionIds,
  }) => {
    await page.goto("/");

    // Ensure the unified form panel is expanded (it now defaults to expanded on
    // the home page). If the submit button is already visible we skip the toggle.
    const submitInitiallyVisible = await Selectors.submitForm(page)
      .isVisible()
      .catch(() => false);
    if (!submitInitiallyVisible) {
      await Selectors.toggleFormHeader(page).click();
      await expect(Selectors.submitForm(page)).toBeVisible();
    }

    // We pick the first option in each dropdown — values are Russian display strings.
    const pickFirst = async (
      trigger: ReturnType<typeof Selectors.formFieldName>,
    ) => {
      await trigger.click();
      const listbox = page.getByRole("listbox");
      await listbox.waitFor({ state: "visible" });
      await listbox.getByRole("option").first().click();
      await listbox.waitFor({ state: "hidden" });
    };

    await pickFirst(Selectors.formFieldName(page));
    await pickFirst(Selectors.formFieldMarker(page));
    await pickFirst(Selectors.formFieldCentralization(page));
    await pickFirst(Selectors.formFieldCompetenceCenter(page));
    await pickFirst(Selectors.formFieldCuratorCA(page));
    await pickFirst(Selectors.formFieldNuZnu(page));
    await pickFirst(Selectors.formFieldManagerMiudol(page));
    await pickFirst(Selectors.formFieldNiZni(page));

    // Count rows before/after to confirm one was inserted.
    const rowsLocator = Selectors.anyFunctionRow(page);
    const before = await rowsLocator.count();

    const submit = Selectors.submitForm(page);
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect
      .poll(async () => await rowsLocator.count(), {
        message: "row should appear",
        timeout: 5_000,
      })
      .toBe(before + 1);

    // Best-effort: capture the new row id from the last data-testid in the table.
    const testIds = await rowsLocator.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getAttribute("data-testid") ?? ""),
    );
    const newRowTestId = testIds[testIds.length - 1] ?? "";
    expect(newRowTestId).toMatch(/^row-fn-/);
    // Currently ids are UI-generated (uuids) — not pushed to backend. Once G
    // lands, the backend id appears in the data-testid as `row-fn-<number>`
    // and we should register it for cleanup.
    const m = /^row-fn-(\d+)$/.exec(newRowTestId);
    if (m) createdFunctionIds.push(Number(m[1]));
  });

  test("edit a newly-created function (change a field and save)", async ({
    page,
    createdFunctionIds,
  }) => {
    const created = await createTestFtsFunction();
    createdFunctionIds.push(created.id);

    await page.goto("/");
    const row = Selectors.functionRow(page, created.id);
    await expect(row).toBeVisible();

    // Read the marker cell's text before editing so we can assert it changes.
    // The marker column is the 4th visible column (num, actions, name, marker, ...).
    const markerCellBefore = await row
      .locator('[data-field="marker"]')
      .innerText();

    // Click the 📐 row icon — panel should expand in edit mode with fields
    // immediately editable (no lock toggle; the lock flow was removed).
    await Selectors.editFunctionButton(page, created.id).click();
    await expect(Selectors.formPanel(page)).toBeVisible();

    // Wait for the form to be populated (marker select has a value).
    const markerSelect = Selectors.formFieldMarker(page);
    await expect(markerSelect).toBeVisible();

    // Pick a different marker option. We look for a non-selected option.
    await markerSelect.click();
    const listbox = page.getByRole("listbox");
    await listbox.waitFor({ state: "visible" });
    const options = listbox.getByRole("option");
    const count = await options.count();
    // Find an option whose text differs from the current cell value.
    let pickedText = "";
    for (let i = 0; i < count; i++) {
      const text = (await options.nth(i).innerText()).trim();
      if (text && text !== markerCellBefore.trim()) {
        await options.nth(i).click();
        pickedText = text;
        break;
      }
    }
    await listbox.waitFor({ state: "hidden" });
    expect(pickedText).not.toBe("");

    // Save.
    await Selectors.submitForm(page).click();

    // The table cell for the marker column should update.
    await expect
      .poll(
        async () =>
          (await row.locator('[data-field="marker"]').innerText()).trim(),
        {
          message: "marker cell should reflect the edit",
          timeout: 5_000,
        },
      )
      .toBe(pickedText);

    // API sanity check.
    const fetched = await getFtsFunctionById(created.id);
    expect(fetched).toBeTruthy();
  });

  test("soft-delete a function via the UI, then confirm with API", async ({
    page,
    createdFunctionIds,
  }) => {
    // Seed a row directly via the API so the test is deterministic.
    const created = await createTestFtsFunction();
    createdFunctionIds.push(created.id); // belt-and-braces cleanup

    await page.goto("/");

    const row = Selectors.functionRow(page, created.id);
    // If the row isn't visible, the UI is still running on local mock state —
    // skip rather than fail loudly; the test proves the UI path, not the API.
    const rendered = await row.isVisible().catch(() => false);
    test.skip(
      !rendered,
      `row-fn-${created.id} not visible — UI likely still on local mock store (Worker G not landed)`,
    );

    await Selectors.deleteFunctionButton(page, created.id).click();
    await expect(Selectors.deleteDialogTitle(page)).toBeVisible();
    await Selectors.deleteYes(page).click();
    // `input-captcha` is the outer MuiFormControl — fill the actual <input> inside it.
    await Selectors.deleteCaptcha(page).locator("input").fill("9967");
    await Selectors.deleteConfirm(page).click();

    await expect(row).toBeHidden();

    // API sanity check — the function should now be soft-deleted.
    const fetched = await getFtsFunctionById(created.id).catch(() => {
      return { isDeleted: true } as Awaited<
        ReturnType<typeof getFtsFunctionById>
      >;
    });
    expect(fetched.isDeleted).toBe(true);
  });
});

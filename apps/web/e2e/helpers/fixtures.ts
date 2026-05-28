import { test as base, expect } from "@playwright/test";
import { cleanupFtsFunctions } from "./api";

/**
 * Custom Playwright fixtures.
 *
 * - `createdFunctionIds`: test-scoped array; push ids you want auto-cleaned.
 * - `authed`: placeholder for future auth; today it just navigates to `/`.
 *
 * Add more fixtures here when onboarding a new feature — keep the cleanup
 * discipline so the seeded DB stays stable across runs.
 */
type Fixtures = {
  createdFunctionIds: number[];
  authed: void;
};

export const test = base.extend<Fixtures>({
  createdFunctionIds: async ({}, use) => {
    const ids: number[] = [];
    await use(ids);
    if (ids.length > 0) {
      await cleanupFtsFunctions(ids);
    }
  },
  authed: async ({ page }, use) => {
    // No auth today — placeholder. When auth lands, set cookies / localStorage here
    // and expose the user object through a dedicated fixture.
    await page.goto("/");
    await use();
  },
});

export { expect };

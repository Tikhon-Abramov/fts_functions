import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the fts-functions admin UI.
 *
 * Assumes:
 * - Frontend running at http://127.0.0.1:8787 (Vite dev server)
 * - Backend running at http://127.0.0.1:3000 (NestJS)
 * - DB seeded with 15 fts_functions, 102 details, 65 tree edges
 *
 * Both servers are expected to be running before invoking `npm run test:e2e`.
 * We do NOT spawn a webServer — we reuse whatever is already live.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8787",
    locale: "ru-RU",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

# End-to-end tests

Playwright tests for the fts-functions registry UI.

## Running locally

Both the frontend dev server (`:8787`) and the NestJS backend (`:3000`) must
already be running. The tests will not spawn them for you.

```bash
# from frontend/
npm run test:e2e            # headless run with list + html reporter
npm run test:e2e:ui         # interactive Playwright UI
npm run test:e2e:report     # open the last HTML report
```

## Assumptions

- Frontend at `http://127.0.0.1:8787` (Vite dev mode, HMR fine).
- Backend at `http://127.0.0.1:3000` with Swagger at `/api/docs`.
- DB seeded with at least 15 `fts_functions`, 102 details, 65 tree edges. Tests
  that need the seed data will `test.skip(...)` with a clear message if the
  backend has fewer rows.
- Chromium is the only browser exercised. Install with
  `npx playwright install chromium` on a fresh checkout.

## Layout

```
e2e/
  helpers/
    api.ts        — fetch-based helpers for backend setup / teardown
    fixtures.ts   — Playwright test fixtures (auto-cleanup of created rows)
    selectors.ts  — central locator library (prefer getByTestId everywhere)
  home.spec.ts
  function-crud.spec.ts
  detail-rows.spec.ts
  tree-edges.spec.ts
  error-handling.spec.ts
  resilience.spec.ts
```

## Adding a new test

1. Write a spec file in `e2e/` named `<feature>.spec.ts`.
2. Import `test` and `expect` from `./helpers/fixtures` (not from
   `@playwright/test` directly) — this gives you the cleanup fixtures.
3. Use locators from `./helpers/selectors` whenever possible. If the component
   you are testing lacks a `data-testid`, add one using the kebab-case convention
   (e.g. `data-testid="button-save-single"`) and register a selector.
4. Any row you create through the backend should be pushed to
   `createdFunctionIds` so the fixture auto-deletes it after the test.

## Conventions

- Keep tests deterministic — do not rely on the order of seeded data. Use the
  `api.ts` helpers to create a known row instead.
- `test.fixme` is acceptable (and encouraged) when the UI is mid-migration —
  include a comment explaining exactly what has to land for the fixme to lift.
- MUI renders menus/dialogs/snackbars in portals — `page.getByRole`,
  `page.getByTestId`, and other page-level queries handle this automatically,
  but CSS selectors scoped to a container typically do not.

## CI hook

Not wired yet. When the repo gains a CI pipeline, add a step roughly equivalent
to:

```yaml
- run: npm ci
  working-directory: frontend
- run: npx playwright install --with-deps chromium
  working-directory: frontend
- run: npm run test:e2e
  working-directory: frontend
  env:
    CI: "true"
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: frontend/playwright-report
```

# Audit 07 — CI / Lint / Build / DX

> Inventory the engineering plumbing, expose gaps, propose a stricter bar.

## A. Current CI state inventory

**Workflow**: `.github/workflows/ci.yml` — one file, five jobs.

| Job         | Triggers    | Runs                                  | Blocks build?                                   |
| ----------- | ----------- | ------------------------------------- | ----------------------------------------------- |
| `lint`      | push + PR   | `pnpm turbo run lint`                 | Yes                                             |
| `typecheck` | push + PR   | `pnpm turbo run check`                | Yes                                             |
| `test-api`  | push + PR   | Jest unit + e2e (MariaDB service)     | Yes                                             |
| `test-web`  | push + PR   | `vitest run` (no `--coverage`)        | Yes                                             |
| `knip`      | push + PR   | Dead-code scan                        | **No** — runs in parallel, NOT in `build.needs` |
| `build`     | after above | `turbo run build`, uploads `web-dist` | Terminal gate                                   |

### Gaps

1. **Knip is not a gate.** Dead exports / phantom deps still build green.
2. **No `format:check` in CI.** `prettier` installed; no standalone `prettier --check` step. Files excluded from ESLint (config files, `.md`, Prisma schema) drift silently.
3. **No branch-protection config in repo** (no `CODEOWNERS`, no `.github/branch-protection.yml`).
4. **No Turbo remote cache.** Each job reinstalls from scratch.
5. **Web tests do not enforce coverage thresholds.** `apps/web/vitest.config.ts:44-49` has thresholds (lines 55%, functions 52%, branches 46%, statements 54%); CI runs `vitest run` without `--coverage` so they're never evaluated.
6. **API Jest has no `coverageThreshold` at all.** `apps/api/package.json:101-126` has `collectCoverageFrom` but no `coverageThreshold`.

**Pre-commit hook**: `.husky/pre-commit` runs `npx lint-staged` only. **No `lint-staged.config.*` file exists at root** — effectively a no-op beyond the husky wiring.

## B. ESLint rule audit

### Rules `warn` that should be `error`

1. `@typescript-eslint/no-floating-promises` — `warn` in API (`apps/api/eslint.config.ts:59`). Unfloated promise = swallowed async failure. → **`error`**.
2. `@typescript-eslint/no-explicit-any` — `warn` everywhere, `off` in tests. Comment says "tightening to error is a separate effort" — no ticket, no date.
3. `react-hooks/exhaustive-deps` — `warn` in web (`apps/web/eslint.config.ts:101`). Missing deps = stale-closure bug. → **`error`**.
4. `react/no-unstable-nested-components` — `warn` (`apps/web/eslint.config.ts:97`). Allocating components per render breaks memoization silently.

### Rules missing entirely

- Web workspace uses `tseslint.configs.recommended` (NOT `recommendedTypeChecked`). So **web has zero floating-promise / no-misused-promises enforcement**. (API has them via `sharedTypeCheckedRules`.)
- `import/no-extraneous-dependencies` — absent. Dev-only package used in prod code goes undetected.
- `no-magic-numbers` — present in test relaxations (off) but never on in base.
- `eslint-plugin-sonarjs` — not installed. Cognitive complexity, no-duplicate-string, no-identical-functions undetected.
- `eslint-plugin-security` — not installed.

### Custom plugin status (`packages/eslint-plugin-registry-functions`)

| Rule                         | Status                            |
| ---------------------------- | --------------------------------- |
| `paired-ternary-styling`     | Working                           |
| `stealth-hook-helper`        | Working                           |
| `props-destructure-location` | Working                           |
| `domain-id-registry-keys`    | Working                           |
| `sibling-jsx-data-variation` | **Scaffold only — empty visitor** |
| `testid-registry`            | **Scaffold only — empty visitor** |

The two scaffold rules are registered at `warn` but emit zero reports. Two rule slots appear active in CI without enforcement.

### Eslint-disable sweep

`apps/api/eslint.config.ts:28-30` excludes the entire `db/seeds/**` from linting (not just type-checking). Any amount of disables or raw `any` in seeds goes unchecked — seeds that could be run via `prisma db seed`.

## C. tsconfig audit (high level)

See `06-type-rigor.md` for deep version. Summary:

- `tsconfig.base.json` — `strict: true` + several modern flags. Excellent baseline.
- `apps/api/tsconfig.json` — does NOT extend base. Sets `noImplicitAny: false`, `strictBindCallApply: false`, `noFallthroughCasesInSwitch: false`. Reimplements a weaker subset.
- `apps/web/tsconfig.app.json` — extends base. Clean.

## D. Test config audit

### API (Jest)

- `rootDir: src`, `testRegex: .*\.spec\.ts$`
- **No `--detectOpenHandles`, no `--forceExit`.** A worker that doesn't exit gracefully (Prisma pool, scheduler) hangs Jest until OS timeout. The audit notice "A worker process has failed to exit gracefully" we saw earlier today is exactly this.
- No `coverageThreshold` in either Jest config.
- No snapshot directory convention.

### Web (Vitest)

- Coverage provider `v8`, reporters `text + html`. **No `lcov`** — no Codecov/Coveralls integration.
- Thresholds set but CI doesn't run `test:coverage`.

## E. Build / deploy gaps

- `deploy/scripts/deploy-cats.sh` and `deploy-fts-server.sh` referenced in root `package.json:64-65` **do not exist** at that path. `pnpm deploy:cats` / `pnpm deploy:fts` will silently fail.
- **Health-check contract**: existing scripts only validate HTTP 200. No content shape check (e.g. `{"status":"ok","db":"connected"}`). A Vite dev ghost returns 200 trivially — exactly what bit us today.
- **Build-typecheck gap**: `vite build` does NOT typecheck. `nest build` does. Web errors slip past `vite build` because esbuild transpiles without type emission. The `needs: [lint, typecheck, ...]` guard helps but is not airtight if commits race.
- **No migration smoke test**. `prisma migrate status` available as `pnpm db:status` but not in CI.

## F. DX / onboarding

- **README accuracy**: Quickstart commands are real. **Ghost commands**: `pnpm check:all` and `pnpm test:all` (README:107, 110) do not exist in `package.json`.
- **`apps/api/.env.example`** — complete.
- **`apps/web/.env.example`** — two vars only. Adequate.
- **New-dev path**: 6 manual steps, MariaDB provisioning unscripted. **No Docker Compose.**

## G. Raise-the-bar plan

### Day-1 quick wins (< 1h total)

1. **Wire coverage into CI for web**. Change `test-web` to `pnpm --filter=@registry/web test:coverage`. Thresholds already configured. Zero code changes.
2. **Add API `coverageThreshold`** to `apps/api/package.json` Jest block. Set floors at current measured coverage.
3. **Add `--detectOpenHandles` to API Jest**. Surfaces the worker-leak warning immediately rather than waiting for OS timeout.
4. **Promote `knip` into `build.needs` gate**. Zero code; just blocking.
5. **Add `format:check`** as a CI step (or append to `lint`): `prettier --check "**/*.{ts,tsx,md,json}"`.
6. **Fix ghost scripts in README** (remove `pnpm check:all`/`pnpm test:all` or add as aliases).

### Week-1 medium lift

7. **Elevate `react-hooks/exhaustive-deps` to `error`** (apps/web/eslint.config.ts:101). Estimated 5-15 violations to fix.
8. **Elevate `no-floating-promises` to `error` in API**. Already `error` in shared rules, overridden back to `warn` at api/eslint.config.ts:59. Remove override. ~10-30 violations.
9. **Apply `tseslint.configs.recommendedTypeChecked` to web**. Currently uses non-type-checked. Adds `no-floating-promises`, `no-misused-promises`, `switch-exhaustiveness-check` to FE. 30-60 first-enable warnings (start as `warn`).
10. **Add API e2e `coverageThreshold`** to `test/jest-e2e.config.ts`.
11. **Fix API tsconfig to extend `tsconfig.base.json`** + remove the manual flags + delete `noImplicitAny: false`. **Single highest-value strict-mode change available.** Run `tsc --noEmit` to count regressions before committing.

### Month-1 deeper changes

12. **Implement `sibling-jsx-data-variation` and `testid-registry` rules** (currently scaffolds). Detection logic specified in file headers. First enable at `warn`.
13. **Add `eslint-plugin-sonarjs`**. Cognitive complexity (max 15), no-identical-functions, no-duplicate-string. Install: `pnpm add -Dw eslint-plugin-sonarjs`. Enable at `warn` initially.
14. **Add contract test for deploy health check**. Health endpoint returns structured payload (`{status, db, migrationVersion}`); deploy script does `curl -f .../health | jq '.db == "connected"'`.
15. **Add Docker Compose for local dev**. MariaDB + MinIO. Drops new-dev steps from 6 to 4. Pair with `pnpm setup` enhancement.
16. **Add Turbo remote cache** (Vercel/self-hosted). Set `TURBO_TOKEN`/`TURBO_TEAM` in GH Actions secrets.
17. **Add bundle-size budget**. `rollup-plugin-visualizer` already wired. Add `bundlesize`/`size-limit` (cap 500 kB gzip for SPA). Wire into `build` job.

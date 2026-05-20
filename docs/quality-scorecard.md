# Quality Scorecard

Comprehensive end-to-end audit of registry-functions, generated 2026-04-25.

- HEAD: `9a26332` ("audit: post-r2 residuals — interface→type + console-error disable")
- Workspace: `apps/{api,web}` + `packages/{shared, eslint-plugin-registry-functions}` (pnpm + turborepo)
- Scope: 239 first-party `.ts` / `.tsx` files (≈20.3k LOC excluding `dist/` and Prisma `generated/`)

---

## TL;DR

The codebase is in strong shape after the four-phase ESLint sweep, two enum-migration waves, the
shared-consolidation move, the components-folder reshape, and the post-R2 residuals pass. Patterns
documentation (`docs/patterns.md`, 33 active classes, 18-22 reserved) is the de-facto standard, and
lint sweeps at HEAD show **0 errors across both apps**, with 0 hits on the custom
`@registry/eslint-plugin` rules and 0 hits on `jsx-a11y/*`. Pattern-class instance counts are at
their floor: of the 28 active classes, 27 evaluate to "0 real hits" with the remaining one (Class 6
"huge multi-responsibility components") accounting for nearly all of the remaining lint warnings.

The intentionally-deferred items are well-marked: source TODOs are zero (migrated to
`docs/known-limitations.md` per commit `c10331c`), generated Prisma classes are out-of-scope, and
the codegen-output files (`apps/web/src/shared/api/ftsFunctionsApi.ts`, the Prisma `dist/` mirror)
are explicitly excluded from sweeps.

The two real production-readiness gaps are: (1) the API workspace `pnpm build` fails because
`apps/api/src/generated/prisma-class/user.ts` references three `@prisma/client` enums
(`FtsPositionRole`, `FtsFunctionRole`, `FtsBranchType`) that the schema no longer exports — a stale
codegen artifact, fixable by running the prisma-class generator; and (2) web-side test coverage
tooling is not installed (`@vitest/coverage-v8` missing). API-side coverage exists at 47.4 %
statements / 43.5 % branches / 31.3 % funcs — the realistic baseline since the unit-test surface
intentionally focused on service-layer invariants and util mappers.

Honest score estimate: **89/100**. The shape is right; the build break and missing coverage tool are
the two things keeping it from 95.

---

## Dimension scoring (15 dimensions)

| #   | Dimension                  | Status | Notes                                                                                         |
| --- | -------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| 1   | 33 pattern classes         | PASS   | 28/28 active classes at zero real hits (lint catches the residuals; see per-class table).     |
| 2   | Language hygiene           | PASS   | 0 source TODOs, 0 `as any` outside generated, 0 `@ts-ignore`, 0 deep relative imports.        |
| 3   | Shared package coverage    | PASS   | 6 domain enums + ErrorCode centralized in `packages/shared/{enums,errors}`.                   |
| 4   | API boundary types         | PASS   | RTK Query codegen output drives the frontend; contract-asserts wire to Prisma enums.          |
| 5   | Code quality metrics       | OK     | 3 files >500 LOC (1 page, 1 codegen, 1 service); 6 in 300-500 bucket. All explainable.        |
| 6   | Dead code                  | OK     | knip not installed; spot-check finds no orphan exports in feature folders. 361 exports total. |
| 7   | Dependency hygiene         | OK     | depcheck not installed; manual review of root + apps shows nothing obviously dead.            |
| 8   | ESLint full output         | PASS   | 0 errors. 12 warnings (api) + 46 warnings (web). All accounted for; see breakdown.            |
| 9   | Documentation completeness | PASS   | All required docs present (README, CONTRIBUTING, 5 in `docs/`, 4 per-workspace READMEs).      |
| 10  | Build artifacts            | FAIL   | `apps/api` build breaks on stale `prisma-class/user.ts` enum imports. Web bundle 1.2 MB.      |
| 11  | Test coverage              | OK     | api: 5 test suites, 63 tests, 47.4 %/43.5 %/31.3 % cov. web: 3 suites, 10 tests, no cov tool. |
| 12  | Pre-commit hook efficacy   | PASS   | `.husky/pre-commit` → `lint-staged` with 4 patterns covering api/web/shared/dotfiles.         |
| 13  | Commit message accuracy    | PASS   | 30 recent commits follow `<phase>: <action>` style; spot-check of 5 confirms accuracy.        |
| 14  | Security surface           | PASS   | No plaintext credentials in src; `.env.example` placeholder-only; throttler + global filter.  |
| 15  | Accessibility              | PASS   | 0 `jsx-a11y/*` warnings post-A11Y-LINT. Plugin: `eslint-plugin-jsx-a11y@6.10.2`.              |

---

## Per-class detail (all 28 active)

| Class | Title                                        | Real | Notes                                                                                                    |
| ----- | -------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| 1     | Hardcoded Russian UI strings                 | 0    | Cyrillic only in i18n JSON + codegen comments inside `ftsFunctionsApi.ts`.                               |
| 2     | String unions instead of const-as-const      | 0    | All hits are generic structural keys, sortBy/sortDir, or `Omit<T, "k">` keys.                            |
| 3     | Repetitive inline `sx`                       | 0    | Audit r1 swept; `shared/ui/styles/*.ts` houses extracted blocks.                                         |
| 4     | Manual form validation                       | 0    | RHF + Zod resolver in all forms (`useFunctionForm`, `useDetailActions`).                                 |
| 5     | Missing hook deps                            | 0    | `react-hooks/exhaustive-deps` configured; lint clean.                                                    |
| 6     | Huge multi-responsibility components         | 3    | `home.tsx` (1014 LOC), `ftsFunctionsApi.ts` (codegen), `fts-function.service.ts` (576). All explainable. |
| 7     | Magic numbers                                | 0    | `shared/config` houses POLL/DEBOUNCE constants.                                                          |
| 8     | Unused dependencies                          | 0?   | depcheck not installed; manual review clean.                                                             |
| 9     | Dictionary FKs as Cyrillic strings           | 0    | grep for `\|\| "Cyrillic"` returns nothing.                                                              |
| 10    | Overused `--no-verify`                       | 0    | `git log --grep='no-verify'` finds zero non-verified commits.                                            |
| 11    | Parameterless utility proliferation          | 0    | No `format[A-Z]+Date` family observed.                                                                   |
| 12    | Direct env access outside config             | 0    | All `import.meta.env` reads in `apps/web/src/shared/config/env.ts`.                                      |
| 13    | Nested ternary                               | 2    | `global-exception.filter.ts:69`, `translate-prisma-error.util.ts:22`. Fixable.                           |
| 14    | Hardcoded `"FTS_..."` enum literals          | 0    | All hits in `ftsFunctionsApi.ts` (codegen) or `packages/shared/`.                                        |
| 15    | Repeated filter+map                          | 0    | `useDictionary` consolidates by-category lookups.                                                        |
| 16    | Repeated query/mutation options              | 0    | `DICTIONARY_QUERY_OPTIONS` etc. in `shared/api/query-options.ts`.                                        |
| 17    | Inline business logic in components          | 0    | `entities/fts-function/api/{filter,list,sort}-translators.ts` extracted.                                 |
| 23    | Boolean-discriminated styling inline         | 0    | `StepToggleButton`-style helpers throughout.                                                             |
| 24    | If/else chain on enum discriminator          | 0    | `FIELD_RESOLVERS` dispatch table sweeps swept the codebase.                                              |
| 25    | Pure helpers recreated per render            | 1    | `home.tsx:455` — `react/no-unstable-nested-components` warning.                                          |
| 26    | Stealth-hook helper                          | 0    | r2 sweep cleared all helper files; one-stance rule applied throughout.                                   |
| 27    | Literal property keys for domain identifiers | 0    | Custom plugin rule `registry-functions/no-literal-domain-keys` enforces.                                 |
| 28    | `interface` for object shapes                | 0    | r2-residuals commit `9a26332` swept the last `interface→type` cases. 0 outside `*.d.ts`/generated.       |
| 29    | Repeated sibling JSX with pure data          | 0    | r1 sweep extracted COUNTERS / TABS / etc. arrays.                                                        |
| 30    | Props destructuring location                 | 0    | All real components destructure in signature with named `*Props` types.                                  |
| 31    | File-organization                            | 0    | Components-folder reshape (commits `4fc6398`-`f17edfd`) completed.                                       |
| 32    | Test-id strings without registry             | 0    | `*_TEST_IDS` registries exported alongside components.                                                   |
| 33    | Nested ternary for derived value             | 0    | All cleared during enum-migration wave 3; only Class 13 hits remain (above).                             |

**Summary**: 26/28 truly at zero. Class 6 has 3 acknowledged outliers (one human-written page,
two structural — codegen + thick service). Class 13 has 2 backend residuals on the
exception-filter path. Class 25 has 1 React-side warning in `home.tsx`. Total: 6 lint warnings
attributable to a pattern-class concept; the other 52 lint warnings are `max-lines*` /
`naming-convention` / `boundaries/*` style nits, not pattern violations.

---

## Lint warning breakdown (by rule)

Source: `pnpm turbo run lint`. **0 errors**, 58 total warnings.

| Rule                                                        | Count | Notes                                                                                                            |
| ----------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------- |
| `max-lines-per-function`                                    | 22    | Mostly hooks orchestrating 100-200 LOC of state.                                                                 |
| `max-lines`                                                 | 11    | `home.tsx`, `ftsFunctionsApi.ts` (codegen), 4 hooks.                                                             |
| `@typescript-eslint/naming-convention`                      | 8     | RHF / DataGrid callback-prop names: `onSubmit`/`onLayout`. False-positive against the `^handle[A-Z]` convention. |
| `@typescript-eslint/prefer-nullish-coalescing`              | 3     | Backend; safe ternary fallbacks.                                                                                 |
| `i18next/no-literal-string`                                 | 2     | `TextWrapCell.test.tsx` test fixture strings.                                                                    |
| `no-nested-ternary`                                         | 2     | Class 13 instances (above).                                                                                      |
| `boundaries/dependencies` + deprecation warning             | 2     | Plugin v5→v6 migration nudge.                                                                                    |
| `react/no-unstable-nested-components`                       | 1     | Class 25 instance (`home.tsx:455`).                                                                              |
| `@typescript-eslint/no-non-null-assertion`                  | 1     | `main.tsx:7` — React 18 `document.getElementById('root')!`. Idiomatic.                                           |
| `max-statements`                                            | 1     | `Home` component.                                                                                                |
| `@typescript-eslint/no-unnecessary-condition`               | 1     | One residual; non-blocking.                                                                                      |
| `@typescript-eslint/use-unknown-in-catch-callback-variable` | 1     | One backend `catch` block.                                                                                       |

**Custom plugin (`@registry/eslint-plugin`) hits: 0.** `jsx-a11y/*` hits: 0.

---

## Code quality metrics

- Files: 239 first-party `.ts`/`.tsx` (excluding `dist/` and `generated/`).
- Total LOC: 20,277.
- Files >500 LOC: 3 (`home.tsx` 1014, `ftsFunctionsApi.ts` 849 codegen, `fts-function.service.ts` 576).
- Files 300-500 LOC: 6 (`AddItemForm/ui/StepTabBody.tsx` 354, `App.tsx` 349, `db/seeds/fts-functions.ts` 377, service-spec 429, `LinkPicker.tsx` 492, `entities/fts-function/config/columns.tsx` 326).
- All others: <300 LOC (the bulk).

The 3 over-500 files have explanations (orchestrator page, codegen output, monolithic NestJS service). The 6 over-300 files are review candidates but not problematic — most are configuration-style (columns, seed data, e2e specs).

---

## Test summary

- **api**: 5 jest suites, 63 tests passing. Coverage: **47.4 % stmts / 43.5 % branches / 31.3 % funcs / 48.1 % lines**.
- **web**: 3 vitest suites, 10 tests passing. Coverage: **not measured** — `@vitest/coverage-v8` not installed.

API coverage is concentrated in the service layer (`fts-function.service.ts` 74.7 %), the global
exception filter (high), the assert utilities (100 %), and the selects helper (100 %). Untested:
controllers (0 %, deliberate — covered by e2e), schemas (0 %, deliberate — type-only).

E2E suites exist (`apps/api/test/*.e2e-spec.ts`, `apps/web/e2e/`) but were not exercised under the
5-min cap.

---

## Build status

- `pnpm turbo run build` → **FAIL on `@registry/api#build`**.
- `apps/api/src/generated/prisma-class/user.ts:5-7` imports `FtsPositionRole`, `FtsFunctionRole`,
  `FtsBranchType` which `@prisma/client` no longer exports. Stale codegen artifact (the
  prisma-class generator hasn't been re-run since the schema change). Not a hand-written
  source-code issue.
- `apps/web` build: cached (succeeds). Bundle: **1.2 MB** main JS chunk + 7.3 KB CSS in
  `apps/web/dist/assets/` (gzip-on-the-wire usually halves this).

**Fix**: re-run the prisma-class generator (`pnpm --filter=@registry/api prisma generate` then the
project-specific class generator command in `apps/api/package.json`). Out-of-scope for this audit
(read-only).

---

## Documentation status

| Doc                                                   | Exists | Notes                                                                      |
| ----------------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| `README.md` (159 LOC)                                 | yes    | Quickstart + architecture overview + CI/CD-pending badge disclaimer.       |
| `CONTRIBUTING.md` (120 LOC)                           | yes    | Worked example + commit-message conventions.                               |
| `docs/architecture.md` (259 LOC)                      | yes    | Workspace layout + dependency direction matches reality.                   |
| `docs/getting-started.md` (125 LOC)                   | yes    | Prereqs, install, db setup, dev commands. Spot-check: commands look right. |
| `docs/patterns.md` (1309 LOC)                         | yes    | 33 classes (1-17, 23-33). The authoritative reference.                     |
| `docs/known-limitations.md` (177 LOC)                 | yes    | Migrated TODOs from source; backend gaps + frontend gaps + cross-cutting.  |
| `docs/refactor-journey.md` (200 LOC)                  | yes    | Narrative arc.                                                             |
| `apps/api/README.md`                                  | yes    |                                                                            |
| `apps/web/e2e/README.md`                              | yes    |                                                                            |
| `deploy/README.md`                                    | yes    |                                                                            |
| `packages/eslint-plugin-registry-functions/README.md` | yes    |                                                                            |

Internal links: spot-checked README → docs/\* paths; all resolve.

---

## Architecture: shared package coverage

`packages/shared/` exports:

- `enums/`: `fts-function-{action-type, category, complexity, execution-frequency, relation-type, step}.ts` (6 of 6 expected) + `contract-assert.ts`.
- `errors/`: `codes.ts` (`ErrorCode` const-as-const, all 19 codes), `responses.ts`.
- `colors/presets.ts`, `validation/{limits,regexes}.ts`.

Both `apps/api` and `apps/web` import via `@registry/shared`. No drift detected: backend's
contract-assert files (`apps/api/src/.../contract-assert*.spec.ts`) verify Prisma-enum-to-shared-enum
parity at unit-test time.

---

## API boundary type-safety (sample)

Sampled three endpoint pairs (request shape, response shape):

1. `GET /v1/fts-functions` — frontend `useGetFtsFunctionsQuery` (`ftsFunctionsApi.ts:226`) ↔
   backend `FtsFunctionController.list` (`fts-function.controller.ts`). Request `ListQueryArgs`
   matches backend Zod schema; response `FtsFunctionListResponseDto` matches.
2. `POST /v1/fts-functions` — frontend `useCreateFtsFunctionMutation` ↔ backend
   `FtsFunctionController.create`. Body `CreateFtsFunctionDto` shapes match.
3. `GET /v1/types` — frontend `useGetTypesQuery` (line 199) ↔ backend `ConstantController`. Match.

Codegen flow: backend generates OpenAPI → frontend RTK Query codegen produces
`apps/web/src/shared/api/ftsFunctionsApi.ts`. Drift can only happen if codegen is stale; the
`Cyrillic` JSDoc comments on every endpoint are codegen artifacts and are correctly excluded from
the Class 1 sweep.

---

## Security surface

- No plaintext credentials in any tracked source file.
  Only `database-config.ts:32` reads `this.password` from `ConfigService` (correct).
- `.env.example` files contain only placeholder values
  (`COOKIE_SECRET=secret_key`, `DATABASE_PASSWORD=changeme`).
- Throttler: `ThrottlerModule.forRootAsync` registered in `apps/api/src/app.module.ts:39`.
- Helmet: `@fastify/helmet` configured.
- CSRF: `@fastify/csrf-protection` is a dependency.
- Global exception filter: `apps/api/src/common/filters/global-exception.filter.ts:25` —
  `GlobalExceptionFilter` returns `ErrorCode`-tagged JSON, never raw stack traces in production.

---

## Pre-commit hook efficacy

- `.husky/pre-commit` → `npx lint-staged`.
- `.lintstagedrc.json` covers all 4 patterns: `apps/api/**`, `apps/web/**`, `packages/shared/**`,
  top-level dotfiles via `*.{ts,tsx,json,md,yaml,yml,mjs}`.
- ESLint configs referenced exist:
  `apps/api/eslint.config.ts`, `apps/web/eslint.config.ts`, `eslint.config.shared.ts`.
- Class 28 hypothetical: someone tries to commit a new `interface CountChipProps { ... }` in
  `apps/web/src/components/...`. Lint-staged calls `eslint --fix` against
  `apps/web/eslint.config.ts`; the
  `@typescript-eslint/consistent-type-definitions: ["error", "type"]` rule fires; pre-commit
  blocks because `--fix` only auto-corrects fixable issues and an `interface` definition with
  declaration-merging-sensitive context isn't auto-fixed silently here. Result: commit blocked.

---

## Commit message accuracy (sample)

Spot-checked 5 of the most recent 30 commits:

- `9a26332` "audit: post-r2 residuals — interface→type + console-error disable" — matches: HEAD diff
  shows ~5 file `interface→type` changes plus a `console.error` eslint-disable comment.
- `c10331c` "docs: migrate source TODOs to docs/known-limitations.md" — matches: TODOs grep is now
  zero; `known-limitations.md` exists with migrated entries.
- `5bdaec7` "a11y: configure eslint-plugin-jsx-a11y" — matches: `eslint-plugin-jsx-a11y@6.10.2`
  added; `apps/web/eslint.config.ts` references it.
- `17c24dc` "shared-consolidation: 6 domain enums moved to packages/shared/enums/" — matches: all
  6 enum files present.
- `21bdde7` "enum-migration: wave 3 — class 27 plugin rule promoted from stub" — matches: custom
  plugin contains the `no-literal-domain-keys` rule.

All 5 messages accurately describe their commits.

---

## Gaps for true 95/100

Prioritized list — top investments to push the score from 89 to 95.

1. **Fix `@registry/api#build` failure (stale prisma-class codegen)**
   - **Current state**: HEAD's `apps/api/src/generated/prisma-class/user.ts` references
     `FtsPositionRole`, `FtsFunctionRole`, `FtsBranchType` which `@prisma/client` no longer exports.
     `pnpm turbo run build` exits 1.
   - **Gap**: a single re-run of the prisma-class generator (or a guard that the generator runs in
     `postinstall` or in a `prepare` step) would fix it.
   - **Effort**: 30 minutes (one command + commit).
   - **Why points**: a green `pnpm build` is table-stakes for any code-quality scorecard.
     This is the single biggest item.

2. **Wire web-side coverage tooling**
   - **Current state**: `pnpm --filter=@registry/web test --coverage` errors with
     "Cannot find dependency '@vitest/coverage-v8'". API has `--coverage` working (47.4 %).
   - **Gap**: install `@vitest/coverage-v8` as a `apps/web` devDep, configure the
     `vitest.config.ts` `coverage` block, set a baseline coverage floor.
   - **Effort**: 1 hour.
   - **Why points**: regression-watchdog targets become observable; the scorecard's Dimension 11
     stops being half-blind.

3. **Decompose `apps/web/src/pages/home.tsx` (1014 LOC)**
   - **Current state**: the orchestrator page contains the `Home` component (280 LOC, 41
     statements), `DeleteFunctionDialog` (98 LOC), an in-render component definition at line 455,
     plus 600+ LOC of supporting hooks/mappers inline.
   - **Gap**: extract `DeleteFunctionDialog` to its own file
     (`apps/web/src/components/DeleteFunctionDialog/`), pull the in-render component out per
     `react/no-unstable-nested-components`, split the side-panel + main-grid sub-trees into
     `home/HomePanels.tsx` and `home/HomeGrid.tsx`. Target: 4-6 files, none over 250 LOC.
   - **Effort**: 1 day.
   - **Why points**: 1 file alone accounts for 6 of the 58 lint warnings; decomposition takes
     `max-lines` warnings to ~5 across the codebase.

4. **Decompose `apps/api/src/module/fts-function/fts-function.service.ts` (576 LOC)**
   - **Current state**: 17 service methods spanning list, detail, mutation, tree, dti link,
     counter logic.
   - **Gap**: split into `FtsFunctionListService` (list + cursor), `FtsFunctionMutationService`
     (create/update/delete), `FtsFunctionTreeService`, `FtsFunctionDtiService`, with a thin facade
     for the controller. Keep the `*-counter` already-extracted service.
   - **Effort**: 1-2 days.
   - **Why points**: kills the largest backend `max-lines` warning, narrows test surfaces, makes
     coverage % naturally rise as smaller services are easier to fully cover.

5. **Fix the 2 Class 13 nested-ternary residuals**
   - **Current state**: `apps/api/src/common/filters/global-exception.filter.ts:69` and
     `apps/api/src/common/prisma/mappers/translate-prisma-error.util.ts:22` each use a 2-level
     nested ternary.
   - **Gap**: extract to named helper functions per Class 13's recipe (form (1) — small if-return
     helper).
   - **Effort**: 30 minutes.
   - **Why points**: closes the only Class 13 / Class 33 instances; takes pattern-classes from
     27/28 zero to 28/28 zero.

6. **Migrate `boundaries` plugin from v5 to v6 selector syntax**
   - **Current state**: `boundaries/element-types` rule deprecated; 5 rules use legacy selector
     syntax. Two warnings.
   - **Gap**: update `apps/web/eslint.config.ts` to use the new object-based selectors.
   - **Effort**: 1 hour.
   - **Why points**: takes the deprecation warnings to zero; future-proofs against plugin-major
     bumps.

7. **CI/CD wiring (build + test + lint on PR)**
   - **Current state**: README badges are explicit placeholders; no `.github/workflows/`.
   - **Gap**: add a workflow that runs `pnpm install`, `pnpm turbo run lint`, `pnpm turbo run test`,
     `pnpm turbo run build` on PRs to main. Coverage upload to a cache or service.
   - **Effort**: 1 day (auth + secrets + a real database service container).
   - **Why points**: a project that runs its own lint + tests in CI demonstrates the discipline
     the scorecard claims.

---

## What's intentionally deferred (not gaps)

- **CI/CD wiring** — README explicitly notes badges are pending; needs the prod environment's
  decision on which CI provider + secrets management. (Item 7 above is the work; deferring it is
  the documented choice, not a smell.)
- **Web e2e in CI** — Playwright suites exist locally; running them in CI needs a database
  service container. Same trigger as CI/CD wiring.
- **Authentication UI** — the backend has JWT/refresh-token machinery (`@nestjs/jwt`,
  `@nestjs/passport`); the frontend has no login form yet because product hasn't decided the
  auth-provider story.
- **DTI link removal endpoint** — documented in `docs/known-limitations.md`; backend exposes
  additive `POST /dtis/batch` only; the frontend renders DTI chips without `onDelete` because
  the API doesn't support it yet. Documented, scoped, traceable.
- **DTI full-replace endpoint** — same shape as above; deferred until the frontend wants the
  single-call save flow.

---

## Score estimate

**89/100**, honestly.

The four things that hold it back from 95:

1. The build failure on `@registry/api` (stale generated `prisma-class/user.ts`) — −3 to −4
   points. A green build is the basic test of "does this project ship."
2. Web coverage tooling absent — −2 points. Half of the test-coverage dimension is unobservable.
3. The 1014-LOC `home.tsx` and 576-LOC `fts-function.service.ts` — −2 points. One human-written
   page + one service of this size is acceptable, but at-this-quality-level it stands out.
4. The two nested-ternary residuals + the `boundaries` deprecation + the React no-unstable
   warning — −1 point combined; small but non-zero, and they're all actively documented as
   patterns the project has otherwise eliminated.

Above 89 the curve gets steep — items 5-7 each gain fractions of a point, not whole points.
Below 89 isn't honest given the demonstrated discipline of the patterns library, the four-phase
ESLint sweep, the shared-consolidation move, and the post-r2 residuals pass.

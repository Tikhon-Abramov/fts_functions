# Audit 05 — Test Coverage (strict)

> Volume is fine, specification value is low. Core bugs the user listed all live in code that is "covered" by tests that lock in the buggy behaviour. **No API HTTP integration layer (no supertest)**, **no FE↔BE contract tests**, orchestration hooks (`useDetailActions`) are entirely untested. Playwright e2e exists but four important tests `test.skip` against a fresh DB.

## Suite snapshot

- **88 spec files** total: 8 API jest unit + e2e, 71 web vitest, 9 Playwright e2e.
- **API**: jest + supertest **not wired** — every "controller" test is a method call on a Nest controller instance with mocked services. Pipes/guards/filters never exercised.
- **Web**: vitest unit/integration, Playwright e2e present but degraded.
- **No coverage thresholds enforced in CI** (vitest has them in config; CI doesn't run `--coverage`. API jest has none at all).

## Verdicts per category

- **GOOD** — specifies a real behavior; would catch a regression.
- **MIRROR** — locks in current implementation, not desired behavior. (The resolver test that asserted `dto === null` for empty complexity _was_ this — flipping it caught a real bug.)
- **TRIVIAL** — tests setup/getter/passthrough. Zero-value.
- **MISSING-EDGE** — would have caught a known recent bug but doesn't.
- **FLAKY/SKIPPED** — `.skip`, `.todo`, or env-dependent.

---

## CRITICAL — must add or rewrite

### 1. `apps/api/src/module/fts-function/fts-function.service.spec.ts`

- **MISSING**: `collectTypeChecks` (service.ts:604) has zero tests covering the `null` case. The `id != null` regression fix at service.ts:615 has **no guard**.
  - Add: `validateFtsFunctionDetailWrite skips null FK fields but validates undefined as no-op` — pass `{ftsFunctionComplexityId: null, ftsFunctionExecutionFrequencyId: undefined, …}` and assert `assertTypesCategories` is called with exactly the three non-null entries. Catches the `!== undefined` → `!= null` regression.
  - Add: `updateDetail with cleared optional FK (null) succeeds` — current spec.ts:535 only "asserts only changed fields" with valid ids; never tests a `null` clear.
- **MIRROR**: spec.ts:380 `softDelete already-deleted throws` — title literally restates the impl comment. Rewrite to a behavioural decision (`softDelete is non-idempotent: a second delete throws NotFound`).

### 2. `apps/web/src/entities/fts-function/api/detail-resolvers.test.ts`

- **MIRROR**: test.ts:95 ("returns null when the user picked a complexity but the dictionary lookup fails"). Asserts `dto === null`; the runtime swallows that null silently in `useDetailActions.ts:105-110` showing "dicts loading". The exact pattern the user described — flipping the assertion forces the question of whether the resolver should throw or the caller fail loudly.
  - Rewrite as **`when the user picked a value not in the dict, the caller is told why so the user sees a non-generic error`** — drive through `useDetailActions.addRow`, assert snackbar message is _not_ the generic "dicts loading" copy.
- **MISSING-EDGE**: no test for `who: undefined` vs `who: ""` vs `who: "   "` (resolver lines 76-86 has three branches; only the trim+match path is covered indirectly).
- **MISSING-EDGE**: no test for `actionLabel: undefined` (only `""` at line 53).

### 3. `apps/web/src/components/RowDetailsPanel/hooks/useRowDetailsDraft.test.ts`

- **MIRROR**: test.ts:28 (`startEdit seeds the draft from the row, including default periodicity / complexity`). Test name says "default periodicity" out loud — it specifies the bug. The `|| DEFAULT_PERIODICITY` at hook.ts:16-17 silently rewrites a row whose `periodicity` was deliberately empty into `"DAILY"`, persisting it on next save.
  - Rewrite as **`startEdit preserves an empty periodicity instead of injecting a default`** — assert `draft.periodicity === ""`. **Fails the current implementation, which is desired.**
  - Same for complexity.
- **MISSING**: no integration test combining this hook with `useDetailActions.updateRow`.

### 4. `apps/web/src/entities/fts-function/hooks/detail-modal/useDetailActions.ts` — **NO TEST FILE**

- 285 lines of orchestration with zero unit coverage.
- Add: `addRow returns the id of the newly-created detail` — render hook with mocked `createDetail` returning `{id: 99}`, await `addRow`, expect `"99"`.
- Add: `addRow surfaces a non-generic error when resolveDetailDto returns null because of a dict miss vs because dicts are still loading`.
- Add: `updateRow with a partial that does not change FK fields skips the type assertion roundtrip`.

### 5. **Contract drift: `MIDDLE` (FE) vs `MIDDLE_COMPLEXITY` (DB seed)**

- `packages/shared/enums/fts-function-complexity.ts:11` exports `MIDDLE: 'MIDDLE'`.
- `apps/api/db/seeds/constants/index.ts:56` (data-guy) inserts `code: 'MIDDLE_COMPLEXITY'`.
- No test reads the seed and cross-checks against the shared enum. **This is the kind of bug that survives 500 unit tests** — and did, until manually patched.
- Add `apps/api/db/seeds/constants/__tests__/seed-codes-match-shared-enums.spec.ts`: import `TYPE_CONSTANTS`, group by category, for each category that has a corresponding shared enum, assert `set(seedCodesForCategory) === set(Object.values(SharedEnum))`. **Would fail today.**

---

## HIGH

### 6. `buildFunctionDto.test.ts:36` — MIRROR

`coerces a non-numeric id string to NaN (zod validates upstream)`. Test name openly admits it's locking in a footgun. Either delete or rewrite as `buildFunctionDto throws / returns Result.err for a non-numeric id`.

### 7. `auth.controller.spec.ts:47-143` — TRIVIAL/MIRROR

Every test is "controller forwards args to service". Eight tests with zero behavioural specification. Replace with one supertest-driven happy path per route; protects against typos only otherwise.

### 8. `RowDetailsPanel.test.tsx` — only 3 tests, none exercise edit→save

The single most bug-prone surface is rendered here without a save assertion.

- Add: edit a row whose `periodicity` is empty, click Save, assert dispatched payload's periodicity is empty (not `"DAILY"`).

### 9. **No API HTTP integration tests**

Zero `supertest` imports under `apps/api`. DTO validation pipe, JWT guard, role guard, global exception filter are wired in `main.ts`/module providers but never exercised end-to-end.
Add at minimum: `POST /fts-function/:id/detail` with a `null` complexityId (regression for §1), with a missing required field (validation pipe), and as anonymous (JWT guard).

---

## MEDIUM

### 10. `function-form-schema.test.ts:55` — MIRROR

`EMPTY_FUNCTION_FORM is rejected by the schema (every id is empty)` — asserts the schema says no to the constant the same module exports. Pure tautology. Delete or replace with "form with whitespace-only id is rejected".

### 11. `mappers.test.ts:82` — TRIVIAL

`survives undefined inputs` tests a defensive `?? []`. Keep but rename to a behavior (`buildConstantsLookup returns empty index when types haven't loaded`).

### 12. `extra-fields.test.ts:27` — TRIVIAL

Asserts a config array has a config for every key — type system already enforces. Delete.

### 13. Skipped Playwright tests

`add-item.spec.ts:25`, `function-crud.spec.ts:146`, `right-panel-tabs.spec.ts:22, 39`, `home.spec.ts:23` all gate on `total === 0` / `total < 15`. On a fresh CI DB these pass without running. **Replace `test.skip` with a `beforeAll` seed step** (or fail loudly).

### 14. `useCursorPagedList.test.ts:145` — coupled to magic number `0.5`

Rewrite as `loadMore fires when user is within prefetch distance of the bottom`, parameterised by the threshold.

---

## Positive observations

- `apps/api/src/module/fts-function/internal/assert-user-role.spec.ts:47-185` is the **gold standard** in this repo — branch-per-slot, asserts both passing and three distinct failure modes per slot.
- `apps/api/src/module/auth/internal/token-blacklist.service.spec.ts` and `audit-rotation.service.spec.ts` test real time-based behaviour rather than method calls.
- `apps/web/src/components/AddItemForm/AddItemForm.test.tsx:108-170` ("REGRESSION: silent no-op") is named after the bug it prevents — **use this naming everywhere**.

---

## Three-rule strict test-quality bar (enforce going forward)

1. **A test name is a behaviour statement, not a code restatement.** Disallow names that contain "returns null", "calls X", "is true when". Require subject + observable outcome.
2. **Every assertion must be one the product owner could read and approve.** If flipping the assertion would make the product _better_ (the resolver-returns-null case), the test is a MIRROR — fix the code or the test.
3. **No mock-only contract tests at module boundaries.** Anything crossing FE↔API or service↔Prisma needs at least one supertest / MSW / seeded-fixture round-trip. Pure-mock tests are only allowed for pure functions.

## E2E status

Playwright present (`apps/web/playwright.config.ts`, 9 specs under `apps/web/e2e/`). API has **no** end-to-end harness — no supertest, no Pact, no Dredd. Vitest is unit/integration only. Playwright suite undermined by the four `test.skip` guards above.

## Files to delete or rewrite

- `apps/web/src/entities/fts-function/lib/buildFunctionDto.test.ts:36-39` (NaN-mirror)
- `apps/web/src/entities/fts-function/lib/function-form-schema.test.ts:55-58` (tautology)
- `apps/web/src/components/RowDetailsPanel/lib/extra-fields.test.ts:27-37` (type-system duplicate)
- `apps/api/src/module/auth/auth.controller.spec.ts:47-143` — collapse 8 passthrough tests into 2-3 supertest integration tests.

## New tests to add (priority order)

1. **CRITICAL** — `fts-function.service.spec.ts` null-vs-undefined collectTypeChecks (§1)
2. **CRITICAL** — Seed↔shared-enum contract test (§5)
3. **CRITICAL** — `useDetailActions.test.tsx` (§4)
4. **CRITICAL** — Rewrite `useRowDetailsDraft.test.ts:28` to assert empty preserved (§3)
5. **HIGH** — API supertest integration suite (§9)
6. **HIGH** — `RowDetailsPanel.test.tsx` edit→save preserves empty periodicity (§8)
7. **MEDIUM** — Replace Playwright `test.skip(total===0)` with seeded fixtures (§13)

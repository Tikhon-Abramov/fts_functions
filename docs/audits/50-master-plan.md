# Audit 50 — Master Plan (sequenced refactor priorities)

> Pre-ship code-quality wave for the FTS-no-auth simplified branch. **No new features.** Bar: code is obvious to a junior engineer with limited skills. Security findings reframed — internal-only deploy with maintenance panel is by design.

## Wave 0 — already done in this session

✅ Resolver null-conflation fix + DB type-code rename (`MIDDLE_COMPLEXITY` → `MIDDLE` etc.) — Сведения edit unblocked
✅ Backend `collectTypeChecks` `null` vs `undefined` fix
✅ Killed Vite-dev ghost on FTS port 8787
✅ `who` field migrated from i18n to DB-driven autocomplete
✅ Function-name picker filters out alive duplicates
✅ Magic strings `"WHO_PERFORMS_ACTION"` → `Category.WHO_PERFORMS_ACTION` (3 sites)

## Wave 1 — pre-ship cleanup (clarity-only, no feature change)

### Priority 1 — DROP PAGINATION (single biggest clarity win)

- Backend: simplify `list()` to one `findMany`, delete `buildCursorPredicate` (~36 lines + raw SQL), delete `buildSearchFilter` (raw fulltext SQL).
- Backend schema: remove `nextCursor`, simplify `FtsFunctionListQueryDto`.
- Frontend: delete `useCursorPagedList` hook + test.
- Frontend: rewire `home.tsx` to plain `useFtsFunctionControllerListV1Query()`; DataGrid does client-side filter/sort/search.
- **Side effect: "column numbers bound to pagination in some buried way" mystery resolves itself.**
- **Side effect: vector/MATCH search disappears — replaced by FE `Array.filter`.**

### Priority 2 — Delete dead modules (FTS-no-auth branch)

- `apps/api/src/module/auth/*` — passport, JWT, refresh tokens, login/register controllers
- `apps/api/src/module/profile/*` — avatar upload via MinIO
- `apps/api/src/module/email/*` — Resend stub
- `apps/api/src/module/storage/minio.service.ts` — only used by Profile
- `apps/api/src/common/audit/*` — confirm with user if also deleting (it does log changes from `constant.service.ts` admin endpoints; if admin panel needs audit trail, keep)
- `passport`, `passport-jwt`, `passport-local` deps in `package.json`
- `// FTS-NO-AUTH BRANCH:` comments throughout (`app.module.ts`, `main.ts`, `constant.controller.ts`)
- Dead `@Roles(UserRole.ADMIN)` decorators on `constant.controller.ts` (the guard was removed; the decorators do nothing now)
- Stale stripped `JwtAuthGuard` / `ProfileModule` imports suppressed with `// eslint-disable-next-line` in `app.module.ts`

### Priority 3 — Roll out 5 remaining `*_LABEL` i18n maps to DB-driven (same pattern as `who`)

| Field       | Current             | After                                                                 |
| ----------- | ------------------- | --------------------------------------------------------------------- |
| Category    | `CATEGORY_I18N` map | `typesAll.filter(t => t.category === Category.FTS_FUNCTION_CATEGORY)` |
| Action      | `ACTION_I18N`       | `… === Category.FTS_FUNCTION_ACTION_TYPE`                             |
| Periodicity | `PERIODICITY_I18N`  | `… === Category.FTS_FUNCTION_EXECUTION_FREQUENCY`                     |
| Complexity  | `COMPLEXITY_I18N`   | `… === Category.FTS_FUNCTION_COMPLEXITY`                              |
| Link kind   | `KIND_I18N`         | `… === Category.FTS_FUNCTION_RELATION_TYPE`                           |

For each: same 3-step pattern as `who` (filter → map to options → store FK id). Delete the `*_LABEL` map and corresponding i18n entries when done.

### Priority 4 — Architectural top-5 fixes (from `03-architecture-map.md`)

1. **`addRow` returns `Promise<string>`** instead of `""` — fixes broken QuickLink contract.
2. **Extract `<DetailRightPanelContent tab={...} />`** out of `DetailizationModal.tsx` (god-component).
3. **`RowDetailsView` iterates `PRIMARY_FIELDS`** instead of having a hardcoded layout duplicate.
4. **`LinkPicker` accepts `typesAll` as prop** instead of issuing its own query.
5. **Replace `useRightTabConfig` render closures** with data props — let `DetailRightPanel` switch internally.

### Priority 5 — Backend cringe fixes (from `02-backend-smells.md`)

- Delete `DuplicateNameError` alias (`fts-function.service.ts:628`)
- Delete `assert-type-category.ts` (single-item wrapper)
- Standardise on `@prisma-client` alias (kill bare `@prisma/client` import in `constant.service.ts:22`)
- Decompose `USER_RESPONSE_SELECT` into composable fragments (`USER_IDENTITY_SELECT` + `USER_DESCRIPTION_SELECT` + `USER_FTS_ROLE_SELECT`); move to `constant/internal/constant.selects.ts`
- Move `BCRYPT_ROUNDS` from `constant.service.ts` to `@common/auth/crypto.ts` (or delete entirely if no auth)
- Extract inline mapped types `{ [K in keyof TypeQueryDto]?: keyof Prisma.TypeWhereInput }` → named `TypeQueryFieldMap` etc.
- Fix banner-comment style: replace `// ── X ──` long banners with single-line section headers OR delete

### Priority 6 — Frontend cringe fixes (from `01-frontend-smells.md`)

- Fix misleading `buildDraft` defaults (`|| 'DAILY'` / `|| 'MIDDLE'`) — preserve user-empty values
- Fix `runMutation` swallow — surface error snackbars on failure
- Delete `EXTRA_FIELD_KEYS` dead constant
- Delete cryptic "Class 26" comments — replace with one-line WHY
- Delete dead `currentCount` prop on `StepTabBody`
- Consolidate `actionLabel` union into one named type
- Hoist `slots` and `getRowClassName` in `home.tsx` to module-level constants

### Priority 7 — Type rigor (from `06-type-rigor.md`)

- Remove `noImplicitAny: false` from `apps/api/tsconfig.json`
- Make `apps/api/tsconfig.json` extend `tsconfig.base.json`
- Add `noImplicitReturns: true` and `noFallthroughCasesInSwitch: true` to base tsconfig
- Eliminate `as unknown as Record<string, ...>` casts in `fts-function.service.ts` (4 places)
- Introduce branded ID types for entity IDs (`FtsFunctionId`, `FtsFunctionDetailId`, `TypeId`, `UserId`)

### Priority 8 — CI raise-the-bar (from `07-ci-standards.md`)

**Day-1 quick wins (< 1h)**:

- Wire web coverage threshold into CI (`pnpm --filter=@registry/web test:coverage`)
- Add API Jest `coverageThreshold` (set floors at current measured coverage)
- Add `--detectOpenHandles` to API Jest
- Promote `knip` into `build.needs` gate (currently parallel non-blocking)
- Add `prettier --check` to CI
- Remove ghost commands from README

**Week-1**:

- Elevate `react-hooks/exhaustive-deps` to `error`
- Elevate `no-floating-promises` to `error` in API
- Apply `tseslint.configs.recommendedTypeChecked` to web

### Priority 9 — Test rewrites (from `05-test-coverage.md`)

- Rewrite `useRowDetailsDraft.test.ts:28` — assert empty preserved (will fail current impl, fixes the bug)
- Rewrite `detail-resolvers.test.ts:95` — drive through caller, assert non-generic snackbar
- Add `useDetailActions.test.tsx` — currently has 0 tests for 285 lines of orchestration
- Add seed↔shared-enum contract test (would have caught `MIDDLE_COMPLEXITY` drift)
- Add API supertest integration suite (no e2e for HTTP layer currently)

### Priority 10 — Performance wins (from `08-performance.md`)

**Auto-resolved by Wave 1 Priority 1 (drop pagination)**:

- ❌ Missing `@@index([ftsFunctionNameId])` — only relevant to `ensureFtsFunctionNameAvailable` which still needs it. **KEEP this index addition.**
- ✅ `FunctionFormPanel` `limit:1000` query → becomes the single canonical list query, no longer redundant
- ✅ `useStepRowsModel` derived chain — unaffected
- ❌ DataGrid inline `slots` — fix via Priority 6

**Independent wins**:

- Add `@@index([ftsFunctionNameId, isDeleted])` to `FtsFunction`
- Fix `getById()` to filter soft-deleted (`isDeleted: false` in where)
- `lazy(() => import(...))` for unused page components in `App.tsx`
- Remove ~12 unused npm deps (`recharts`, `framer-motion`, `embla-carousel-react`, `vaul`, etc.)

## Wave 2 (post-ship, your version)

- Pagination & column-numbering investigation (auto-resolved by Wave 1 P1)
- Restore auth/profile/email if needed for non-FTS users
- Address performance wins not blocking pre-ship
- E2E API harness with supertest
- Convention enforcement via custom eslint rules

## Terminal phase — Russian translation + bilingual components registry

1. `docs/ru/*.md` — full Russian translation of all standalone docs
2. `docs/COMPONENTS.md` + `docs/ru/КОМПОНЕНТЫ.md` — bilingual twin component registry, table format
3. Translate / prune in-code JSDoc + block comments to Russian (using audit findings to delete restate-the-obvious comments at the same time)

## Sequencing recommendation

Do priorities **1 → 2 → 3** first (highest ratio of LOC-deleted to risk), then 4 → 5 → 6 in parallel as small PRs, then 7 → 8 → 9 → 10. Terminal phase after wave 1 stabilises.

**Pre-ship critical path** (must ship before deploy): 1, 2, 3, plus the 7-line `addRow returns Promise<string>` fix from priority 4.

## What NOT to do pre-ship

- Don't restore `RolesGuard` (intentional: maintenance panel, no auth on internal FTS)
- Don't switch from cursor to offset pagination — DELETE pagination entirely instead
- Don't add e2e tests now — wave 2
- Don't translate yet — terminal phase only
- Don't rewrite the existing rubber-stamp tests — only update those that block a specific fix

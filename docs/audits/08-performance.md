# Audit 08 — Performance

> Two halves: backend Prisma/SQL, frontend bundle/render.

## Backend — Prisma & SQL

### 1. N+1 queries

No `Promise.all(map(...))` over individual Prisma calls in service code. The previous anti-pattern was explicitly replaced by `assertTypesCategories` (batched `findMany`) — good.

**Remaining N-parallel pattern**: `validateFtsFunctionWrite` (fts-function.service.ts:559-567) fans out to `assertUserRole` once per user slot — up to 4 separate `findUniqueOrThrow` calls.
**Fix**: batch into one `findMany({ where: { id: { in: userIds } } })` with post-query validation, matching the `assertTypesCategories` pattern.

### 2. Missing `select`

All `findMany`/`findUnique`/`create`/`update` calls reference a named `*Select` constant or pass an explicit `select`. Good baseline.

**Exception**: `constant.service.ts:253`

```ts
await this.prisma.user.update({
  where: { id },
  data: { isDeleted: true, deletedAt: new Date() },
  // ← no select; Prisma returns full row by default
});
```

Return value discarded. Full-row write-back over the wire for nothing. Fix: `select: { id: true }`.

### 3. Missing `@@index`

Cross-referenced all service `where` filters against `schema.prisma`:

| Filter column            | Model               | Index?             |
| ------------------------ | ------------------- | ------------------ |
| `isDeleted`              | `FtsFunction`       | ✅                 |
| `isDeleted`              | `FtsFunctionDetail` | ✅                 |
| `isDeleted`              | `User`              | ✅                 |
| **`ftsFunctionNameId`**  | **`FtsFunction`**   | ❌ **MISSING**     |
| `ftsFunctionMarkerId`    | `FtsFunction`       | ✅                 |
| `competencyCenterId`     | `FtsFunction`       | ✅                 |
| `curatorCentralOfficeId` | `FtsFunction`       | ✅                 |
| `category`               | `Type`              | ✅                 |
| `code` (Type)            | `Type`              | ✅ (via `@unique`) |

**Critical gap — `FtsFunction.ftsFunctionNameId`**: queried in `ensureFtsFunctionNameAvailable` on every create/update. Currently table-scans (or full-index-scan on `isDeleted`) on every name uniqueness check.

**Fix**: `@@index([ftsFunctionNameId, isDeleted])` on `FtsFunction`. Eliminates the scan as the table grows.

### 4. Raw SQL where Prisma suffices

Two `$queryRawUnsafe` usages:

**A. `buildSearchFilter`** — `fts-function.service.ts:443-451`. Justified: fulltext `MATCH ... AGAINST` with `DISTINCT` projection that Prisma's `_relevance` mode doesn't support cleanly.

**B. `buildCursorPredicate`** — `fts-function.service.ts:485-493`. Workaround for a `@prisma/adapter-mariadb` regression where `{ createdAt: { lt: Date } }` inside `OR` returns zero rows. Justified for now, but should carry `// TODO revisit after @prisma/adapter-mariadb#<issue>` link.

### 5. Connection-pool config

`DATABASE_CONNECTION_LIMIT=100` in `.env`. **`PrismaService` does NOT pass this to the MariaDB adapter** — it constructs:

```ts
new PrismaMariaDb({ host, user, password, port, database, connectTimeout: 5000, … })
```

The `connection_limit=100` URL parameter is used by the legacy client; the **driver-adapter path (`PrismaMariaDb`) has its own default pool sizing** (Node `mariadb` driver default is 5).

**Net**: env variable and URL parameter may be silently ignored. Pool may be 5, not 100. For internal FTS use this is fine, but the config gives false assurance.

### 6. Soft-delete consistency

Service comment at fts-function.service.ts:1 explicitly admits inconsistency: _"the planned `prisma.$extends` refactor that would centralise [soft-delete filter] is documented in known-limitations.md"_.

**`getById()`** uses `findUnique({ where: { id } })` **without `isDeleted` filter** — a soft-deleted function is returnable by ID. Detail endpoint and form-panel edit mode (`useFtsFunctionControllerGetByIdV1Query`) can load deleted records.

**Fix**: add `isDeleted: false` to `getById`'s where clause (or throw `FtsFunctionNotFoundException` if `entity.isDeleted` — same pattern as `ensureFtsFunctionAlive`).

### 7. Pagination

- List endpoint: cursor-based, `DEFAULT_LIMIT`/`MAX_LIMIT`, `limit+1` trick. Good.
- `getTypes`/`getUsers` in `constant.service.ts:165` — **unbounded `findMany`**. Currently fine (small dataset, polled every 120s) but if `Type` ever scales above ~10k rows, becomes a bandwidth problem.

---

## Frontend — bundle & render

### 1. Bundle size

`dist/stats.html` exists (visualizer enabled).

Heaviest packages:

- **`@mui/x-data-grid-pro`** — ~400 kB gzipped on its own. The single largest chunk.
- `framer-motion` (~60 kB gz), `recharts` (~130 kB gz), `react-resizable-panels`, full Radix UI set (~20 packages).

**Zombie packages** (installed, not used in FTS branch — Home is the only active route):

- `@radix-ui/react-accordion`, `react-day-picker`, `recharts`, `embla-carousel-react`, `framer-motion`, `next-themes`, `cmdk`, `input-otp`, `vaul`

Vite tree-shakes unused exports, but cannot eliminate packages with side-effects. Each adds to `node_modules` churn and type-check time.

### 2. Lazy / dynamic imports

**ZERO `lazy(() => import(...))` calls in the codebase.** All page components eagerly imported in `App.tsx:14-28`:

```ts
import Home from "src/pages/home";
import Login from "src/pages/login/Login";
// … six more
```

Even though all routes except `/` are commented out in FTS branch, modules still imported and bundled (Vite cannot statically eliminate a dead import with side effects).

**Fix**: wrap each in `lazy()`, `<Suspense>` boundaries.

### 3. MUI tree-shaking

All MUI imports use barrel path (`import { Box } from "@mui/material"`). Under Vite ESM mode, MUI v5+ ships proper ES modules → tree-shaken at build time. Per-package barrel imports are fine for Vite. **Not a problem.**

### 4. Re-render hot spots

**A. `slots` prop in `DataGridPro`** — `home.tsx:626-630`

```tsx
slots={{
  row: (props) => <GridRow {...props} data-testid={`row-fn-${props.rowId}`} />,
}}
```

Inline object literal created every render. MUI X DataGrid compares by reference → unmount/remount every row renderer on each `Home` render. `Home` re-renders on every keystroke in the search input (Redux-driven).
**Fix**: hoist to module-level constant.

**B. `getRowClassName`** — `home.tsx:624` — inline arrow per render. Hoist.

**C. `collisionQuery` per-keystroke** — `useFunctionForm.ts:109-118`. Field is a `<Select>`, not text → fires only on selection. Acceptable.

**D. `buildTheme` `useMemo`** — `App.tsx:423`. Correct (dep is `mode` which changes only on toggle click). No issue.

### 5. `useStepRowsModel` derived-memo chain

Has 8 `useMemo`s. Chain: `functionRecord` → `rows` → `rowMap` → `stepBuckets` → indexes/categories/counts. Dependencies stable; chain is fine.

**However**: `colorByCode` depends on `typesAll`, and `typesAll` is also fetched separately in `DetailizationModal.tsx:67-69` AND in `Home` AND in `FunctionFormPanel`. RTK Query deduplicates the network request but creates **3 active cache subscriptions** to the dictionary. Each triggers re-render on the 120s poll.

### 6. DataGrid configuration

- `getRowId={(row) => row.id}` ✅
- `disableColumnMenu` only on `ACTIONS` column (intentional)
- `getRowHeight={() => "auto"}` + `getEstimatedRowHeight` — auto-height forces post-render measurement. For a small registry this is OK; if rows have bounded text (function names from a known dict), fixed height would be faster.
- Columns memoized via `useMemo` with stable deps ✅

### 7. Network waterfalls

**`FunctionFormPanel`** issues 3 queries in parallel:

1. `useConstantControllerGetTypesV1Query({ categories: [...5] })`
2. `useConstantControllerGetUsersV1Query({})`
3. `useFtsFunctionControllerListV1Query({ limit: 1000 })` ← **fetches full alive list to compute `availableFunctionNames`**

Query 3 is a hidden unbounded fetch on every render of `FunctionFormPanel`, including when collapsed. `DICTIONARY_QUERY_OPTIONS` polling (120s) refetches every 2 min regardless.

The purpose is computing `takenNameIds`. The API has `ensureFtsFunctionNameAvailable` server-side (returns 409). The frontend `collisionQuery` in `useFunctionForm` does the same per-selection.

**The `limit: 1000` list fetch is redundant with both** and fetches full list items (with DTI joins) just to extract `ftsFunctionNameId`.

**Fix options**:

- (a) Add a dedicated lightweight endpoint `/v1/fts-functions/used-name-ids` returning just IDs.
- (b) Backend: include the alive `ftsFunctionNameId` set in the existing types query.
- (c) Accept the cost (it's once per 2 min; not on hot path).

### 8. Polling / refetch

- List: 30s polling, paused when unfocused. Appropriate.
- **Detail: 5s polling inside the modal** — aggressive. If two users unlikely to edit simultaneously, 30s would be safer.
- Dictionary: 120s. Appropriate.
- `refetchOnFocus: true` on all three → opening tab triggers 3 concurrent refetches. With the `limit: 1000` query also subscribed, that's 3+ concurrent refetches even if panel is collapsed.

---

## Top 10 perf wins (impact × low_risk)

| Rank | File:line                         | Current cost                                                                        | Change                                                             | Expected delta                                     |
| ---- | --------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| 1    | `schema.prisma:383-392`           | Table scan on every create/update (missing `ftsFunctionNameId` index)               | Add `@@index([ftsFunctionNameId, isDeleted])`                      | Eliminates O(n) scan on uniqueness check           |
| 2    | `FunctionFormPanel.tsx:84-87`     | `limit:1000` list fetch with DTI join, polled every 2min, even when panel collapsed | Replace with dedicated lightweight endpoint or accept-and-document | Eliminates one full-list round-trip per poll cycle |
| 3    | `fts-function.service.ts:143-149` | `getById` returns soft-deleted                                                      | Add `isDeleted: false` check                                       | Prevents stale-data leakage                        |
| 4    | `home.tsx:626-630`                | Inline `slots` object — DataGrid remounts every row on every `Home` render          | Hoist to stable module constant                                    | No more row remounts on search keystrokes          |
| 5    | `home.tsx:624`                    | Inline `getRowClassName` arrow                                                      | Hoist                                                              | Minor — removes per-render allocation              |
| 6    | `fts-function.service.ts:559-567` | Up to 4 `assertUserRole` round-trips parallelised                                   | Batch into one `findMany({ id: { in: userIds } })`                 | Write-path DB round-trips drop from 4+1 to 2       |
| 7    | `constant.service.ts:253`         | `user.update()` returns full row then discarded                                     | `select: { id: true }`                                             | Eliminates full-row wire transfer                  |
| 8    | `App.tsx:14-28`                   | All page components eagerly bundled                                                 | `lazy(() => import(...))` + `<Suspense>`                           | Reduces initial parse time for inactive routes     |
| 9    | `polling.ts:7`                    | Detail modal polls at 5s — 6× faster than list                                      | `DETAIL_MS = 30000`                                                | Detail requests drop from 12/min to 2/min          |
| 10   | `package.json:36-85`              | ~12 unused Radix/animation packages installed                                       | Remove unused                                                      | Reduces install size, node_modules resolution time |

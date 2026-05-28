# Audit 90 — Conventions (the bar to enforce)

> Rules adopted as a result of the audit. Each one has a _why_, an _enforcement_ mechanism, and an _example_. Bar: a junior engineer with limited skills should be able to read any file and understand WHAT and WHY without scrolling.

## A. The five non-negotiables

Anything that violates these is a CI block, no exceptions:

1. **No commented-out code or modules.** If a feature is removed, delete the imports, the decorators, the route — not just the guard. _Why_: dead imports get compiled and shipped, and confuse every future reader.
2. **No `as unknown as X` double-casts.** If you need to cast through `unknown`, you have a missing type — fix the type. _Why_: every double-cast is a silenced compiler warning we'll regret.
3. **No magic strings used as domain values.** Use the typed enum (`Category.WHO_PERFORMS_ACTION`, not `"WHO_PERFORMS_ACTION"`). _Why_: drift between enum and DB is the bug class we hit today.
4. **No silent `catch {}`.** Every catch surfaces an error — either to the user (snackbar / 5xx response) or to a metric. _Why_: `runMutation` swallow caused a full session of debugging.
5. **No restating-the-code comments.** Comments are for WHY, WARN, LINK, INVARIANT — never WHAT. _Why_: stale comments are worse than no comments; restate-the-code comments are stale on day one.

## B. Naming & file conventions

- **Files** match the export's name (`FunctionFormPanel.tsx` exports `FunctionFormPanel`).
- **Schemas (Zod)** PascalCase + `Schema` suffix: `FtsFunctionListResponseSchema`. Not `ftsFunctionListResponseSchema`.
- **DTOs** PascalCase + `Dto` suffix.
- **Hooks** start with `use`.
- **Constants** SCREAMING_SNAKE_CASE.
- **Test files** `*.test.ts` for vitest, `*.spec.ts` for jest. Co-located.
- **No default exports** for components/services. Default export = bad rename safety + bad grep. _Exception_: page components used by router lazy-load.

## C. Type system

- `tsconfig.base.json` is the only tsconfig that turns rules ON; child configs may not weaken (no `noImplicitAny: false`).
- `strict: true` everywhere.
- `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables` on everywhere.
- **Branded types for every entity ID.** `FtsFunctionId`, `FtsFunctionDetailId`, `TypeId`, `UserId`, `DtiId`. Defined in `apps/api/src/common/types/branded.ts`. Zod schemas `.transform((n) => n as FtsFunctionId)`.
- **Discriminated unions** over multi-optional shapes:
  - ✅ `{ kind: 'ok'; data: T } | { kind: 'err'; error: E }`
  - ❌ `{ data?: T; error?: E }`
- **Inline mapped/conditional types must be named-and-exported** if used at >1 site. `{ [K in keyof TypeQueryDto]?: keyof Prisma.TypeWhereInput }` → `TypeQueryFieldMap` exported from `constant.types.ts`.
- **`Record<string, unknown>` is not a type — it's a smell.** Make it concrete.

## D. Component design (frontend)

- **Component size**: ≤150 LOC, ≤4 hooks, ≤2 effects. Beyond → split.
- **Props**: ≤7 named props, otherwise group into a domain object.
- **Prop drilling depth**: ≤2 levels. Beyond → composition (`children`) or co-location.
- **No `lazy()`-incompatible side effects in module scope.**
- **No inline object/array literals as props on heavy components** (DataGrid, virtual lists). Hoist to stable refs.
- **Effects only at the edges.** Don't `useEffect` to derive state — `useMemo` or compute at render.
- **Refs are read-only at render time.** Mutating during render = bug.
- **Shared option lists come from DB**, not i18n. The `who` refactor is the canonical example. i18n is for chrome (button labels, page titles, error messages), not data.

## E. Backend (NestJS) design

- **Controllers do HTTP — nothing else.** No business logic, no DB queries, no validation beyond Zod-pipe. Branch on domain rules in services.
- **Services are aggregates.** A service belongs to one entity / one bounded concept. `UserService` does User things, period.
- **Selects are decomposed into composable fragments**, named `<ENTITY>_<FACET>_SELECT`, located in `<module>/internal/<entity>.selects.ts`. Compose via spread for full responses.
- **Soft-delete filtering** lives in a single Prisma extension (`prisma.$extends`). No method-level `where: { isDeleted: false }`. (Pending refactor — track in `docs/known-limitations.md`.)
- **No `$queryRawUnsafe` without justification + `Prisma.sql` template tag.** Comment must link to the upstream issue or domain reason.
- **Always `select`** on `findUnique`/`findMany`. No bare `prisma.user.findMany()` returning whole rows.

## F. Schema (Prisma)

- Every `where`-filtered column has an `@@index` (or compound `@@index([colA, colB])` for combined filter+sort).
- Every soft-delete table has `@@index([isDeleted, createdAt])` if listed/sorted by date.
- Column names match TypeScript field names exactly (no `@map("user_full_name")` for `fullName`).
- FK relation column names tell the truth: if `parentFtsFunctionId` actually references `FtsFunctionDetail.id`, name it `parentDetailId`.
- `onDelete` policies are explicit on every relation.

## G. Comments

Write a comment **only** for:

- **WHY** — business reason, perf trade-off, decision rationale
- **WARN** — footgun, ordering constraint, "if you change this also update X"
- **LINK** — issue/RFC URL
- **INVARIANT** — assumption the type system can't express

**Delete a comment** when:

- It restates the code (`// loop over items`)
- It's stale (`// removed X` for code that was removed long ago, `TODO 2023`)
- It's a multi-paragraph essay over a 3-line function
- It's auto-generated JSDoc with no extra info
- It references an unknowable private design doc (`Class 26`)

Russian / English: pick one per file. The whole codebase target is Russian (terminal phase).

## H. Testing

- **A test name is a behavior statement.** Banned phrases: "returns null", "calls X", "is true when …". Required: subject + observable outcome ("rejects an empty id with a 400", "preserves user-cleared periodicity through save").
- **Every assertion must read like a product-owner statement.** If flipping the assertion would make the product _better_, the test is a MIRROR — fix it or the code.
- **Mock-only contract tests at module boundaries are banned.** FE↔API or service↔Prisma needs a supertest / MSW / seeded-fixture round-trip.
- **No hardcoded seed counts** in e2e tests (`expect(rows.length).toBe(33)` ← banned). Assert relative properties.

## I. Build & CI

- `knip` (dead-code) blocks the `build` job.
- `prettier --check` runs in CI.
- Coverage thresholds are enforced (web: vitest config; API: `coverageThreshold` in jest).
- `--detectOpenHandles` on API Jest (catches connection pool leaks immediately).
- Health-check probes the response body content (`{db: 'connected'}`), not just HTTP 200.
- Every README command exists in `package.json`.

## J. Configuration

- `.env.example` lists every variable read by config classes. CI script enforces.
- Required-field validators are conditional on the modules being enabled (FTS doesn't need JWT secrets).
- Default CORS is `[]`, not `['*']`.

## K. Dependency hygiene

- `@registry/shared` adopts semver. No `0.0.0` on a release branch.
- Every cross-app type contract uses shared schemas (`z.infer<typeof X>` from `@registry/shared`), not duplicated hand-written types.
- Unused packages get `pnpm remove`-d every quarter (`knip` + `depcheck`).
- Single Prisma client alias (`@prisma-client`), never bare `@prisma/client`.

## L. Documentation

- **Every README command must work** (`pnpm install && pnpm dev` → app runs).
- **Onboarding doc** explains every dependency: what it is, what it's for here, why we chose it (Zod for IO validation; RHF for form state; etc.).
- **Components registry** lists every main component with: purpose (1 line), state owned, neighbours.
- **All user-facing docs in Russian** under `docs/ru/`. Components registry is bilingual.

---

## Enforcement matrix

| Rule                             | Enforced via                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------- |
| No commented-out modules         | Custom eslint rule + PR review                                                  |
| No `as unknown as` casts         | `@typescript-eslint/consistent-type-assertions: error`                          |
| No magic strings (domain values) | Code review + custom rule for `Category.*`                                      |
| No silent `catch {}`             | Custom rule looking for empty catch blocks                                      |
| Comment quality                  | PR review (no automated check possible)                                         |
| File naming                      | `eslint-plugin-unicorn/filename-case` + custom                                  |
| `tsconfig` strictness            | CI script verifies child configs don't weaken base                              |
| Branded IDs                      | Convention + `@registry/eslint-plugin/domain-id-registry-keys` (already exists) |
| Test name format                 | Custom rule: ban regex on test name strings                                     |
| `knip` blocks build              | Move into `build.needs` array in CI workflow                                    |
| Coverage thresholds              | Already in vitest config; CI must run with `--coverage`                         |
| Health probe content             | Deploy script `curl -f .../health \| jq '.db == "connected"'`                   |
| README commands                  | `scripts/check-readme-commands.ts` in CI                                        |

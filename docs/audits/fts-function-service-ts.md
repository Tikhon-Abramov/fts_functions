# Audit — `backend/src/module/fts-function/fts-function.service.ts`

Read-only senior full-stack review.

---

## 1. Summary

- **Rating**: B. Solid working service; several cross-cutting concerns are inlined that deserve extraction.
- **LOC now / target**: 621 / ~350 after extractions.
- **3 biggest issues**:
  1. `list()` (L105–251, 147 lines) does filter-building, FTS raw SQL, cursor decoding, cursor raw-SQL fallback, pagination shaping, and counter fan-out in one body.
  2. Cursor encode/decode (L57–92), `stripUndefined` (L65–72), and limit constants are module-local — they belong in shared util, will be copy-pasted the moment a second paginated service appears.
  3. `assertTypeCategory` is N+1 per write: `validateFtsFunctionWrite` fires up to 4 parallel `type.findUniqueOrThrow` calls when one `findMany({ id: { in } })` would suffice.
- **Responsibilities** in the file:
  1. `FtsFunction` list (filters + FTS + cursor + counts).
  2. `FtsFunction` CRUD.
  3. `FtsFunctionDetail` CRUD.
  4. Tree-edge create/delete.
  5. DTI attach / batch-attach / detach.
  6. Category + user-role write validation.
  7. Cursor encoding/decoding.
  8. Counter fan-out.

Responsibilities 7 and 8 shouldn't be here; 5–6 are justifiable internals.

---

## 2. Patterns 1–17 — presence in this file

| #   | Class                            | Status                                                                          | Lines                  |
| --- | -------------------------------- | ------------------------------------------------------------------------------- | ---------------------- |
| 1   | Hardcoded RU strings             | n/a (backend)                                                                   | —                      |
| 2   | String unions vs const enums     | Clean — uses `Category`                                                         | —                      |
| 3   | Repeated `sx`                    | n/a                                                                             | —                      |
| 4   | Manual form validation           | n/a                                                                             | —                      |
| 5   | Hook dep arrays                  | n/a                                                                             | —                      |
| 6   | Huge multi-responsibility module | **Present**: 621 LOC; `list()` 147                                              | L105–251               |
| 7   | Magic numbers                    | Mild: `DEFAULT_LIMIT=50`, `MAX_LIMIT=200` local                                 | L54–55                 |
| 8   | Unused deps                      | n/a                                                                             | —                      |
| 9   | Dictionary FKs as strings        | Clean                                                                           | —                      |
| 10  | `--no-verify`                    | n/a                                                                             | —                      |
| 11  | Parameterless util proliferation | Mild: `ensureFtsFunctionAlive` + `ensureDetailAlive` collapse to one helper     | L508–522               |
| 12  | Direct env access                | n/a                                                                             | —                      |
| 13  | Nested ternaries                 | **Present** — 3-level pick of `tsValue`                                         | L170–177, L219         |
| 14  | Hardcoded enum literals          | Clean                                                                           | —                      |
| 15  | Repeated filter+map (same dict)  | Spirit-match: 4 serial-ish `assertTypeCategory` on one table                    | L524–576               |
| 16  | Repeated option literals         | Mild: `select: { id: true, isDeleted: true }` repeats                           | L383, L387, L509, L517 |
| 17  | Inline business logic            | **Present, strong**: cursor decode + predicate + FTS search named-function-able | L136–155, L162–212     |

---

## 3. Design findings

### Method count + distribution

17 methods.

| Method                           | Lines | Size                     |
| -------------------------------- | ----- | ------------------------ |
| `list`                           | 147   | **Too big**              |
| `validateFtsFunctionWrite`       | 53    | OK but repetitive        |
| `validateFtsFunctionDetailWrite` | 43    | OK but repetitive        |
| `createTreeEdge`                 | 45    | OK — work really is that |
| `createDetail`                   | 25    | OK                       |
| `create`                         | 20    | OK                       |
| others                           | <20   | OK                       |

### Error handling

Typed exceptions everywhere except L165 / L168: `throw new BadRequestException('INVALID_CURSOR')`. Only raw `BadRequestException` in the file — should be a typed `InvalidCursorException` in `@common/errors/exceptions`.

### Prisma access

Consistent `this.prisma.<model>.*`. Two `$queryRawUnsafe` blocks (L137 FULLTEXT, L192 tuple-compare workaround for adapter-mariadb bug). Both have _why_-comments. Both should move to `backend/src/db/sql/fts-function/*.ts` once a second consumer appears.

### Cursor pagination

Inlined. `encodeCursor`/`decodeCursor` (L57–92) are trivially generic → `common/pagination/cursor.ts`. The cursor-predicate block (L162–212) is mostly generic tuple-compare over sort column + direction → `common/pagination/cursor-predicate.ts`.

### FTS search

Inlined (L136–155). Adding a user-field search today requires a new raw-SQL branch inside `list()` and ID merging. Extraction path: `searchFtsFunctionIds(prisma, { query, scope })`.

### Transactions

- Good: `list` wraps findMany+count (L221); `batchAttachDtis` wraps upserts (L476).
- **Missing**: `createTreeEdge` (L374–418) — category-check → parallel findUniques → existence-check → create: race window between existence-check and create. If the unique constraint exists, drop the pre-check and catch P2002; else wrap in `$transaction`.
- **Unclear**: `softDelete` of a function does not cascade to details / tree edges — intentional? Add doc.

### `stripUndefined` helper

Local (L65–72), two call sites (L293, L350). Needed in every Prisma-write service under `exactOptionalPropertyTypes: true`. Belongs in `common/prisma/strip-undefined.ts`.

### Methods doing two jobs

- `list` — 4 jobs (filter / FTS / cursor / count). Strong extraction candidate.
- `detachDti` (L490–502) — throws `FtsFunctionNotFoundException` (L495) when the **join row** is missing. Wrong exception type → **potential bug**.
- `deleteTreeEdge` — findUnique then delete; could be `delete().catch(P2025…)`. Minor.

### DTO validation

At controller boundary (Zod). Service does semantic validation (FK existence, category, user role). Clean separation.

### Dictionary lookups

`assertTypeCategory` = one `type.findUniqueOrThrow` per call. `validateFtsFunctionWrite` fires up to 4 in parallel (plus 4 user-role checks). A batched `assertTypesCategories(prisma, [{ id, expected }])` doing one `findMany({ id: { in } })` would collapse 4 round-trips to 1.

---

## 4. Extraction opportunities

| Extract                                           | To                                           | Reuse                      |
| ------------------------------------------------- | -------------------------------------------- | -------------------------- |
| `encodeCursor` / `decodeCursor` / `DecodedCursor` | `common/pagination/cursor.ts`                | Every paginated list       |
| Cursor predicate (L162–212)                       | `common/pagination/cursor-predicate.ts`      | Every paginated list       |
| `stripUndefined`                                  | `common/prisma/strip-undefined.ts`           | Every Prisma update        |
| Filter → `where` builder (L106–131)               | `fts-function.where-builder.ts`              | List-adjacent queries      |
| FTS search (L136–155)                             | `fts-function.fts-search.ts`                 | Scope-parameterized        |
| `assertTypeCategory` batch                        | `internal/assert-types-categories.ts`        | Every multi-FK write       |
| `ensureFtsFunctionAlive` / `ensureDetailAlive`    | generic `ensureAlive(model, id, notFoundEx)` | Every soft-deletable model |

`translatePrismaError` — prompt says done via W6. If that is an exception filter, `createTreeEdge`/`attachDti` can drop their pre-read existence checks entirely.

---

## 5. Custom Prisma client extensions (`prisma.$extends`)?

Wins concrete to this file:

1. **Soft-delete auto-filter** on `ftsFunction`, `ftsFunctionDetail` — kills the `if (!query.includeDeleted) where.isDeleted = false;` line (L108) and both `ensureAlive` helpers. Needs a bypass flag for `includeDeleted`.
2. **Counter fan-out** — `this.counter.onCreate()` (L283) / `.onSoftDelete()` (L307) are cross-cutting. A query-extension can fire them automatically on `create` / `update({ isDeleted: true })`, removing the explicit coupling to `FtsFunctionCounterService`.
3. **Audit log writes** — defer until a real requirement exists (YAGNI).
4. **`updatedAt` touch** — Prisma handles via `@updatedAt`.

Recommendation: **do soft-delete filter + counter fan-out via `$extends`**. Skip audit for now.

---

## 6. Prioritized actions (impact × effort)

| #   | Action                                                                | Impact                    | Effort | Priority  |
| --- | --------------------------------------------------------------------- | ------------------------- | ------ | --------- |
| 1   | Extract cursor encode/decode + predicate to `common/pagination`       | High (reuse)              | S      | **First** |
| 2   | Extract `stripUndefined` to `common/prisma`                           | Med                       | XS     | **First** |
| 3   | Typed `InvalidCursorException`                                        | Med                       | XS     | **First** |
| 4   | Batch `assertTypeCategory` via `findMany({ id: { in } })`             | Med perf                  | S      | Soon      |
| 5   | Extract filter-to-where + FTS-ids into module-internal builders       | High (list() readability) | M      | Soon      |
| 6   | Fix `detachDti` wrong exception type for missing join row             | Correctness               | XS     | Soon      |
| 7   | Drop pre-check in `createTreeEdge`, rely on unique constraint + P2002 | Med                       | S      | After #5  |
| 8   | `prisma.$extends`: soft-delete filter + counter fan-out               | High                      | M–L    | Later     |
| 9   | Move raw SQL to `db/sql/fts-function/*`                               | Low                       | S      | Later     |

---

## 7. What's GOOD

- Typed exceptions for every domain error (except the one cursor case).
- `select` projections factored to `internal/fts-function.selects.ts` — not inlined.
- Category validation lives at service level — correct (controller can't know cross-table semantics).
- `list()` uses `$transaction` for findMany + count (read consistency).
- `batchAttachDtis` wraps upserts in `$transaction`.
- `TreeSelfLoopException` thrown before any DB work (L375) — fail fast.
- Raw-SQL comments explain _why_ (L134–135, L186–189) — keep this style.
- `stripUndefined` docstring names the exact tsconfig flag — future-dev-friendly.
- Counter-service injection keeps total-count hot path off the read path.
- `internal/` subfolder keeps module-private symbols out of the public import surface.

---

_Audit produced 2026-04-24. Read-only._

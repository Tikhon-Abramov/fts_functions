# Audit 02 — Backend Smells (`apps/api`)

## Top 5 architectural problems

1. **`isSoftDeleted` causes a redundant DB round-trip** after `findUnique` already returned the row. `updateUser`/`deleteUser` in `constant.service.ts:221, 249` fetch the row, then `isSoftDeleted(id)` does another `findUnique`.
   → Fix: add `isDeleted: true` to `USER_RESPONSE_SELECT`, check `before.isDeleted` inline, delete `isSoftDeleted`.

2. **Inline mapped types in `satisfies` clauses, never named-and-exported.**
   → `{ [K in keyof TypeQueryDto]?: keyof Prisma.TypeWhereInput }` at `constant.service.ts:27` and same shape at line 34 for `UserQueryDto`.
   → Fix: name them `TypeQueryFieldMap`, `UserQueryFieldMap`, export from a `constant.types.ts`.

3. **`buildWhereInArrays` generic is structurally weak.**
   → Second type param is `TWhere extends Record<string, unknown>` — callers get `Partial<TWhere>` back with no key-safety; mistyped `whereKey` compiles silently.
   → Fix: use `{ [K in keyof TDto]?: keyof TWhere }` as `fieldMap` type, extract as `DtoToWhereFieldMap<TDto, TWhere>`, tighten return.

4. **Dual-import of Prisma client** in same file.
   → `constant.service.ts:7` imports `Prisma` from `@prisma-client` (path alias), `constant.service.ts:22` imports `Category` from bare `@prisma/client`. Generated client is at custom output (`schema.prisma:4`) → bare import resolves to npm stub → `Category` may be `undefined` at runtime.
   → Fix: standardise on `@prisma-client` everywhere.

5. **`mapDuplicateNameOrRethrow` creates a useless alias** `DuplicateNameError = FunctionNameDuplicateException` at `fts-function.service.ts:628`.
   → Fix: use the class directly at the `new` site, delete the alias.

---

## Critical (will cause user-visible bugs)

### `constant.service.ts:221, 249` — Redundant `isSoftDeleted` DB round-trip

`updateUser`/`deleteUser` call `findUnique` → `isSoftDeleted(id)` (a second `findUnique` for the same row). Wasted round-trip on every happy path; race-vulnerable.
**Fix**: add `isDeleted: true` to the select, check `before.isDeleted` inline, delete `isSoftDeleted`.

### `fts-function.service.ts:155, 183, 218, 245` — `as unknown as Record<string, ...>` quadruple-cast

Double-cast silences the compiler for any real shape mismatch. The actual types are fully known from Zod-derived DTO classes.
**Fix**: type the validator's parameter properly, drop the casts. Ideally make `validateFtsFunctionWrite` accept `Partial<Record<keyof (CreateFtsFunctionDto & UpdateFtsFunctionDto), number | null | undefined>>` or an explicit `FtsFunctionWriteInput` base type.

### `constant.service.ts:7 + :22` — Dual Prisma client import

`Prisma` from `@prisma-client` alias, `Category` from bare `@prisma/client`. Generated client is at custom output path → bare import returns the npm stub → `Category` may be `undefined` at runtime.
**Fix**: standardise on `@prisma-client` alias everywhere.

---

## High (silent footgun / drift)

### `fts-function.service.ts:628` — Dead alias

`const DuplicateNameError = FunctionNameDuplicateException` used once at line 643. Breaks "find usages" of the class.

### `fts-function.service.ts:129` — Unnecessary `as Date | undefined` cast

`updatedAt` is `Date` per Prisma model (`@updatedAt @default(now())`). The cast hides a non-existent type error and signals untrustworthy types.

### `assert-type-category.ts:12` and `assert-types-categories.ts:17` — Copy-pasted `CATEGORY_TO_LOCATION` IIFE

Same logic in both files. `assertTypeCategory` should not exist — it's a single-item wrapper over `assertTypesCategories`.
**Fix**: delete `assert-type-category.ts`, update the one call site at `fts-function.service.ts:271` to use the batch version.

### `fts-function.controller.ts:51-53, 84-85, 127-128, 170-171, 200-201` — 118-character `/////...` banner comments

Visual noise. Inconsistent with the `// ── X ──` style used in the service.

### `constant.service.ts:267-273` — `isSoftDeleted` is a private utility never reachable as standalone

Always called immediately after a `findUnique` that already has the row.

---

## Medium (interface/naming/typing — "cringe things")

### `constant.service.ts:27, 34` — Inline mapped types in `satisfies`

```ts
} as const satisfies { [K in keyof TypeQueryDto]?: keyof Prisma.TypeWhereInput };
```

Same at line 34 for `UserQueryDto`.
**Fix**: extract as named types `TypeQueryFieldMap` / `UserQueryFieldMap`, live in `constant.schema.ts` or a `constant.types.ts`.

### `build-where-from-query-dto.ts:16` — Inline mapped type as `fieldMap` parameter

The `fieldMap` parameter type `{ readonly [K in keyof TDto]?: keyof TWhere }` is inline.
**Fix**: extract as `DtoToWhereFieldMap<TDto, TWhere>` and export from `@common/prisma`.

### `fts-function.service.ts:58-66` — `FtsFunctionListResult` not exported

Module-local type that callers (and tests) need to re-derive. Either unify with `FtsFunctionListResponseDto` from the schema OR export.

### `fts-function.schema.ts:141, 145` — `typeMinimalSchema`, `userMinimalSchema` are camelCase

Convention in the file is `PascalCaseSchema` (`FtsFunctionBaseResponseSchema`, etc.). Rename to `TypeMinimalSchema`, `UserMinimalSchema`.

### `fts-function.schema.ts:174, 193, 214, 222, 232` — 5 intermediate response schemas declared `const` but never `export`ed

If any test or shared package needs to infer the type they must re-derive it. Either export or comment as intentionally-private.

### `constant.service.ts:223` — Double-cast `dto as Record<string, unknown>`

`stripUndefined` already returns `Partial<T>`. Cast throws away the type.
**Fix**: keep `Partial<UserUpdateDto>`, delete cast.

### `fts-function.schema.ts:274` — `.min(0)` on an array adds nothing

Default. If zero elements is intentional, document it; if not, use `.min(1)`.

### Inconsistent Zod helper naming across files

`fts-function.schema.ts` and `constant.schema.ts` define separate `IdParamSchema` with identical logic. Should share from a `@common/zod` barrel.

### `FtsFunctionTree.parentFtsFunctionId / childFtsFunctionId` — schema naming lie

The referenced model is `FtsFunctionDetail`, not `FtsFunction`. Architecturally misleading — every consumer needs the comment "parentFtsFunctionId = detail id" (see service.ts:274).
**Fix**: rename in a migration to `parentDetailId / childDetailId`. Pays back forever.

### `assert-user-role.ts:11-16` — Dual-purpose `UserRoleSlot`

Both an `object` constant (SCREAMING_SNAKE keys → camelCase string values) and a type alias of the same name. Values are camelCase strings used as DTO key suffixes via template literal at service.ts:563.
**Fix**: extract DTO-key concern into a separate `USER_SLOT_DTO_KEY` map.

### `constant.service.ts:60` — `BCRYPT_ROUNDS = 12` buried in service

Should live in `@common/auth/crypto.ts` (or similar). Invisible to future auth code.

### `USER_RESPONSE_SELECT` (`constant.service.ts:46`) — monolithic blob, undecomposed

Same field bag reused at 5 call sites. Should decompose into `USER_IDENTITY_SELECT + USER_DESCRIPTION_SELECT + USER_FTS_ROLE_SELECT`, spread to compose. Move to `constant/internal/constant.selects.ts` (matches the `fts-function.selects.ts` convention).

---

## Low (comments, dead code, cosmetic)

### `constant.controller.ts:28-29, 64` — Stale `// FTS-NO-AUTH BRANCH: removed` comments

Code already gone, comments are noise.

### `fts-function.service.ts:1-9` — Top-of-file JSDoc claims audit-log writes per method

Zero `audit.*` calls in this file. Comment lies.

### `schema.prisma:76-92` — Commented-out `UserPermission` model with `@.` typos

Dead scaffolding.

### `fts-function.service.ts:421-427` — `idFilter['in']`, `idFilter['not']` etc. via string-literal bracket access

Should use `Prisma.IntFilter` directly for autocomplete + typo catching.

### `fts-function.schema.ts:170-172` — 3-line essay comment over an obvious `extend`

Trim to one clause.

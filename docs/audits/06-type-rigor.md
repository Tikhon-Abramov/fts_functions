# Audit 06 — Type-System Rigor

> Strong types are the cheapest way to make code self-documenting. Currently the API tsconfig **disables `noImplicitAny`**, the codebase has zero branded types, inline mapped types appear at use-sites instead of being named, and DTO shapes are duplicated across Zod (API) and hand-written types (web codegen).

## Section 1: tsconfig strictness scorecard

Reviewing all tsconfigs:

| Flag                                 | `tsconfig.base.json` | API `tsconfig.json`                     | Notes                   |
| ------------------------------------ | -------------------- | --------------------------------------- | ----------------------- |
| `strict: true`                       | ✅                   | ❌ (relies on `strictNullChecks` alone) | API not strict overall  |
| `noUncheckedIndexedAccess`           | ✅                   | ✅                                      |                         |
| `exactOptionalPropertyTypes`         | ✅                   | ✅                                      |                         |
| `noImplicitOverride`                 | ✅                   | ✅                                      |                         |
| `noImplicitReturns`                  | ❌                   | ❌                                      | Missing everywhere      |
| `noFallthroughCasesInSwitch`         | ❌                   | **`false`** explicitly                  | API explicitly disables |
| `useUnknownInCatchVariables`         | ✅                   | ✅                                      |                         |
| `noPropertyAccessFromIndexSignature` | ✅                   | ✅                                      |                         |

**API tsconfig issue (CRITICAL)**:
`apps/api/tsconfig.json` does NOT extend `tsconfig.base.json`. Standalone config sets:

- Line 19: `noImplicitAny: false` — allows untyped function params anywhere in the 1000+ file API source tree.
- Line 20: `strictBindCallApply: false`
- Line 21: `noFallthroughCasesInSwitch: false`

This means the API does NOT have `strict: true`. The `noImplicitAny: false` is the worst — every `as unknown as Record<string, ...>` in the service would otherwise be a compile error.

**Missing flags everywhere**:

- `noImplicitReturns` — absent in base + API. Functions with conditional branches where one path falls through silently return `undefined`.
- `noFallthroughCasesInSwitch` — absent in base, explicitly `false` in API. The `applyIdFilter` switch in `list-translators.ts` (13 cases) would benefit.

**Recommendations**:

- Add to `tsconfig.base.json`: `"noImplicitReturns": true, "noFallthroughCasesInSwitch": true`
- Change API tsconfig to `"extends": "../../tsconfig.base.json"` and add `"strict": true`
- Remove the API's own `noImplicitAny: false`, `strictBindCallApply: false`, `noFallthroughCasesInSwitch: false`

---

## Section 2: Critical type holes

### `as unknown as Record<string, number | undefined>` × 4 — `fts-function.service.ts:155, 183, 218, 245`

Double-cast escape hatch used 4 times because `CreateFtsFunctionDto`/`UpdateFtsFunctionDto` are Zod-derived classes but `validateFtsFunctionWrite` accepts `Record<string, number | undefined>`. Actual types fully known.
**Fix**: give validator a concrete `FtsFunctionWriteInput` type that both DTOs satisfy.

### `as unknown as Record<string, unknown>` for Prisma update data — `fts-function.service.ts:191, 249` and `constant.service.ts:223`

Same pattern. `stripUndefined` already takes `T extends Record<string, unknown>`. DTO instances extend classes, hence the cast. Type `stripUndefined` to accept `object` and cast internally once.

### `params?` typed as `Record<string, unknown>` in error body — `apps/web/src/shared/api/rtkErrorMiddleware.ts:40-44`

`ErrorResponse.params` is already typed in `@registry/shared/errors`. The cast discards that type.

### `(action as { payload?: unknown }).payload` — `rtkErrorMiddleware.ts:15`

RTK Query's `isRejectedWithValue` already narrows to `PayloadAction<unknown>`. Extra cast is a false narrowing.

### `AuthControllerRegisterV1ApiResponse = unknown` (and ~10 similar) — `ftsFunctionsApi.ts:551-607`

All auth/profile API response types are `unknown` (codegen output). UI reads `.data` and gets `unknown`. **Update OpenAPI spec** to include response schemas, re-run codegen.

### `ErrorResponseDto.params` and `.message` contain `any` — `ftsFunctionsApi.ts:762-765` (codegen)

```ts
params?: { [key: string]: any; };
message: string | string[] | any[];
```

Propagates `any` into rtkErrorMiddleware. `stringifyMessagePart`'s `(m: unknown)` is defeated at the call site.

---

## Section 3: Missing structure

### 3a. Inline types to extract

**`TypeCategory` 13-member union duplicated 3 times in `ftsFunctionsApi.ts`**
Verbatim in `TypeResponseDto`, `TypeCreateDto`, `TypeUpdateDto`. Should be a named export `type TypeCategory = "FTS_CENTRALIZATION" | ...`.

**`{ table: string; column: string }` duplicated** — `assert-type-category.ts:12` and `assert-types-categories.ts:17`. Same `CATEGORY_TO_LOCATION` map copy-pasted. Single shared constant in `internal/category-location.ts`. **Type**: `CategoryLocationMap`.

**`Partial<Record<string, { table: string; column: string }>>` inline** — Same files. Name `CategoryLocationMap` (typed by `Category`, not `string`).

**`{ [K in keyof TypeQueryDto]?: keyof Prisma.TypeWhereInput }`** — `constant.service.ts:27, 34`. Extract as `TypeQueryFieldMap` / `UserQueryFieldMap` in `constant.types.ts`.

**`{ readonly [K in keyof TDto]?: keyof TWhere }`** — `build-where-from-query-dto.ts:16`. Extract as `DtoToWhereFieldMap<TDto, TWhere>` in `@common/prisma`.

### 3b. Branded types missing

**No branded types anywhere in the codebase.** Every entity ID flows as plain `number`. Nothing prevents passing a `detailId` where a `ftsFunctionId` is expected.

Propose `apps/api/src/common/types/branded.ts`:

```ts
declare const __brand: unique symbol;
export type Brand<T, B> = T & { readonly [__brand]: B };
export type FtsFunctionId = Brand<number, "FtsFunctionId">;
export type FtsFunctionDetailId = Brand<number, "FtsFunctionDetailId">;
export type TypeId = Brand<number, "TypeId">;
export type UserId = Brand<number, "UserId">;
export type DtiId = Brand<number, "DtiId">;
```

Controller's Zod params already validate `positiveInt` — adding `.transform((n) => n as FtsFunctionId)` propagates the brand at zero runtime cost.

**Highest-risk site**: `createTreeEdge` — `parentFtsFunctionId` and `childFtsFunctionId` are both `number` and the method treats them as DETAIL IDs via `prisma.ftsFunctionDetail.findUnique`. Brand mismatch caught by compiler.

### 3c. Discriminated unions vs optional fields

**`UserRoleExpectation` uses optional fields where a disc-union is correct** — `assert-user-role.ts:20-25`

```ts
type UserRoleExpectation = {
  ftsBranchType: FtsBranchType;
  ftsFunctionRole?: FtsFunctionRole; // mutually exclusive with…
  requireFtsPositionRole?: boolean; // …this
};
```

Should be:

```ts
type UserRoleExpectation =
  | {
      kind: "function-role";
      ftsBranchType: FtsBranchType;
      ftsFunctionRole: FtsFunctionRole;
    }
  | { kind: "position-role"; ftsBranchType: FtsBranchType };
```

### 3d. `Record<string, unknown>` and weak types

- `idFilter: Record<string, unknown>` — `fts-function.service.ts:421`. Should be `Prisma.IntFilter` for autocomplete + typo catching.
- `CATEGORY_TO_LOCATION: Partial<Record<string, ...>>` — keys should be `Category` not `string`.

### 3e. DTO duplication — Zod (API) vs hand-written (web codegen)

API defines response shapes twice:

- API `fts-function.schema.ts` Zod schemas
- Web `ftsFunctionsApi.ts` hand-written/codegen DTOs

`FtsFunctionBaseResponseSchema` (API) and `FtsFunctionBaseResponseDto` (web) are structurally identical but disconnected — a field rename on the API requires updating both.

**Fix**: web's `FtsFunctionListResponseDto` etc. should be `z.infer<typeof FtsFunctionListResponseSchema>` imported from `@registry/shared`. The enum-assertion pattern shows the project knows how to share types via `@registry/shared` — response DTOs should follow the same path.

---

## Section 4: Cross-cutting — proposed strict eslint+ts standards

| Rule                                                                  | Pain when first enabled                       | Rationale                                                                 |
| --------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| Add `strict: true` to API tsconfig (removes `noImplicitAny: false`)   | **High** — 20-40 errors in service/config     | Closes the gap that lets `Record<string, unknown>` casts compile silently |
| `noImplicitReturns: true`                                             | **Medium** — multi-branch async will hit      | Catches "fell off the end" returning `undefined`                          |
| `noFallthroughCasesInSwitch: true`                                    | **Low** — `applyIdFilter` cases all `return`  | Future-proofs                                                             |
| `@typescript-eslint/no-explicit-any` set to `error`                   | **High** on codegen `ErrorResponseDto.params` | Codegen `any` is the only blocker; hand-written code is already absent    |
| `@typescript-eslint/consistent-type-imports`                          | **Low** — mostly mechanical                   | Tree-shaking + clarity                                                    |
| `@typescript-eslint/explicit-function-return-type` on exported funcs  | **Medium**                                    | Helper components in `home.tsx` use inferred returns                      |
| `@typescript-eslint/no-unsafe-assignment` / `no-unsafe-member-access` | **Medium**                                    | Triggered by codegen `any`; once fixed, costs nothing                     |
| Branded ID types (custom rule or convention)                          | **High** — touch every Zod schema             | Highest long-term self-documentation value                                |

### Priority sequence

1. Fix API tsconfig to extend base + add `strict: true`.
2. Add `noImplicitReturns` and `noFallthroughCasesInSwitch` to base.
3. Fix codegen template to eliminate `any` in `ErrorResponseDto`.
4. Introduce branded ID types at the Zod schema layer.
5. Move response DTO shapes into `@registry/shared` so web codegen types become aliases rather than copies.

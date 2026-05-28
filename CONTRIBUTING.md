# Contributing

## Before you start

- Read [`docs/patterns.md`](docs/patterns.md). Every PR is reviewed
  through the lens of the 33 pattern classes; familiarity with them
  shortens the review loop.
- Skim [`docs/architecture.md`](docs/architecture.md) so you know
  where features live.
- Make sure `pnpm install` has run at least once on your branch — the
  husky hooks are wired by the root `prepare` script.

The pre-commit hook runs `lint-staged`, which runs `eslint --fix` plus
`prettier --write` on staged files. Non-fixable lint errors block the
commit. Run `pnpm lint:fix` manually to apply fixes without committing.

Bypassing the hook (`git commit --no-verify`) is reserved for genuine
WIP commits on a feature branch. Repeated bypasses are a code-smell of
their own — see
[Class 10](docs/patterns.md#class-10--overused---no-verify).

## Adding a feature

Worked example: **add a new column to the registry table**, end-to-end.
Adapt the steps for any feature that touches both apps.

1. **Schema.** If the new column is a persistent field, edit
   `apps/api/db/schema.prisma`. Run
   `pnpm --filter=@registry/api prisma migrate dev --name <slug>` to
   create and apply the migration; commit the migration alongside the
   code change.
2. **Shared contract.** If the field has a finite vocabulary or carries
   a domain identifier consumed by both apps, add it to
   `packages/shared/enums/` (and re-export from `index.ts`). Use the
   `const`-as-`const` registry pattern; do not introduce a new string
   union type.
3. **Backend service and DTO.** Update the relevant service under
   `apps/api/src/module/<feature>/` and the corresponding DTO/zod
   schema. The schema is the single source of truth for input
   validation, OpenAPI shape, and the inferred TypeScript type.
4. **OpenAPI codegen.** Run
   `pnpm --filter=@registry/web codegen` to regenerate the RTK Query
   endpoints. Commit the generated file change.
5. **Column registration.** Add the new column to
   `apps/web/src/entities/fts-function/config/columns.tsx`. Use the
   existing column factories — don't hand-roll a one-off.
6. **i18n.** Add the column header (and any cell-level labels) to
   `apps/web/src/shared/i18n/<locale>/<namespace>.json` and reference
   them through the typed `I18N` registry. Russian literals in
   source will be blocked at lint time.
7. **`data-testid`.** If the column or its cell needs to be reachable
   from the Playwright suite, register the test id under the
   `data-testid` registry rather than typing the string at the call
   site. See
   [Class 32](docs/patterns.md#class-32--test-id-strings-without-a-registry).
8. **Verify.** Run, in order:
   - `pnpm turbo run check` — typecheck the world
   - `pnpm lint` — lint
   - `pnpm test` — backend Jest
   - `pnpm test:e2e` — Playwright (run the relevant spec only with
     `pnpm --filter=@registry/web exec playwright test home.spec.ts`
     during development)

If any of those fail, fix and rerun before opening the PR.

## Code-review checklist

Reviews use the pattern library as the lens. Pay particular attention to:

- **[Class 2 / Class 27](docs/patterns.md#class-2--string-unions-instead-of-const-as-const-enums)**
  — string-union types and literal property keys for domain
  identifiers should be `const`-as-`const` registries pulled from the
  shared package.
- **[Class 26](docs/patterns.md#class-26--stealth-hook-helper-helper-that-secretly-calls-a-hook)**
  — pure-looking helpers that secretly call a hook. The custom rule
  catches the obvious cases; reviewers catch the rest.
- **[Class 30](docs/patterns.md#class-30--props-destructuring-location-and-type-naming)**
  — props destructure at the top of the body, props type named
  `<Component>Props`. Enforced by the custom rule but worth a glance.
- **[Class 6](docs/patterns.md#class-6--huge-multi-responsibility-components)**
  — components above a few hundred LOC are nearly always doing too
  much. Extract hooks, config, and feature-grouped subcomponents.
- **[Class 1](docs/patterns.md#class-1--hardcoded-russian-ui-strings)**
  — Russian text outside `shared/i18n/**` (frontend) or
  `common/strings/` (backend). Lint catches the obvious cases; review
  catches reintroductions.
- **[Class 17](docs/patterns.md#class-17--inline-business-logic-in-components)**
  — business logic inline in components belongs under
  `entities/<feature>/lib/` or in a hook.

Approve only when the change reads as if it had always been there.

## Commit conventions

One-line summary, optional body. Imperative mood, lower-case after the
prefix:

```
<scope>: <one-line summary>

<optional body explaining why, not what>

Co-Authored-By: <name> <email>
```

Useful scope prefixes already in the log: `enum-migration`, `tsconfig`,
`docs`, `lint`, `refactor`. Add a new scope when none of the existing
fit; consistency matters more than the specific list.

When pair-programming or AI-assisted, add a `Co-Authored-By` trailer.

## Branching and PRs

- Feature branches off `main`. Branch names: `<scope>/<short-slug>`.
- Rebase, don't merge, when bringing your branch up to date.
- PR description: what changed, why, and which pattern classes the
  change reflects (or which classes it newly added to the library).
- Don't push to remote unless the change has been reviewed locally
  with `git status`, `git diff`, and `pnpm turbo run check lint`
  passing.

# Refactor Journey

The story of how this codebase moved from a Replit-template prototype to
its current shape. Read this for context — the _why_ behind the patterns
documented in [`patterns.md`](patterns.md) and the structure described
in [`architecture.md`](architecture.md).

This is also the showcase document. The pattern library and the lint
plugin are the artefacts; this is the work that produced them.

## Starting point

The first commit was a Replit template — a generated full-stack
prototype with shadcn/Radix UI primitives, hand-rolled Drizzle schema,
hard-coded Russian copy in JSX, and a single tsconfig with stale path
aliases. There was no monorepo task graph; npm workspaces were
double-nested (`registry-functions/registry-functions/` — the path
that still survives in the working directory and in this repo's name).

Concretely, what was wrong:

- Several thousand Cyrillic string literals lived in component source.
- The largest page component (`home.tsx`) was 1171 LOC of mixed
  rendering, business logic, and form orchestration.
- The detailization modal was 1235 LOC. The function-form panel had
  rendered four near-identical sibling JSX blocks for the same shape
  of data.
- shadcn `Card`, `Button`, and `Input` primitives sat alongside MUI 7
  components — a dual UI vocabulary inherited from the template.
- Backend used a `prisma/schema.prisma` directory but talked to
  MariaDB through ad-hoc connection code.
- ESLint config was the Vite default; nothing project-specific.
- Type sharing across the frontend/backend boundary was string-based:
  enum values were duplicated as literals in two places, drifting
  silently when one side was edited.
- npm was the package manager. The lockfile was several megabytes and
  the workspace resolution was unreliable.

## The 33 pattern classes

Every refactor wave produced lessons. Lessons that recurred became
classes. Classes that recurred across features became enforcement
candidates. The full library — 33 classes, numbered 1–17 and 23–33 —
lives in [`patterns.md`](patterns.md). Each class has the same shape:
**Shape**, **Why wrong**, **How to find**, **How to fix**, **How to
prevent recurrence**. Three classes are enforced by the custom ESLint
plugin (`paired-ternary-styling`, `stealth-hook-helper`,
`props-destructure-location`); three more are scaffolded for future
enforcement (`sibling-jsx-data-variation`, `domain-id-registry-keys`,
`testid-registry`).

The numbering gap between 17 and 23 is intentional — five slots reserved
for additions in the lower-mid range as the library grows. Read no
significance into the gap.

## The waves

The work proceeded in roughly thematic waves. Each wave landed across
many commits; this list groups by intent rather than by commit.

1. **Replit residue purge.** Removed the shadcn/Radix UI primitives
   that weren't being used; isolated the ones that still were behind
   feature toggles for later removal. Established MUI 7 as the only
   UI vocabulary.
2. **Frontend i18n migration.** Moved every user-facing Russian string
   from JSX into typed i18n key registries. Built the `I18N` const
   tree, ported every component, added the `eslint-plugin-i18next`
   guardrail, then added a stricter `no-restricted-syntax` rule
   forbidding Cyrillic literals outside `shared/i18n/**`.
3. **Backend string discipline.** Mirrored the frontend approach on
   the backend with three const-as-const registries
   (`SWAGGER_DESCRIPTION`, `ERROR_MESSAGE`, `LOG_MESSAGE`). Russian
   text in source code became greppable to one folder.
4. **Component decomposition.** Broke down the giant components.
   `home.tsx` from 1171 → 989 LOC; `detailization-modal.tsx` from
   1235 → 259 LOC. The extracted pieces moved into
   `entities/fts-function/{hooks,lib,config,model}` and
   feature-grouped folders under `components/`.
5. **Form and validation rationalisation.** Replaced manual form
   state and dirty-checks with React Hook Form. Schema validation
   moved to `zod`, with a single shared schema living in
   `@registry/shared/validation` for use by both frontend resolvers
   and backend `ZodValidationPipe`.
6. **Enum mirror migration (wave 1).** String-literal unions with
   domain meaning were converted to `const`-as-`const` registries.
   See [Class 2 in `patterns.md`](patterns.md#class-2--string-unions-instead-of-const-as-const-enums).
7. **Enum mirror migration (wave 2).** Domain-id literals (used as
   property keys in dispatch tables) were replaced with references
   to a shared registry. See
   [Class 27](patterns.md#class-27--literal-property-keys-for-domain-meaningful-identifiers).
   This is the most recent commit at HEAD as of writing.
8. **Monorepo restructure.** Migrated from double-nested npm
   workspaces to pnpm + Turbo with `apps/*` and `packages/*`
   layout. Lockfile size dropped, install times dropped, the
   workspace graph became authoritative.
9. **Shared package extraction.** `packages/shared` published the
   stable cross-boundary contracts: error codes, enum mirrors,
   validation schemas. Both apps consume it via `workspace:*`.
10. **ESLint hardening.** Layered project-specific rules on top of
    the agario-baseline config: `eslint-plugin-boundaries` for
    architectural layering, `eslint-plugin-import`,
    `eslint-plugin-unicorn`, `eslint-plugin-i18next`, plus a custom
    plugin for the rules off-the-shelf tools couldn't express.
11. **Custom ESLint plugin.** `@registry/eslint-plugin` shipped with
    six rules — three detection and three scaffold — corresponding
    to pattern classes 23, 26, 27, 29, 30, and 32. The plugin loads
    directly from TypeScript source via jiti; no build step.
12. **Pagination unification.** Cursor-based pagination keyed on
    `(createdAt, id)` replaced ad-hoc offset implementations on every
    list endpoint.
13. **Error-code unification.** Backend exception classes carry stable
    `ErrorCode` symbols; the frontend's `rtkErrorMiddleware` resolves
    them to localized snackbars. Error text moved to one place.
14. **TSConfig sanity.** Project references introduced; `tsc -b`
    across the whole monorepo runs clean. The ESLint parser uses the
    same project references so type-aware rules work without
    duplicating config.

The list above is intentionally lossy — many small fixes accompanied
each wave, and a handful of waves overlapped.

## What went wrong

Honest reflection. The refactor exposed real blind spots in our review
process:

- **Single-line regex audits missed multi-line unions.** When grepping
  for string-union types, a `^type X =` followed by a multi-line list
  of literals slipped past every audit until we tightened the pattern.
  This became Class 2's "How to find" guidance.
- **Helpers that secretly called hooks.** A function named
  `formatRowLabel(row)` looked pure, was used in callsites that assumed
  it was pure, and silently called `useTranslation` inside. Caused
  Rules-of-Hooks violations only at the edges. Lesson became
  [Class 26](patterns.md#class-26--stealth-hook-helper-helper-that-secretly-calls-a-hook),
  enforced by the `stealth-hook-helper` rule.
- **`t` was sometimes a prop, sometimes a hook.** Inconsistency that
  made every component slightly different to read. Lesson: pick one;
  prefer hook unless an explicit boundary is being drawn.
- **Audit churn.** Several "we're done!" moments were followed by a
  fresh class — the last 10% of the migration kept finding a new 5%.
  We stopped declaring victory and started cataloguing.
- **Custom plugin scaffolding cost.** The three scaffold rules were
  shipped as empty visitors so the rule list and message catalogue
  could stabilise before each rule's logic landed. Useful in
  retrospect; cost a few rounds of review explaining "no, it's not
  doing nothing, it's a placeholder by design".

Each class added to the library is a real lesson — none of them were
invented prophylactically.

## What it bought

Concrete outcomes:

- **Component sizes.** `home.tsx` 1171 → 989 LOC.
  `detailization-modal.tsx` 1235 → 259 LOC. Several other 600+ LOC
  components reduced to under 300 by extracting hooks, config, and
  feature-grouped subcomponents.
- **Lint clean.** Zero ESLint errors across the monorepo. The
  agario-baseline config plus the custom plugin enforces three
  pattern classes automatically; three more are scaffolded.
- **Type clean.** `pnpm turbo run check` passes across every workspace
  under project references.
- **Tests green.** Backend Jest suite plus frontend Playwright suite,
  together covering the CRUD path, detail rows, tree edges, error
  handling, and resilience.
- **Greppable Russian.** All Russian copy lives in two folders
  (`apps/web/src/shared/i18n/` and `apps/api/src/common/strings/`).
  Editing copy is a one-folder operation.
- **Single source of truth per concern.** Validation schemas, error
  codes, and domain enums live in `@registry/shared`. No more
  silent drift across the boundary.
- **Monorepo task graph.** pnpm + Turbo replaced double-nested npm
  workspaces. `pnpm install` is fast; `turbo run` caches everything
  cacheable; CI-readiness improved enormously.

## What's next

- **CI/CD.** Build, lint, test, and deploy pipelines aren't yet wired.
  The status badges in [`README.md`](../README.md) are placeholders
  pending this work.
- **Frontend test coverage.** Vitest is configured; the unit/component
  test suite is thin. Expanding it is the next quality investment.
- **Observability.** Backend logging is solid via `nestjs-pino`.
  Frontend telemetry (error tracking, analytics) is absent.
- **Authentication and authorisation.** The schema models users and
  roles; the controllers don't yet enforce a guard. Login flow,
  session handling, and route guards are all pending.
- **ALIGN-CASING migration.** Some legacy file and identifier names
  follow `kebab-case-but-with-PascalCase-tags` from the Replit era.
  A planned pass will normalise to project conventions
  (`kebab-case` filenames, `PascalCase` types, `camelCase` values).
- **FINAL-AUDIT scorecard.** A scheduled comprehensive audit will
  produce a class-by-class scorecard. When it lands, link it from
  this section.

The patterns library, the lint plugin, and the structure described in
[`architecture.md`](architecture.md) are not the end state — they're
the chassis the next round of work bolts onto.

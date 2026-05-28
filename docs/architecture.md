# Architecture

This document explains the shape of the codebase: what each layer is, where
things live, how a request flows end-to-end, and how cross-cutting concerns
(i18n, errors, pagination, types) are handled.

For _why_ the patterns are what they are — what we found, what we refused —
see [`patterns.md`](patterns.md). For the historical narrative of how we
got here, see [`refactor-journey.md`](refactor-journey.md).

## Overview

- **Frontend** (`apps/web`) — Vite + React + MUI + RTK Query single-page app.
  Renders the registry table, the function form, and the detail-step modal.
- **Backend** (`apps/api`) — NestJS on Fastify with Prisma. Owns business
  rules, validation, audit trail, and Swagger documentation.
- **Database** — MariaDB. FULLTEXT indexes on the searchable text columns;
  Prisma migrations for schema evolution; SQL triggers for the audit log.
- **Shared package** (`packages/shared`) — typed cross-boundary contracts:
  error codes, domain enum mirrors, validation primitives.
- **ESLint plugin package** (`packages/eslint-plugin-registry-functions`) —
  three custom rules enforcing pattern classes that aren't expressible with
  off-the-shelf rules.

Build orchestration: pnpm workspaces with Turbo as the task graph. Turbo
caches `build`, `check`, `test`, and `test:e2e`; `dev` and `start:dev`
are persistent (uncached). See `turbo.json`.

## Monorepo layout

```
registry-functions/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── src/
│   │   │   ├── module/<feature>/     # one folder per domain module
│   │   │   ├── common/               # cross-cutting: config, errors, prisma…
│   │   │   ├── generated/            # prisma-client + prisma-class output
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── db/schema.prisma          # Prisma schema lives here, not /prisma
│   │   ├── test/                     # Jest e2e configuration + fixtures
│   │   ├── .env.example
│   │   └── package.json
│   └── web/                          # Vite + React frontend
│       ├── src/
│       │   ├── app/                  # providers, router, theme
│       │   ├── pages/                # page-level orchestrators
│       │   ├── components/           # feature-grouped UI
│       │   ├── entities/<feature>/   # FSD-light per-domain folders
│       │   └── shared/               # ui primitives, i18n, store, hooks
│       ├── e2e/                      # Playwright suite
│       └── package.json
├── packages/
│   ├── shared/                       # @registry/shared
│   │   ├── enums/
│   │   ├── errors/
│   │   ├── colors/
│   │   ├── validation/
│   │   └── index.ts
│   └── eslint-plugin-registry-functions/   # @registry/eslint-plugin
│       └── src/                      # TS-source rules, loaded via jiti
├── deploy/                           # nginx snippet + deploy notes
├── docs/                             # patterns, architecture, journeys
├── eslint.config.shared.ts           # shared flat config
├── tsconfig.base.json
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Workspace declaration: `pnpm-workspace.yaml` lists `apps/*` and
`packages/*`. Workspace cross-references use the `workspace:*` protocol
(`@registry/shared` is consumed that way by both apps).

## Frontend layers (FSD-light)

The frontend follows a feature-sliced layout with five layers, from outer
to inner:

- **`app/`** — application shell. Providers (Redux store, theme, i18n,
  router), route declarations, top-level error boundary.
- **`pages/`** — page-level orchestrators. One file per route. A page
  composes feature components, owns nothing but URL state.
- **`components/`** — feature-grouped UI. Each feature has its own
  subfolder (`add-item/`, `detailization/`, `function-form/`, `links/`,
  `row-details/`). Folder-form for everything multi-file; one
  `Component.tsx` plus a folder of subcomponents only when justified.
- **`entities/<feature>/`** — the canonical home for a domain entity's
  client side. Subfolders:
  - `model/` — Redux slice if applicable, derived state
  - `hooks/` — feature-specific hooks (`useFtsFunctionTable`, etc.)
  - `lib/` — pure helpers, formatters
  - `config/` — column definitions, dispatch tables, option lists
  - `api/` — RTK Query endpoints (typically codegen-derived)
  - `mocks/` — fixtures used by tests
  - `types/` — feature-local type definitions
- **`shared/`** — reusable primitives, owned by no feature:
  - `ui/` — generic MUI wrappers
  - `i18n/` — typed `I18N` key registry + locale JSON
  - `store/` — Redux store assembly + `rtkErrorMiddleware`
  - `hooks/` — generic hooks
  - `config/` — environment-derived constants
  - `api/` — RTK Query base + OpenAPI codegen config

The layering is enforced (where automatable) by `eslint-plugin-boundaries`.

## Backend layers

The backend uses a flat NestJS module structure, with cross-cutting
concerns hoisted to `common/`:

- **`module/<feature>/`** — one folder per domain module. Each contains:
  - `<feature>.module.ts`
  - `<feature>.controller.ts` — Fastify routes, Swagger annotations
  - `<feature>.service.ts` — business rules, transactions
  - `internal/` — private services + helpers used only by this module
  - `dto/` — input/output DTOs (zod schemas via `@anatine/zod-nestjs`)
- **`common/`** — cross-cutting:
  - `config/` — environment loading + validation, single point of `process.env` access
  - `errors/` — typed exception classes carrying `ErrorCode` symbols
  - `prisma/` — `PrismaService`, transaction helpers, soft-delete utilities
  - `pagination/` — cursor-based pagination primitives
  - `pipes/` — custom `ZodValidationPipe` and friends
  - `filters/` — global exception filter mapping codes → HTTP responses
  - `logger/` — pino setup
  - `strings/` — `SWAGGER_DESCRIPTION`, `ERROR_MESSAGE`, `LOG_MESSAGE`
    const-as-const registries
  - `schemas/` — reusable zod schemas
  - `contract/` — `@registry/shared` re-exports + assertion helpers
  - `constants/`, `utils/`, `test-utils/` — generic helpers

Module modules are discovered manually by `app.module.ts`; there is no
auto-discovery.

## Request flow

Worked example: a user clicks "create function" in the registry table.

1. **Form submission** — `function-form/FunctionFormPanel.tsx` is a
   React Hook Form host. Field validation is driven by a `zod` resolver
   (the same schema lives in `@registry/shared/validation` so the backend
   validates against an identical shape).
2. **RTK Query mutation** — `entities/fts-function/api` exposes
   `useCreateFtsFunctionMutation`, generated from the backend's OpenAPI
   document. The component calls `.unwrap()` and lets thrown errors
   bubble.
3. **Network** — `POST /v1/fts-functions`. RTK Query's base URL respects
   the `/ck-functions/` deploy prefix.
4. **NestJS controller** — `FtsFunctionController.create` receives the
   DTO, already validated by `ZodValidationPipe` against the same
   shared schema.
5. **Service** — `FtsFunctionService.create` opens a Prisma transaction,
   inserts the function row, inserts detail-step rows, writes the audit
   trail, and returns the persisted entity.
6. **DTO mapping** — the service returns a class instance with the shape
   expected by the OpenAPI spec; `class-transformer` strips internals.
7. **Frontend** — RTK Query updates its cache; the registry-table
   selector re-renders. On error, the global `rtkErrorMiddleware`
   inspects the response, resolves the `ErrorCode` to a localized
   message via the i18n registry, and dispatches a snackbar.

The flow has exactly one schema definition per concern (validation, OpenAPI,
TypeScript type) — they're not duplicated across boundaries.

## Data model summary

The Prisma schema lives at `apps/api/db/schema.prisma`. The principal
entities:

- **`User`** — authenticated principal. Roles (`ADMIN`, `USER`),
  position role (`CHIEF`, `DEPUTY_CHIEF`), branch.
- **`FtsBranch`** — structural unit (central office or interregional
  inspection).
- **`FtsFunction`** — the registry entry itself. Carries name, category,
  complexity, periodicity, and competency-centre fields, all referencing
  `Type`.
- **`FtsFunctionDetail`** — ordered detail steps belonging to a function.
- **`FtsFunctionRelation`** — typed link between two functions
  (cross-references through detail steps).
- **`Type`** — a generic dictionary table used for every enum-like
  attribute, scoped by `Category`. One table, many vocabularies.
- **`ActionHistory`** — the audit log. Insert/update/delete events,
  user, timestamp, before/after JSON.

Enums declared at schema level (`UserRole`, `FtsPositionRole`,
`FtsFunctionRole`, `FtsBranchType`, `Category`, `ActionHistoryType`) are
mirrored on the frontend through `@registry/shared/enums` so the same
literal vocabulary lives on both sides.

## Cross-cutting concerns

### Internationalisation

The frontend uses `react-i18next` against typed key registries. The
`I18N` object in `apps/web/src/shared/i18n/keys` exposes nested constants
like `I18N.form.save` — autocompletion guarantees no missing keys, and
the type system catches typos. Locale JSON lives under
`shared/i18n/<locale>/<namespace>.json`. Russian is the only locale
shipped today, but the plumbing is locale-agnostic.

The backend, despite being single-language Russian, applies the same
discipline. Three `const`-as-`const` registries
(`SWAGGER_DESCRIPTION`, `ERROR_MESSAGE`, `LOG_MESSAGE`) under
`common/strings/` are the only place Russian text appears in source. This
keeps copy edits to one location and makes the per-string call sites
greppable.

### Errors

Exceptions are typed classes (e.g. `FtsFunctionNotFoundException`)
carrying a stable `ErrorCode` symbol declared in
`@registry/shared/errors/codes`. The global Nest exception filter maps
the code to an HTTP status and a JSON body containing the code, the
Russian message, and any structured detail. On the frontend,
`rtkErrorMiddleware` reads the code from the response, looks up the
localized message in the i18n registry, and dispatches a snackbar. The
result: error text never lives in two places.

### Pagination

Cursor-based, keyed on `(createdAt, id)`. The cursor is a base64url-encoded
JSON `{ createdAt, id }` opaque to clients. The shared primitive lives
under `apps/api/src/common/pagination` and is reused by every list
endpoint. Page size has a configurable max, enforced server-side.

### Type sharing

`packages/shared` is the single home for cross-boundary domain values:
error-code symbols, enum mirrors of Prisma enums, and reusable zod
validation schemas. Both apps consume it via `workspace:*`. There is
**no** runtime call from the frontend into backend code; the shared
package is types and tiny pure helpers only.

### Authentication

Not yet wired. The dependencies are present (`@nestjs/passport`,
`@nestjs/jwt`, `bcryptjs`) and `User` lives in the schema, but the
controllers don't yet enforce a guard and the frontend has no login
flow. The unblock plan is tracked in
[`known-limitations.md`](known-limitations.md#authentication--authorisation);
roadmap context lives in
[`refactor-journey.md`](refactor-journey.md#whats-next).

### Logging

`nestjs-pino` on the backend, with request-scoped child loggers and
structured JSON output. The frontend has no telemetry sink yet —
another roadmap item.

Audit events (`auth.*`, `admin.*`) land in the `audit_log` table via
`AuditService`. A nightly cron (`@nestjs/schedule`, 02:00 server time)
rotates rows older than 14 days into JSONL files in MinIO and deletes
them from the DB. Full design + env vars: see
[`audit-logging.md`](./audit-logging.md).

### Testing

- Backend unit tests: Jest, colocated `*.spec.ts`. The roughly
  several-dozen tests cover service layer logic and the cursor
  pagination primitives.
- Frontend e2e: Playwright, `apps/web/e2e/`. CRUD flow, detail rows,
  tree edges, error handling, resilience. See `apps/web/e2e/README.md`.
- Frontend unit/component tests: Vitest is wired but coverage is thin —
  another roadmap item.

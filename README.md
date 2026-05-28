# Registry of Tax-Control Functions

> Web application for the Russian Federal Tax Service (ФНС) registry of
> tax-control functions — a NestJS + React monorepo that maintains the
> catalogue, supports the audit workflow, and links related functions across
> detail steps.

[![build](https://img.shields.io/badge/build-pending-lightgrey)](#)
[![coverage](https://img.shields.io/badge/coverage-pending-lightgrey)](#)
[![license](https://img.shields.io/badge/license-internal-blue)](#license)
[![version](https://img.shields.io/badge/version-0.1-blue)](#)

> Badges above are placeholders. CI/CD wiring is on the roadmap; see
> [`docs/refactor-journey.md`](docs/refactor-journey.md#whats-next).

## Quickstart

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # then fill in DB credentials
pnpm --filter=@registry/api prisma migrate dev
pnpm dev:backend                          # in one terminal
pnpm dev:frontend                         # in another
```

Backend listens on `http://localhost:3000`, frontend on
`http://localhost:5173`. For a more verbose walkthrough see
[`docs/getting-started.md`](docs/getting-started.md).

## What it does

The Russian Federal Tax Service maintains a catalogue of around two hundred
tax-control functions — formal descriptions of the actions inspectors and
managers may take, structured by category, complexity, periodicity, and
competency centre. This application is the canonical registry for that
catalogue.

Authorised users (curators and managers, scoped by FTS branch) can browse,
search, and filter the registry; create or edit a function with its detail
steps; and link related functions to one another so cross-references stay
consistent as the catalogue evolves. Every change is auditable: the schema
records insert/update/delete history per row, and the UI surfaces it back
to reviewers.

The domain language is Russian throughout. The frontend is fully
internationalised against typed i18n keys (currently a single Russian
locale, with the door open for additional locales). The backend keeps its
Swagger descriptions, log messages, and exception messages in Russian via
`const`-as-`const` string registries — the same discipline applied to the
domain side.

A small but relevant detail: the deployment target is a shared internal host
where the app lives behind nginx at the URL prefix `/ck-functions/`. That
prefix flows through Vite's base path, RTK Query's base URL, and NestJS's
global prefix; see [Deployment](#deployment) below.

## Architecture at a glance

```
Frontend (apps/web)        ← Vite + React + MUI + RTK Query
     │ HTTPS
     ▼
Backend (apps/api)         ← NestJS + Fastify + Prisma
     │ SQL
     ▼
MariaDB                    ← FULLTEXT indexes + audit triggers
```

The frontend follows a feature-sliced layout (`app/`, `pages/`,
`components/`, `entities/<feature>/`, `shared/`). The backend groups
cross-cutting concerns under `common/` and one folder per domain module
under `module/`. Two workspace packages back both apps: `@registry/shared`
(typed cross-boundary contracts) and `@registry/eslint-plugin` (custom
lint rules). For the full picture see
[`docs/architecture.md`](docs/architecture.md).

## Pattern library

The codebase has a published pattern library — 33 code-smell classes
documented under [`docs/patterns.md`](docs/patterns.md). Each class has the
same shape: what it looks like, why it's wrong, how to find it, how to
fix it, how to prevent its return. Three of those classes are enforced
automatically via a custom ESLint plugin
(`@registry/eslint-plugin`,
[`packages/eslint-plugin-registry-functions/`](packages/eslint-plugin-registry-functions/));
three more are scaffolded for future enforcement. The remaining classes
are review-time lenses.

The patterns weren't written up-front — they were extracted from real
refactors. The narrative of how the codebase moved from a Replit-template
prototype to its current shape is told in
[`docs/refactor-journey.md`](docs/refactor-journey.md). That document is
the showcase for the engineering work this repository represents.

## Commands cheatsheet

| Command                | What it does                                |
| ---------------------- | ------------------------------------------- |
| `pnpm install`         | Install all workspaces                      |
| `pnpm dev:backend`     | NestJS in watch mode (`apps/api`)           |
| `pnpm dev:frontend`    | Vite dev server (`apps/web`)                |
| `pnpm build`           | Run `build` across all workspaces via Turbo |
| `pnpm test`            | Unit tests (Jest on backend)                |
| `pnpm test:e2e`        | Playwright e2e tests (`apps/web`)           |
| `pnpm lint`            | ESLint across all workspaces                |
| `pnpm lint:fix`        | ESLint with `--fix`                         |
| `pnpm turbo run check` | TypeScript typecheck (`tsc -b`) across all  |
| `pnpm check:all`       | Backend build + frontend `tsc -b`           |
| `pnpm test:all`        | Backend Jest + frontend Playwright          |

## Tech stack

| Backend (`apps/api`)          | Frontend (`apps/web`)               |
| ----------------------------- | ----------------------------------- |
| NestJS 11 (Fastify adapter)   | Vite 7 + React 18                   |
| Prisma 7 + MariaDB            | MUI 7 + `@mui/x-data-grid`          |
| `class-validator` + `zod`     | RTK Query (codegen from OpenAPI)    |
| `nestjs-pino` logging         | `react-i18next`                     |
| Jest                          | `react-hook-form` + `zod` resolvers |
| Swagger via `@nestjs/swagger` | Vitest + Playwright                 |

Shared: `@registry/shared` for cross-boundary types (error codes,
domain enums); `@registry/eslint-plugin` for custom lint rules; pnpm
workspaces with Turbo as the task graph.

## Deployment

Production deployment mounts the app behind nginx at the URL prefix
`/ck-functions/`. Frontend assets are served as static files; the API is
proxied to a local NestJS process. The full nginx snippet, deploy paths,
and reload procedure live in [`deploy/README.md`](deploy/README.md).

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system layout, layer
  boundaries, and where each cross-cutting concern lives.
- [`docs/getting-started.md`](docs/getting-started.md) — verbose
  bootstrap walkthrough.
- [`docs/patterns.md`](docs/patterns.md) — the 33-class pattern library.
- [`docs/refactor-journey.md`](docs/refactor-journey.md) — the narrative
  of how the codebase reached its current shape.
- [`docs/known-limitations.md`](docs/known-limitations.md) — features
  and edge cases that are not yet implemented, with the unblock plan
  for each. Source code intentionally contains zero `// TODO`
  comments; work items live in this document.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow, the worked
example of adding a feature, and the pre-commit hook setup. Every PR
should be reviewed through the lens of the
[pattern library](docs/patterns.md) — it's not optional reading.

## License

Internal — see organisation policy. The `@registry/api` package is marked
`UNLICENSED`; the `@registry/web` package retains the original `MIT`
header from its Replit-template ancestor and will be reconciled to the
internal policy.

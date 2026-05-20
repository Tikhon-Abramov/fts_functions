# Getting Started

A walkthrough for a contributor running this repository for the first
time. For a one-screen version, see the [Quickstart in the README](../README.md#quickstart).

## Prerequisites

- **Node.js** — version 20 or newer. The TS toolchain assumes ESM and
  modern lib versions; older Node will fail at install time.
- **pnpm** — version 10 or newer. The repository pins
  `pnpm@10.33.2` via `packageManager` in `package.json`. If you have
  `corepack` enabled, `corepack enable && corepack prepare pnpm@10.33.2 --activate`
  will install the right version automatically.
- **MariaDB** — version 10.5 or newer running locally (or reachable
  over the network). Prisma talks MySQL wire protocol; both MariaDB and
  MySQL work, but the schema relies on FULLTEXT indexes that match
  MariaDB's behaviour.
- **Git** — recent enough to run husky hooks (2.20+).

Optional but useful: `direnv` (for loading `apps/api/.env` automatically),
a MariaDB GUI such as DBeaver, and the official Playwright browsers
(installed lazily by `pnpm test:e2e`).

## Clone and install

```bash
git clone <repo-url> registry-functions
cd registry-functions
pnpm install
```

`pnpm install` installs every workspace's dependencies in one pass and
links `@registry/shared` and `@registry/eslint-plugin` into the apps.
The husky hooks are wired by the `prepare` script automatically.

## Database setup

Copy the example environment file and fill in your DB credentials:

```bash
cp apps/api/.env.example apps/api/.env
```

The relevant variables are `DATABASE_URL` (Prisma connection string) and
the application port. Run the migrations to bring an empty database up
to the current schema:

```bash
pnpm --filter=@registry/api prisma migrate dev
```

If a seed script is wired (check `apps/api/db/`), run it after the
migration. Otherwise the database starts empty and you create the first
records through the UI.

## Run

In two terminals:

```bash
# terminal 1
pnpm dev:backend     # NestJS in watch mode on :3000

# terminal 2
pnpm dev:frontend    # Vite dev server on :5173
```

The Vite dev server proxies `/api` and `/v1` to `http://localhost:3000`,
so the frontend works without any extra configuration. Swagger UI lives
at `http://localhost:3000/api/docs`.

## Run tests

```bash
pnpm test            # backend Jest unit tests
pnpm test:e2e        # frontend Playwright suite
pnpm test:all        # both, sequentially
```

The first Playwright run downloads the browsers (around 200 MB) — this
is one-time. The e2e suite expects the dev backend to be reachable; the
Playwright config can spin up a backend in CI mode, see
`apps/web/playwright.config.ts`.

## Lint and typecheck

```bash
pnpm turbo run check     # tsc -b across all workspaces
pnpm lint                # ESLint across all workspaces
pnpm lint:fix            # apply auto-fixes
```

`check` and `lint` run independently per workspace under Turbo's cache;
incremental runs are essentially free after the first invocation.

## Common gotchas

- **Port 3306 in use** — check whether you have a system MySQL daemon
  running. Either stop it or point `DATABASE_URL` at a different port
  (and pass that port to your MariaDB container).
- **Port 3000 in use** — the backend reads `PORT` from the environment;
  set it in `apps/api/.env` if 3000 is taken.
- **Port 5173 in use** — Vite picks the next free port automatically;
  the proxy works regardless.
- **Stale Prisma client** — after schema edits, run
  `pnpm --filter=@registry/api prisma generate` (or rerun
  `migrate dev`). The IDE will continue to show old types until the
  generator runs.
- **Hoisting issues with `pnpm`** — `.npmrc` configures the project's
  hoisting policy. If a package can't see a transitive dependency it
  expects, prefer adding the dependency directly to the workspace that
  uses it rather than fighting the resolver.
- **Husky hook didn't fire** — `pnpm install` runs `prepare` once; if
  hooks aren't installed, run `pnpm prepare` manually.
- **Cyrillic characters in source** — ESLint will block the commit. The
  text belongs in `apps/web/src/shared/i18n/` (frontend) or
  `apps/api/src/common/strings/` (backend). See [Class 1 in
  `patterns.md`](patterns.md#class-1--hardcoded-russian-ui-strings).

## Next steps

- Read [`patterns.md`](patterns.md) before opening your first PR.
- Skim [`architecture.md`](architecture.md) to know where things live.
- Read [`CONTRIBUTING.md`](../CONTRIBUTING.md) for the worked example
  of "add a new column to the registry table".

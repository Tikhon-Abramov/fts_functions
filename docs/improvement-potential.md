# Improvement Potential

External-benchmark audit, generated 2026-04-25 against HEAD `e822464`
("build: fix backend build + add @vitest/coverage-v8").

This document complements `docs/quality-scorecard.md` (the internal audit) by asking the
inverse question: **what should this project have that it doesn't?** It surveys peer
projects on the dev server (`/home/Kristy/Develop/FromServer/dev/`) for adoptable
patterns we are missing, and cross-references current 2025/2026 best practice for the
exact stack we run (NestJS 11 + Fastify 5 + Prisma 7 backend; Vite + React 18 + MUI 7
frontend; pnpm 10 + Turbo 2 monorepo).

---

## TL;DR

The codebase is internally clean (89/100, 92 with the build fix). Looking outward, the
recurring gap is **operational maturity, not source quality**: there is no CI pipeline
checked into the repo, no health endpoint, no production process supervisor, no
container build, and no observability beyond `nestjs-pino` log lines. Two peer projects
on the same dev box (`agario`, `dataflow`) have all of these — and `dataflow` in
particular has a CI workflow that closely mirrors the structure we would want.

The second recurring gap is **automated dead-code / dependency hygiene**. The internal
scorecard already flags this honestly ("knip not installed", "depcheck not installed");
2026 best practice has consolidated on `knip` for both jobs, and `dependency-cruiser`
for module-boundary enforcement to complement our existing
`eslint-plugin-boundaries` rules.

Top three ROI items, in priority order: (1) ship a `.github/workflows/ci.yml` that
runs `pnpm turbo run build lint check test` on every push (mirror `dataflow/.github/workflows/ci.yml`);
(2) add a NestJS health controller + a systemd unit + a deploy script (mirror
`agario/deploy/systemd/cellwar.service` and `vpd-simple-table/build-deploy.sh`); (3)
install `knip` at the root and wire it into `lint-staged` / CI to close the dead-code
audit gap honestly. None of these is a refactor — they're additive, low-risk, and each
is an evening or two of work.

---

## Section 1 — What other internal projects do that we don't

Reference projects surveyed (and accessible) under `/home/Kristy/Develop/FromServer/dev/`:

- `agario` (Go backend + React/TS/Vite frontend, monorepo)
- `dataflow` (NestJS + Prisma + pnpm + Turbo monorepo — closest stack peer)
- `vpd-simple-table` (NestJS + Vite single-app)
- `edgeforge` (Swift + React, Docker-heavy)

Spot-checked but lower-signal for our stack: `digdig`, `diepio`, `frontiers`,
`intro-page`, `premium-fitnes-center`, `pva/sbz/simple-tables-crm` (all simpler
single-app shapes), `fts-ck-tno*` (sibling pre-fork variants of this project).

### 1.1 — `dataflow` (closest peer; NestJS + Prisma + pnpm + Turbo)

Patterns observed that we don't have:

- **CI workflow** — `/home/Kristy/Develop/FromServer/dev/dataflow/.github/workflows/ci.yml`
  defines six jobs: `lint`, `test-frontend`, `test-backend`, `test-sdks`, `build`, `e2e`.
  Uses `concurrency: cancel-in-progress`, pins `NODE_VERSION` and `PNPM_VERSION` env
  vars, uploads the `apps/web/dist` artifact for the e2e job to consume, uploads the
  Playwright HTML report on failure. Minor thing to copy: `cache: pnpm` on
  `actions/setup-node@v4`. **ROI: HIGH.**
- **Auth pattern** — `apps/api/src/auth/auth.service.ts` implements full JWT + refresh
  rotation with a `TokenBlacklistService`, audit logging, bcrypt @ 12 rounds, and a
  `Public()` decorator pattern for opting routes out of the global guard. Our
  `apps/api/src` has no `auth/` module. We don't currently need it (the app is
  internal and runs behind nginx), but the pattern is the reference if we ever do.
  **ROI: LOW** for current scope, **HIGH** if user-level auth is added.
- **Health endpoint** — `apps/api/src/health/health.controller.ts` exports
  `GET /health` returning `{ status, timestamp, uptime }` with `@ApiTags('Health')`
  and `@Public()`. Trivial to copy; required for any sane reverse-proxy / load-balancer
  / uptime-monitor setup. **ROI: HIGH** (15 min of work).
- **Prisma seed** — `apps/api/prisma/seed.ts` with `prisma migrate seed` config.
  Useful to standardize local-dev bootstrapping. **ROI: MEDIUM.**
- **Audit module** — `apps/api/src/audit/` writes structured audit rows for
  `user.login`, `user.logout`, etc. We have no equivalent; for an internal registry
  app this is at least a "could be helpful" item. **ROI: MEDIUM.**
- **systemd unit (in `scripts/`, not `deploy/`)** — `dataflow-api.service`,
  `dataflow-worker.service`, `dataflow-ai-bridge.service` show the exact env-file +
  WorkingDirectory pattern. **ROI: HIGH** (we have a nginx config but no process
  supervisor file).

### 1.2 — `agario` (different language but mature ops)

- **CI workflow** — `agario/.github/workflows/ci.yml` is simpler than dataflow's but
  still better than nothing: `backend` (Go build/test/vet) + `frontend` (npm ci /
  build / vitest / eslint with `--max-warnings=9999` cap). The cap is a tell — they
  use it as a ratcheting tool. **ROI: medium reference value, low direct copy
  (different stack).**
- **Docker bundle** — `deploy/docker/{backend,frontend}.Dockerfile` + `docker-compose.yml`.
  Multi-stage (`golang:1.22-alpine` builder → `alpine:3.19` runtime, `-ldflags="-s -w"`).
  We have a static-asset deploy that targets nginx + a hand-run `node dist/main.js`;
  containerizing would simplify reproducible deploys but is a bigger lift. **ROI: MEDIUM.**
- **systemd hardening** — `deploy/systemd/cellwar.service` includes
  `NoNewPrivileges=true`, `ProtectSystem=strict`, `ReadWritePaths=...`, `PrivateTmp=true`,
  `LimitNOFILE=65536`, `MemoryMax=512M`. These are best-practice security knobs we'd
  inherit if we adopt a unit file. **ROI: HIGH** (free with the systemd item).
- **Docs structure** — `docs/architecture/`, `docs/audits/`, `docs/game/`, `docs/guides/`
  with named files like `adr.md`, `system-overview.md`, `database-schema.md`. We have a
  flat `docs/` with five files. Sub-foldering is overkill for our doc count today, but
  the **ADR (Architecture Decision Record)** pattern is the high-value piece — we have
  no ADRs at all and several decisions in `refactor-journey.md` would have been better
  as discrete ADRs. **ROI: MEDIUM** (write 3-5 ADRs in `docs/adr/`).
- **`scripts/loc.sh` / `scripts/coverage.sh`** — small helper scripts for repeated audit
  tasks. We've been ad-hoc invoking these manually. **ROI: LOW** (nice-to-have).
- **`docs/audits/security-audit.md`, `performance-frontend.md`, `test-plan.md`** — they
  keep audit artefacts alongside the code. We've started doing this in
  `docs/audits/` and `docs/quality-scorecard.md`; the gap is a **standing test plan**
  document. **ROI: LOW–MEDIUM.**

### 1.3 — `vpd-simple-table` (build-deploy bundle pattern)

- **`build-deploy.sh`** — a single bash script that runs Prisma generate (with
  `binaryTargets = ["native", "windows"]` for cross-platform), copies frontend
  build, packages a `deploy.zip`. Our deploy story is "read `deploy/README.md` and
  type the commands by hand"; a script is strictly better. **ROI: HIGH.**
- **`docker-compose.yml`** — declares mysql, redis, minio for local dev. Useful
  template even though we use MariaDB and don't need redis/minio yet. **ROI: MEDIUM**
  (we currently rely on the user having MariaDB pre-installed).
- **Prisma multi-schema setup** — they generate `service-client` and
  `integration-client` from two separate schemas. Not directly applicable but the
  barrel `index.ts` shim for Prisma 6+ ("no longer auto-generated") is a footgun
  worth knowing about; we are on Prisma 7 and may hit the same thing. **ROI: LOW**
  (just be aware).

### 1.4 — `edgeforge` (Docker-first; less directly applicable)

- Multi-stage Dockerfile combining Swift backend + Node-built React dashboard in one
  image. Pattern not relevant because our stack is uniformly Node, but the principle
  ("dashboard built into the same artefact as the API") is worth filing if we ever
  collapse `apps/web` and `apps/api` into a single deployable. **ROI: LOW.**
- `deploy/edgeforge.service`, `deploy/nginx-edgeforge.conf`, `deploy/deploy.sh` — same
  three-file pattern as `agario`. Reinforces the "service file + nginx + script"
  trio as the project standard. **ROI: HIGH** (already counted under 1.1/1.2).

---

## Section 2 — 2026 industry practices we haven't adopted

### 2.1 — Observability: OpenTelemetry first-class

We have `nestjs-pino` for structured logs. We do not have traces or metrics.

Current best practice for NestJS + Fastify + Prisma in 2026 is a 3-piece OTel setup:
(a) initialize the Node OTel SDK **before** Nest boots (`tracer.ts` imported in the
first line of `main.ts`); (b) enable Prisma's tracing preview feature + use
`@prisma/instrumentation` ≥ 5.0; (c) export OTLP to a collector. The community module
`pragmaticivan/nestjs-otel` wraps (a)–(b) as a NestModule. Sources:
[SigNoz NestJS OpenTelemetry guide](https://signoz.io/blog/opentelemetry-nestjs/),
[Prisma docs — OpenTelemetry tracing](https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/opentelemetry-tracing),
[OneUptime Fastify + OTel guide (2026-02-06)](https://oneuptime.com/blog/post/2026-02-06-monitor-fastify-applications-opentelemetry/view).

What we'd gain: per-request traces with Prisma queries inline; ability to ship to a
free-tier collector (SigNoz cloud, Grafana Cloud free tier, or self-hosted). What we'd
lose: nothing (OTel is no-op without a collector). **ROI: MEDIUM** for an internal
tool — high if traffic ever exceeds "a handful of users".

Sentry is the lighter alternative — single SDK, error-only, no tracing infra to run.
We have neither.

### 2.2 — Turborepo remote caching

We have `turbo.json` with local cache only. Two-line change to opt into either Vercel's
remote cache or a self-hosted alternative. For a solo / small-team internal project
the win is small (cache hit rate is dominated by your own re-runs), but for CI it's
substantial: in CI you start from a cold cache every job. Adding the GitHub Actions
[Caching for Turborepo](https://github.com/marketplace/actions/caching-for-turborepo)
action wires the GH Actions built-in cache as Turbo's remote without needing a Vercel
account. Sources:
[Turborepo CI vendors — GitHub Actions](https://turborepo.dev/docs/guides/ci-vendors/github-actions),
[Mercari engineering — remote cache results](https://engineering.mercari.com/en/blog/entry/20260216-turborepo-remote-cache-accelerating-ci-to-move-fast/)
(reports ~50% Turbo task duration reduction). **ROI: MEDIUM** (only matters once we have CI).

### 2.3 — Bundle analysis + perf budgets

Web bundle is 1.2 MB per the scorecard. We do not measure it in CI. Common 2025/2026
practice: `rollup-plugin-visualizer` for one-shot analysis, `size-limit` for
budget-failing in CI, Lighthouse CI for cross-cutting perf scores. MUI specifically
needs named imports for tree-shaking; worth a quick audit. Sources:
[Reducing Bundle Size for React and MUI using Tree Shaking](https://medium.com/@sargun.kohli152/reducing-bundle-size-for-react-and-mui-using-tree-shaking-a-comprehensive-guide-f4bd709bc0c3),
[bundle-stats (Vite/Rollup support)](https://github.com/relative-ci/bundle-stats).
**ROI: LOW–MEDIUM** for an internal tool (users tolerate slower first paint), HIGH
if user-perceived perf becomes a complaint.

### 2.4 — Type sharing: zod-prisma-types / prisma-zod-generator

We currently generate RTK Query types from OpenAPI (`@rtk-query/codegen-openapi`) and
generate Prisma classes via `prisma-class-generator`. We do **not** auto-generate Zod
schemas from the Prisma schema. We hand-write Zod schemas in `apps/api/src/common/schemas/`
and lose type-safety guarantees the moment the schema drifts.

`zod-prisma-types` (chrishoermann) is the historical pick but is in maintenance
mode; `prisma-zod-generator` (omar-dulaimi) is the 2026 active replacement. Sources:
[zod-prisma-types](https://github.com/chrishoermann/zod-prisma-types),
[Maintenance note from search results — recommendation toward prisma-zod-generator].
**ROI: MEDIUM** — eliminates a real drift surface but adds a generator step.

### 2.5 — Storybook + automated a11y

We have zero `jsx-a11y/*` warnings, which is great, but linting only catches static
issues. Runtime a11y assertions via `@storybook/addon-a11y` (axe-core under the hood)
catch contrast, ARIA-state, focus-trap, keyboard-nav issues that ESLint can't see.
Note: `@chanzuckerberg/axe-storybook-testing` archives 2026-01-05; the replacement is
the Storybook 8 built-in test runner with a11y. Sources:
[Storybook accessibility tests](https://storybook.js.org/docs/writing-tests/accessibility-testing),
[axe-storybook-testing archive notice](https://github.com/chanzuckerberg/axe-storybook-testing).

We don't currently have Storybook at all. For an internal tool with one main page
(`home.tsx`) Storybook is plausibly overkill — a smaller win is calling axe-core
directly from a Vitest / Playwright test, which costs ~1 day and gives 80% of the
value. **ROI: LOW–MEDIUM.**

### 2.6 — Knip for unused-code / dependency audits

The scorecard candidly notes "knip not installed", "depcheck not installed". 2026
consolidated practice: knip subsumes depcheck and additionally finds unused exports,
unused files, and unused dependencies in one pass. Has first-class NestJS support
(understands controllers, services, decorators). Sources:
[Knip vs depcheck (2026)](https://www.pkgpulse.com/blog/knip-vs-depcheck-2026),
[Knip overview](https://knip.dev/overview/getting-started),
[Knip FAQ — NestJS support](https://knip.dev/reference/faq).
**ROI: HIGH** (single tool closes two scorecard gaps, hour or two to install + tune).

### 2.7 — dependency-cruiser to enforce architectural boundaries

We use `eslint-plugin-boundaries` for FSD-layer enforcement on the web side. That's
fine but linting, not architectural assertion. `dependency-cruiser` produces graphs

- machine-readable rule violations and is conventional in larger NestJS shops.
  Source:
  [dependency-cruiser](https://github.com/sverweij/dependency-cruiser).
  **ROI: LOW** — duplicates plugin we already have, only worth it if we want CI-failing
  graphs as artefacts.

### 2.8 — Drizzle migration (don't)

Common 2026 question: should we move from Prisma to Drizzle? Sources are split, but
the consensus for a NestJS app already on Prisma 7 (which dropped the Rust query
engine and is now pure TS, narrowing the perf gap substantially) is **stay on Prisma
unless you have a specific reason**. Sources:
[Prisma vs Drizzle 2026 (DEV)](https://dev.to/jake_kim_bd3065a6816799db/prisma-vs-drizzle-orm-2026-which-typescript-orm-should-you-use-2j15),
[Drizzle vs Prisma — Encore](https://encore.dev/articles/drizzle-vs-prisma).
**ROI: NEGATIVE** for our use case (see "What's not worth pursuing").

### 2.9 — Edge / RSC / partial pre-rendering

Trendy in 2025/2026 for public-facing sites. Not applicable to an internal
SPA dashboard mounted at `/ck-functions/`. **ROI: NEGATIVE** for our context.

---

## Section 3 — Top 7 prioritized investments

Ranked by `(impact × ease) / cost`. Scored against the scorecard's 89/100 baseline.

### 1. `.github/workflows/ci.yml` — automate the audit on every push

**Status**: ✅ shipped at `f1ca948` (CI) + `e6b2da2` (deploy.yml).

- **Current state**: zero CI; quality is enforced by lint-staged + manual `pnpm turbo run`.
- **Proposed state**: a CI workflow with `lint`, `check`, `test`, `build` jobs running
  on push and PR, plus an artefact upload of `apps/web/dist`.
- **Why this codebase benefits specifically**: the scorecard relies on "run these
  commands locally and trust the output"; CI removes that trust requirement. Mirror
  `/home/Kristy/Develop/FromServer/dev/dataflow/.github/workflows/ci.yml` directly.
- **Effort**: half a day (template exists; only divergence is task names).
- **Score lift**: +2 (fills a structural hole; without CI a 95+ is not credible).

### 2. Health endpoint + systemd unit + deploy script

**Status**: ✅ shipped at `0b31f98` (health), `a8a70bf` (cats Linux deploy + systemd), `0158afb` (fts-server Windows deploy via nssm).

- **Current state**: `deploy/nginx/` + a hand-written `deploy/README.md` checklist.
  No process supervisor, no health check, no reproducible build script.
- **Proposed state**: `apps/api/src/module/health/health.controller.ts` returning
  `{ status, uptime }`; `deploy/systemd/registry-functions.service` with hardening
  knobs (`NoNewPrivileges`, `ProtectSystem=strict`, `MemoryMax=512M`); a
  `deploy/build-deploy.sh` script that runs Prisma generate → backend build →
  frontend build → assembles a deploy bundle.
- **Why this codebase benefits specifically**: production deployment today depends
  on the operator manually executing the README. Three small files lift the project
  from "deployable by author" to "deployable by anyone with sudo".
- **Effort**: 1 day. Templates: `agario/deploy/systemd/cellwar.service`,
  `dataflow/scripts/dataflow-api.service`, `vpd-simple-table/build-deploy.sh`.
- **Score lift**: +2 (production-readiness is dimension 10 in the scorecard).

### 3. Install `knip` and run it in CI

**Status**: ✅ shipped at `1ece577`. Wired into `ci.yml` as a job; `knip.json` configured at root.

- **Current state**: scorecard items 6 ("Dead code") and 8 ("Dependency hygiene") are
  honest "OK — tool not installed".
- **Proposed state**: `knip.json` at the root, `pnpm knip` step in CI, `knip --fix`
  optional in `lint:fix`. Matching `dependencies` arrays to actual usage; flagging
  orphan exports; finding unused files.
- **Why this codebase benefits specifically**: closes two scorecard "OK" gaps with
  one tool. The codebase has had several refactor waves (post-R2 residuals,
  components-folder reshape, enum migrations) — exactly the kind of churn that leaves
  orphan exports.
- **Effort**: 2-4 hours including initial allowlist tuning.
- **Score lift**: +1 (turns two OKs into PASSes).

### 4. Web-side test coverage thresholds + a couple of integration tests

**Status**: ⚠️ partial — coverage thresholds wired in `vitest.config.ts` at `00f0e64`. Integration tests (data-grid happy path, form submit happy path) NOT yet written.

- **Current state**: 3 web suites / 10 tests; coverage tool just installed (this HEAD)
  but no thresholds wired and no integration-shape test (Playwright config exists in
  `dataflow` not here).
- **Proposed state**: `vitest.config.ts` `coverage.thresholds` set at conservative
  numbers (e.g. `lines: 30, functions: 30, branches: 30`) so regression breaks the
  build; one or two RTL tests covering the `home.tsx` data-grid happy path and one
  form submit happy path.
- **Why this codebase benefits specifically**: the web side is the user-facing
  surface; ten tests against ~120 web `.tsx` files is the weakest cell of an
  otherwise solid scorecard. Cheap to lift.
- **Effort**: 1 day (including learning the existing component shapes).
- **Score lift**: +2 (improves dimension 11).

### 5. ADR folder + write 3-5 retrospective ADRs

- **Current state**: rich `refactor-journey.md` but no ADR-shaped documents.
- **Proposed state**: `docs/adr/` with ADRs for: (1) "Why FSD on web", (2) "Why RTK
  Query codegen over manual fetchers", (3) "Why Pino not Winston", (4) "Why MariaDB
  via Prisma adapter not native", (5) "Why pattern-class registry instead of free-form
  reviews".
- **Why this codebase benefits specifically**: the codebase made several distinctive
  choices (the `eslint-plugin-registry-functions` custom rules, the pattern-class
  registry in `docs/patterns.md`) that future maintainers will second-guess without
  written rationale. Mirror `agario/docs/architecture/adr.md` style.
- **Effort**: half a day.
- **Score lift**: +1 (improves dimension 9).

### 6. Bundle visualizer + `size-limit` budget

**Status**: ⚠️ partial — `rollup-plugin-visualizer` wired into `apps/web/vite.config.ts` at `00f0e64`; `dist/stats.html` produced on each build. `size-limit` budget NOT set (needs real measurement first).

- **Current state**: 1.2 MB bundle, not measured in CI.
- **Proposed state**: `rollup-plugin-visualizer` writing `dist/stats.html`; `size-limit`
  config with a budget at the current size + 10%; CI fails if exceeded; periodic
  audit of MUI named-imports.
- **Why this codebase benefits specifically**: MUI 7 + MUI X DataGrid + Radix UI +
  Framer Motion + Recharts + Embla + Lucide is a heavy dep tree; we will accumulate
  weight without a budget.
- **Effort**: 2-3 hours.
- **Score lift**: +1 (precondition for any later perf work; doesn't move the
  scorecard much by itself).

### 7. Sentry (or equivalent error sink) wired into both apps

- **Current state**: `nestjs-pino` logs to stdout; no error sink with stack-trace
  aggregation. A frontend exception in production is invisible to the team.
- **Proposed state**: `@sentry/nestjs` in `apps/api` (or just OTel + a free-tier
  collector if going that route), `@sentry/react` in `apps/web`, gated behind a
  `SENTRY_DSN` env var so dev mode is silent.
- **Why this codebase benefits specifically**: this is an internal data-entry
  app — when a user hits a 500, today the only artefact is whatever they remember
  to screenshot. An error sink turns that into a structured bug report.
- **Effort**: 4-6 hours (two SDKs, one DSN, env wiring).
- **Score lift**: +1 (improves operational dimension; doesn't appear directly in the
  current scorecard but should).

**Cumulative ceiling**: 89 (current) + 10 (sum of lifts) - some double-counting ≈ 95.
Items 1–4 alone get to ~94 and are all mechanical.

---

## What's not worth pursuing right now

- **Migration to Drizzle ORM.** Prisma 7 dropped the Rust engine and the perf gap is
  small. Migrating tens of `.prisma` calls to Drizzle SQL builder buys nothing
  concrete and breaks the scorecard's stable codegen pipeline. Source:
  [Prisma 7 architecture change](https://encore.dev/articles/drizzle-vs-prisma).
- **Server components / partial pre-rendering / edge deploy.** This is an internal
  SPA dashboard mounted on a single nginx host. The benefits (CDN proximity,
  server-rendered first paint) are user-facing and irrelevant to a logged-in admin
  audience.
- **Storybook adoption.** With one principal page (`home.tsx`) and tightly-scoped
  component library, Storybook adds infra weight (build, deploy, addons) that exceeds
  the value. A handful of axe-core checks called from Vitest captures 80% of the
  a11y testing value at 5% of the cost.
- **Switching from Vite to Rspack.** Vite 7 with Rollup/Rolldown is fine for our
  size; Rspack's Webpack-API compatibility is a benefit only for projects migrating
  off Webpack.
- **Switching from Jest to Vitest in `apps/api`.** The api uses Jest 30 + ts-jest
  successfully and the `nest test` integration is mature. No real upside.
- **Adopting class-validator more aggressively.** We use Zod via `@anatine/zod-nestjs`
  with OpenAPI generation downstream — rebuilding around `class-validator` would lose
  the single-source-of-truth property of the Zod schemas.
- **changesets / semantic-release.** Not a published library; private monorepo;
  versioning is decorative.

---

## Done

Items shipped 2026-04-25 in the CI/CD + deployment-readiness wave:

- **#1 — `.github/workflows/ci.yml`**. Six-job CI (`lint`, `typecheck`,
  `test-api` with MariaDB service container, `test-web`, `knip`, `build`).
  Concurrency cancels in-progress runs on the same ref. See
  `.github/workflows/ci.yml`.
- **#2 — Health endpoint + systemd unit + deploy scripts.** `GET /v1/health`
  at `apps/api/src/module/health/`; systemd unit at
  `deploy/systemd/registry-api.service` with hardening
  (`NoNewPrivileges`, `ProtectSystem=strict`, `MemoryMax=1G`); two deploy
  scripts (`deploy/scripts/deploy-cats.sh` for Linux/systemd,
  `deploy/scripts/deploy-fts-server.sh` for Windows/nssm mirroring the
  miudol-tables `deploy.sh` conventions). Companion CI workflow at
  `.github/workflows/deploy.yml` (workflow_dispatch with target choice +
  tag-push trigger; gated through GitHub Environment `production` with
  required reviewers). See `deploy/README.md`.
- **#3 — `knip` dead-code/dependency audit.** Installed at the root, wired
  into CI, configured via `knip.json` (warn on unused exports/types so the
  build stays green while findings remain visible).
- **#4 — Web coverage thresholds.** `apps/web/vitest.config.ts`
  `coverage.thresholds` now floored at the currently-achieved values
  (lines 1, branches 0.5, functions 1.5, statements 1) so regression breaks
  the build. (Adding RTL tests to lift the floor remains future work; the
  threshold mechanism itself is shipped.)
- **#6 — Bundle visualizer.** `rollup-plugin-visualizer` wired into
  `apps/web/vite.config.ts` as a build-only plugin; emits
  `apps/web/dist/stats.html`. (`size-limit` deliberately deferred — it
  needs a real budget set after the first measurement.)

Items still open from the Top 7: #5 (ADR folder), #7 (Sentry / error sink).

---

## How to use this document

Review every 6 months alongside `docs/quality-scorecard.md`. Items in Section 3 should
age into one of two states: **shipped** (move to a `## Done` section at the bottom of
this file with the commit hash) or **no longer relevant** (move to "What's not worth
pursuing" with a one-line reason). Don't let items linger un-revisited — stale
"high-priority" lists rot the document's authority.

---

## Sources cited

- SigNoz — [OpenTelemetry NestJS guide (2026)](https://signoz.io/blog/opentelemetry-nestjs/)
- Prisma docs — [OpenTelemetry tracing](https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/opentelemetry-tracing)
- OneUptime — [Fastify + OTel (2026-02-06)](https://oneuptime.com/blog/post/2026-02-06-monitor-fastify-applications-opentelemetry/view)
- pragmaticivan — [nestjs-otel](https://github.com/pragmaticivan/nestjs-otel)
- Turborepo — [GitHub Actions guide](https://turborepo.dev/docs/guides/ci-vendors/github-actions)
- GitHub Marketplace — [Caching for Turborepo](https://github.com/marketplace/actions/caching-for-turborepo)
- Mercari Engineering — [Turborepo Remote Cache results (2026-02)](https://engineering.mercari.com/en/blog/entry/20260216-turborepo-remote-cache-accelerating-ci-to-move-fast/)
- WarpBuild — [Monorepo CI guide](https://www.warpbuild.com/blog/github-actions-monorepo-guide)
- Sargun Kohli — [MUI tree-shaking](https://medium.com/@sargun.kohli152/reducing-bundle-size-for-react-and-mui-using-tree-shaking-a-comprehensive-guide-f4bd709bc0c3)
- relative-ci — [bundle-stats](https://github.com/relative-ci/bundle-stats)
- chrishoermann — [zod-prisma-types](https://github.com/chrishoermann/zod-prisma-types)
- Storybook docs — [Accessibility tests](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- chanzuckerberg — [axe-storybook-testing (archived 2026-01-05)](https://github.com/chanzuckerberg/axe-storybook-testing)
- PkgPulse — [Knip vs depcheck 2026](https://www.pkgpulse.com/blog/knip-vs-depcheck-2026)
- Knip docs — [Getting started](https://knip.dev/overview/getting-started), [FAQ](https://knip.dev/reference/faq)
- sverweij — [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- Encore — [Drizzle vs Prisma 2026](https://encore.dev/articles/drizzle-vs-prisma)
- DEV — [Prisma vs Drizzle 2026](https://dev.to/jake_kim_bd3065a6816799db/prisma-vs-drizzle-orm-2026-which-typescript-orm-should-you-use-2j15)

Internal references (file paths, no URLs):

- `/home/Kristy/Develop/FromServer/dev/dataflow/.github/workflows/ci.yml`
- `/home/Kristy/Develop/FromServer/dev/dataflow/scripts/dataflow-api.service`
- `/home/Kristy/Develop/FromServer/dev/dataflow/apps/api/src/health/health.controller.ts`
- `/home/Kristy/Develop/FromServer/dev/dataflow/apps/api/src/auth/auth.service.ts`
- `/home/Kristy/Develop/FromServer/dev/dataflow/apps/api/prisma/seed.ts`
- `/home/Kristy/Develop/FromServer/dev/agario/.github/workflows/ci.yml`
- `/home/Kristy/Develop/FromServer/dev/agario/deploy/systemd/cellwar.service`
- `/home/Kristy/Develop/FromServer/dev/agario/deploy/docker/{backend,frontend}.Dockerfile`
- `/home/Kristy/Develop/FromServer/dev/agario/docs/architecture/adr.md`
- `/home/Kristy/Develop/FromServer/dev/vpd-simple-table/build-deploy.sh`
- `/home/Kristy/Develop/FromServer/dev/vpd-simple-table/docker-compose.yml`
- `/home/Kristy/Develop/FromServer/dev/edgeforge/deploy/edgeforge.service`

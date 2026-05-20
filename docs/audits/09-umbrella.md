# Audit 09 — Umbrella (cross-dimensional, comprehensive)

> The catch-all audit covering: Architecture & boundaries, Type system, Error handling, Schema & data model, Naming, Comments, Testing (light — full version in 05), Build/CI (light — full in 07), Configuration, Performance (light — full in 08), Security, Observability, Cross-package deps, DX/onboarding.

## Executive summary

`registry-functions` is a well-structured NestJS + React monorepo for a Russian Federal Tax Service internal catalogue. Clear signs of intentional architectural investment (typed selects, batch validation, compile-time enum contracts, custom ESLint rules). **Three systemic problems**:

1. **The FTS-NO-AUTH branch is a frozen production branch, not a feature branch** — dead auth code is imported, compiled, and shipped on every deploy without protecting anything.
2. **The service layer uses `as unknown as Record<string, ...>` casts pervasively** to work around a design gap where DTOs and Prisma inputs share no common base type.
3. **`ConstantService.updateUser`/`deleteUser` makes two DB round-trips** to check soft-delete status where one suffices, while admin write mutations were "RolesGuard-protected" by a guard that's commented out (clarification: **per user direction this is by design** — admin endpoints are intentionally accessible on internal-only FTS deploy via maintenance panel; doc-only fix needed).

**Single biggest leverage point**: encode the no-auth profile as a real branch/profile rather than commented-out code, then either delete `RolesGuard` decorators (intentionally-no-auth) or restore the wiring. These two fixes unblock real signal and remove the largest cognitive load from every future reader.

---

## Findings table

### Dimension 1 — Architecture & boundaries

| Sev             | File:line                                              | Problem                                                                                                                                                                                                     | Fix                                                                                                  |
| --------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Critical        | `apps/api/src/module/constant/constant.service.ts:21`  | `import { Category } from '@prisma/client'` (bare package) instead of `@prisma-client` alias — bypasses generated adapter client                                                                            | Change to `import { Category } from '@prisma-client'`                                                |
| **Doc-only** ⚠️ | `apps/api/src/module/constant/constant.module.ts:1-13` | `AuthModule`/`RolesGuard` stripped; controller still has `@Roles(UserRole.ADMIN)` decorators that resolve to nothing. **Per user: this is intentional for FTS internal-only deploy via maintenance panel.** | Delete the now-meaningless `@Roles` decorators + add `docs/deployment-profile.md` documenting design |
| High            | `apps/api/src/app.module.ts:14-18, 24-25`              | `JwtAuthGuard` and `ProfileModule` `import`-ed and suppressed with `// eslint-disable-next-line @typescript-eslint/no-unused-vars` — dead code in every prod build                                          | Remove imports entirely; keep only on a separate non-FTS branch                                      |
| High            | `apps/api/src/common/audit/audit.module.ts:1`          | `AuditModule` imports `PrismaModule` directly — common-to-module dependency where common should own no module imports                                                                                       | Use `@InjectPrismaService` token or expose globally                                                  |
| Medium          | `apps/api/src/common/audit/audit.service.ts:17-29`     | `AuditEvent` union lists `auth.*` events but `AuthModule` is disabled — dead enum codes                                                                                                                     | Remove auth events or move into `AuthModule` scope                                                   |

### Dimension 2 — Type system rigor

(Full audit in `06-type-rigor.md`. Highlights:)

| Sev    | File:line                                    | Problem                                                                                                                | Fix                                                      |
| ------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| High   | `fts-function.service.ts:155, 183, 218, 245` | `dto as unknown as Record<string, number \| undefined>` × 4                                                            | Define `FtsFunctionWriteInput` shared base; remove casts |
| High   | `constant.service.ts:223`                    | `stripUndefined(dto as Record<string, unknown>)` — `UserUpdateDto` erased, `passwordHash` injected through untyped bag | Model as `UserUpdatePrismaInput`                         |
| Medium | `fts-function.service.ts:129`                | `(last.updatedAt as Date \| undefined)` — entity type diverged from Prisma payload                                     | Fix entity type to match select                          |
| Medium | `audit.service.ts:73`                        | `(data as { metadata?: object }).metadata = ctx.metadata` — cast to add unmodeled property                             | Use `Prisma.AuditLogCreateInput` directly                |
| Medium | `minio.service.ts:77, 145`                   | `err as { $metadata?: ...; name?: string }` repeated                                                                   | Define `S3ErrorShape` + type guard                       |
| Medium | `fts-function.service.ts:421`                | `idFilter['in'] = query.ids` — `Record<string, unknown>` suppresses Prisma type checks                                 | Use `Prisma.IntFilter`                                   |
| Low    | `apps/api/tsconfig.json:19`                  | `"noImplicitAny": false` overrides `strict: true` from base                                                            | Remove override                                          |

### Dimension 3 — Error handling & failure modes

| Sev      | File:line                           | Problem                                                                                                                                             | Fix                                                                  |
| -------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Critical | `constant.service.ts:221`           | `updateUser` calls `findUnique` then `isSoftDeleted(id)` — two round-trips reading same row; race window                                            | Merge: read `{isDeleted: true}` in first findUnique; check in-memory |
| High     | `fts-function.service.ts:154-176`   | `ensureFtsFunctionNameAvailable` runs before `create`; can race with concurrent create — adds useless extra query on hot path                       | Remove pre-check; rely on P2002 mapper                               |
| High     | `apps/api/src/main.ts:112-115`      | `setupSql` (trigger mounting) catches all errors with `console.warn` — if triggers fail to mount, category constraints silently disappear           | Re-throw; fail fast on boot                                          |
| High     | `audit-rotation.service.ts:133-151` | `findRows` paginates; final DELETE uses `{where: {createdAt: {lt: cutoff}}}` — rows inserted between fetch and delete are deleted without archiving | Serializable transaction OR delete-by-ID list                        |
| Medium   | `audit.service.ts:64-79`            | `write` swallows DB errors with `logger.warn` — acceptable by design for audit, but caller `await`s without handling                                | Document explicitly or add metrics counter                           |
| Medium   | `email.service.ts:56-70`            | Double-nested try/catch with inner `catch { mod = null }` swallowing module-load errors silently                                                    | Flatten to single try/catch                                          |
| Low      | `health.controller.ts:52`           | `$queryRawUnsafe('SELECT 1')` — timeout race doesn't cancel DB query                                                                                | Use Prisma timeout or `AbortController`                              |

### Dimension 4 — Schema & data model

| Sev    | File:line                | Problem                                                                                                                                                             | Fix                                           |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| High   | `schema.prisma:335-393`  | `FtsFunction` no `@@index([ftsFunctionNameId])` — queried by `ensureFtsFunctionNameAvailable` on every create/update                                                | Add `@@index([ftsFunctionNameId, isDeleted])` |
| High   | `schema.prisma:335-393`  | No composite index on `[isDeleted, createdAt]` or `[isDeleted, updatedAt]` — list query filesorts on full table scan                                                | Add both compound indexes                     |
| High   | `schema.prisma:264-309`  | `Type.category` is MySQL enum string with no FK to a category-reference table — adding new `Category` enum requires code+migration in lockstep                      | Document trigger-as-constraint pattern        |
| High   | `schema.prisma:435, 437` | `FtsFunctionDetail.ftsFunction` relation has no `onDelete` policy — defaults to Restrict; if function is hard-deleted (possible via Studio) details become orphaned | Add `onDelete: Cascade`                       |
| Medium | `schema.prisma:236-261`  | `HistoryLog.userId` is non-nullable FK to `User`; soft-deleted user breaks future hard-delete migration                                                             | `userId` nullable or `onDelete: SetNull`      |
| Medium | `schema.prisma:210-230`  | `AuditLog.event` is `VARCHAR(64)`, not DB enum — no protection against misspelled event codes                                                                       | DB enum or check constraint                   |
| Medium | `schema.prisma:97-185`   | `User.fullName`/`shortName` are persisted derived columns built from first+last+patronymic — drift on update if `buildFullName` is not called                       | Use generated column or always call builder   |
| Low    | `schema.prisma:467-485`  | `FtsFunctionTree.parentFtsFunctionId/childFtsFunctionId` actually references **`FtsFunctionDetail`** — name is misleading                                           | Rename to `parentDetailId / childDetailId`    |

### Dimension 5 — Naming & conventions

| Sev    | File:line                         | Problem                                                                                                                     | Fix                                           |
| ------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Medium | `apps/api/db/sql/index.ts:13`     | `console.info('Setting up SQL...\n')` mixes Russian/English                                                                 | Standardise on English in code-facing strings |
| Medium | `fts-function.service.ts:628`     | `const DuplicateNameError = FunctionNameDuplicateException` — pointless alias                                               | Remove                                        |
| Low    | `audit-rotation.service.ts:14-20` | 16-line essay comment over a constant value never overridden — describes unimplemented `SchedulerRegistry` approach         | Shorten to 2 lines                            |
| Low    | `apps/api/db/sql/index.ts:29`     | `const name = mount.name.replace(/^mount/, '')` — relies on JS function `.name`; rename a mount and logging silently breaks | Use explicit `{name, fn}` tuple               |

### Dimension 6 — Comments & documentation

| Sev    | File:line                          | Problem                                                                                                          | Fix                                                                     |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| High   | `apps/api/src/app.module.ts:14-25` | "FTS-NO-AUTH BRANCH" inline comments in two files — misrepresents prod state                                     | Replace with single `docs/deployment-profile.md`, remove inline caveats |
| Medium | `constant.controller.ts:55-64`     | JSDoc says "pass through JwtAuthGuard" — but `JwtAuthGuard` is commented out and not mounted                     | Update JSDoc to reflect reality                                         |
| Medium | `fts-function.service.ts:1-9`      | JSDoc mentions a "planned `prisma.$extends` refactor … in `docs/known-limitations.md`" — stale forward reference | Remove "planned" phrasing                                               |
| Low    | `eslint.config.shared.ts:5`        | Comment references `/home/Kristy/Develop/FromServer/dev/agario/...` — local fs path                              | Remove                                                                  |
| Low    | `apps/api/db/sql/index.ts:35`      | Emoji `✅` in server startup output — UTF-8 issues on some Windows                                               | Plain ASCII                                                             |

### Dimension 7 — Testing

(Full audit in `05-test-coverage.md`. Highlights:)

| Sev    | File:line                                   | Problem                                                                                                | Fix                                               |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| High   | `apps/api/test/fts-function.e2e-spec.ts:20` | Hardcodes seed count `33` — breaks if data-guy adds rows                                               | Assert `items.length > 0`                         |
| High   | `e2e-spec.ts:283-320`                       | `[200, 404]` accepted as valid for `GET :id` after delete — masks `getById` not filtering soft-deleted | Fix `getById`, assert 404                         |
| Medium | —                                           | No test for `batchAttachDtis` (high complexity, raw SQL paths)                                         | Add specs covering empty/partial/idempotent batch |
| Medium | —                                           | `ConstantService` has no spec file at all                                                              | Create `constant.service.spec.ts`                 |

### Dimension 8 — Build, CI, deploy

(Full audit in `07-ci-standards.md`. Highlights:)

| Sev    | File:line                         | Problem                                                                                      | Fix                                      |
| ------ | --------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------- |
| High   | `README.md:7-8`                   | CI/CD badges `pending` placeholders; CI exists but no badge                                  | Wire badge URLs or remove                |
| High   | `apps/api/tsconfig.json:19`       | `"noImplicitAny": false` undermines workspace base `strict: true`                            | Remove                                   |
| Medium | `turbo.json:11`                   | `"lint": {}` no `outputs`/`dependsOn` — cache hits may skip lint silently                    | Add `"cache": false`                     |
| Medium | `apps/api/package.json:64-66`     | `passport`/`passport-jwt`/`passport-local` are runtime deps but `AuthModule` disabled        | Move to `optionalDependencies` or remove |
| Medium | `apps/web/package.json:128-132`   | `"overrides": { "drizzle-kit": ... }` — Drizzle Kit not a dep; leftover from Replit template | Remove                                   |
| Low    | `prisma.service.ts:4-5`           | Imports from internal generated paths (`src/generated/prisma/internal/...`) — not stable API | Use public re-exports                    |
| Low    | `packages/shared/package.json:37` | `"postinstall"` script `tsup ... \|\| true` — broken build silently succeeds                 | Remove `\|\| true`                       |

### Dimension 9 — Configuration & env

| Sev    | File:line                     | Problem                                                                                                                | Fix                                                                |
| ------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| High   | `apps/api/.env.example:14-26` | JWT secrets set to literal `"secret_key"` (10 chars) but config requires `MinLength(32)` — example fails at startup    | Replace with `openssl rand -hex 32` output                         |
| High   | `node-config.ts:34-46`        | Four JWT secrets required (MinLength 32) even when AuthModule disabled                                                 | `@IsOptional()` or split config into auth-profile and core-profile |
| Medium | `node-config.ts:59`           | `allowedOrigins` defaults to `['*']` — wide-open CORS if env missing                                                   | Default to `[]`, require explicit                                  |
| Medium | `apps/api/src/main.ts:78-88`  | Production CORS `origin: [node.url]` — if FE served from different URL (nginx fronted), blocks all browser requests    | Allow via `FRONTEND_URL` env var                                   |
| Low    | `apps/api/.env.example`       | Missing `AUDIT_LOG_BUCKET`, `AUDIT_LOG_RETENTION_DAYS`, `AUDIT_LOG_CRON`, `ALLOWED_ORIGINS`, `APP_VERSION`, `LOGS_DIR` | Add with comments                                                  |

### Dimension 10 — Performance

(Full audit in `08-performance.md`.)

### Dimension 11 — Security

| Sev             | File:line                         | Problem                                                                                                                                                                                              | Fix                                                                  |
| --------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Doc-only** ⚠️ | `constant.controller.ts:92-191`   | `@Roles(UserRole.ADMIN)` decorators present, `@UseGuards` commented out, AuthModule disabled — endpoints publicly accessible. **Per user: intentional for FTS internal-only via maintenance panel.** | Delete dead `@Roles` decorators; document in `deployment-profile.md` |
| High            | `apps/api/src/main.ts:29-33`      | `contentSecurityPolicy: false` and `crossOriginOpenerPolicy: false` to fastifyHelmet — CSP fully disabled, no XSS mitigation                                                                         | Enable CSP with `default-src 'self'`                                 |
| High            | `fts-function.service.ts:443-451` | `$queryRawUnsafe` with user-supplied `search` — string IS parameterised (`?` placeholder) → **NOT injection** but method name alarms reviewers                                                       | Use `Prisma.sql` template tag or document why safe                   |
| Medium          | `fts-function.service.ts:485-495` | `$queryRawUnsafe` cursor — `column` derived from enum (not user input) but interpolation `WHERE ${column} ${cmp}` looks dangerous                                                                    | Replace with typed enum-keyed map                                    |
| Medium          | `apps/api/src/main.ts:96-104`     | `trustProxy: true` correct for nginx but if deployment changes `X-Forwarded-For` spoofing bypasses rate limit                                                                                        | Document nginx requirement; test                                     |
| Low             | `auth.module.ts:14`               | AuthModule still imports/re-exports `RolesGuard` even though disabled in `app.module.ts`                                                                                                             | Remove module entirely on FTS branch                                 |

### Dimension 12 — Observability

| Sev    | File:line                               | Problem                                                                                                                  | Fix                                   |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| High   | `health.controller.ts:34-41`            | Health returns `{status: 'ok'}` even when `db: 'disconnected'` — load balancer probes pass through DB outage             | HTTP 503 when `db === 'disconnected'` |
| Medium | `fts-function-counter.service.ts:23-28` | 60s interval refresh; if counter and DB diverge during interval list shows stale `overallTotal`; no metric on divergence | Log warn if divergence > N%           |
| Medium | `apps/api/src/main.ts:112-115`          | `console.warn('SQL mount skipped:', sqlError)` — `console` not pino; inconsistent logging                                | Use NestJS `Logger` or let propagate  |
| Low    | `audit.service.ts`                      | No correlation-ID/request-ID on audit events — can't link audit record to HTTP request                                   | Accept `requestId` in `AuditContext`  |

### Dimension 13 — Cross-package deps

| Sev    | File:line                            | Problem                                                                                                                                                                       | Fix                                                                                     |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| High   | `packages/shared/package.json:36-38` | `@registry/shared` version `"0.0.0"`; web pins `workspace:*` — no semver, no breaking-change signal                                                                           | Adopt semver, tag releases, use `workspace:^`                                           |
| High   | —                                    | Compile-time enum contract check exists for Prisma↔shared enums (excellent) — but **no equivalent for DTO field names** drifting between API zod schema and RTK-Query codegen | Add zod-to-typescript type-assertion verifying shared schema matches generated RTK type |
| Medium | `apps/web/package.json:87`           | `zod-validation-error: ^3.4.0` declared but `pnpm.overrides` sets `^4.0.2` — override wins, declared is stale                                                                 | Align declared with override                                                            |
| Low    | `apps/api/package.json:48`           | `@registry/shared` declared `"file:../../packages/shared"` in API but `workspace:*` in web — inconsistent protocol                                                            | Standardise on `workspace:*`                                                            |

### Dimension 14 — DX / onboarding

| Sev    | File:line               | Problem                                                                                                                                                | Fix                                  |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| High   | `README.md:17-24`       | Quickstart says `pnpm --filter=@registry/api prisma migrate dev` but root shortcut is `pnpm db:dev` — README out of sync with scripts                  | Update README to use root scripts    |
| Medium | `README.md:100-110`     | Cheatsheet lists `pnpm check:all` and `pnpm test:all` — these scripts do not exist                                                                     | Remove ghost commands or add aliases |
| Medium | `apps/api/.env.example` | `NODE_ENV=development` in example — config uses `NODE_ENV` as file-path discriminator (`.env.${nodeMode}.local`); copying example overrides actual env | Remove `NODE_ENV` from example       |

---

## Cross-cutting top 10

Ranked by unlock potential:

1. **[Security/Architecture]** Delete the dead `@Roles(UserRole.ADMIN)` decorators on `ConstantController` (per user: maintenance panel without auth is by design) + add `docs/deployment-profile.md`. Removes the largest "is this a security bug?" question.

2. **[Build/Type system]** Remove `"noImplicitAny": false` from `apps/api/tsconfig.json:19` — single line undermining `strict: true` from base.

3. **[Architecture/Comments]** Commit to FTS no-auth model as documented deployment profile instead of commented-out code — remove dead `JwtAuthGuard`/`ProfileModule` imports from `app.module.ts`, remove inline "FTS-NO-AUTH BRANCH" comments, write single `docs/deployment-profile.md`. Removes ~40 lines of noise from the most-read file.

4. **[Performance/Correctness]** Fix the race in `audit-rotation.service.ts:123-127` — fetch-then-delete not atomic; rows inserted between are silently lost.

5. **[Observability]** Return HTTP 503 from `GET /v1/health` when `db === 'disconnected'`.

6. **[Performance/Schema]** Add `@@index([isDeleted, createdAt])` and `@@index([ftsFunctionNameId])` to `FtsFunction`.

7. **[Type system]** Eliminate the `dto as unknown as Record<string, ...>` cast pattern — define concrete `FtsFunctionWriteInput` base type.

8. **[Config/Security]** Make four JWT config fields `@IsOptional()` in `NodeConfig` when AuthModule disabled.

9. **[Testing]** Add specs for `batchAttachDtis` and `buildCursorPredicate` — highest-complexity, highest-risk methods, zero coverage.

10. **[Architecture/DB]** Fix the `import { Category } from '@prisma/client'` (bare) in `constant.service.ts:21` → `@prisma-client` alias.

---

## Standards we should adopt (proposed for `90-CONVENTIONS.md`)

| Rule                                | Why                                                                           | Enforcement                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **no-commented-out-modules**        | Dead imports with `// eslint-disable` hide silently                           | Custom ESLint rule or `import/no-unused-modules`                |
| **no-as-unknown-cast**              | Compiler escape hatch hiding missing types                                    | `@typescript-eslint/consistent-type-assertions: error` + review |
| **explicit-prisma-alias**           | Always `@prisma-client`, never bare `@prisma/client`                          | `import/no-restricted-paths` or custom rule                     |
| **health-503-on-degraded**          | Health endpoints must return 5xx on critical-dep down                         | E2E test                                                        |
| **no-raw-sql-interpolation**        | Any `$queryRawUnsafe` with template variable must justify or use `Prisma.sql` | Code review + custom rule                                       |
| **compound-softdelete-index**       | Every `isDeleted` table that's filtered+sorted must have compound index       | Migration reviewer checklist                                    |
| **env-example-completeness**        | `.env.example` must list every var read by config classes                     | CI script: diff config-vars vs env keys                         |
| **no-seed-count-assertions**        | Tests must not hardcode seed row counts                                       | ESLint rule detecting `toBe(33)` in `e2e-spec.ts`               |
| **audit-log-by-id**                 | Rotation delete targets specific row IDs not time window                      | Code review + invariant comment                                 |
| **shared-package-semver**           | `@registry/shared` must have meaningful version                               | CI check: `version != "0.0.0"`                                  |
| **csp-enabled**                     | `fastifyHelmet` must NOT receive `contentSecurityPolicy: false` in prod       | CI security scan + assertion                                    |
| **jwt-config-optional-on-no-auth**  | Config must not require JWT secrets for disabled modules                      | Integration boot test                                           |
| **no-double-db-roundtrip-guard**    | Alive-check + write must be one query OR conditional `where`                  | Code review                                                     |
| **readme-script-parity**            | Every README command must exist in `package.json`                             | `scripts/check-readme-commands.ts` in CI                        |
| **no-local-paths-in-shared-config** | Shared files must not reference dev-local fs paths                            | Grep in CI                                                      |

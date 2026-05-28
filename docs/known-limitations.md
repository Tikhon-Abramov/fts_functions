# Known Limitations

This document tracks features and edge cases that are not yet implemented,
along with what would unblock each. Source code intentionally contains zero
`// TODO` comments — work items live here for visibility and tracking.

Last updated: 2026-04-25

Recently shipped (no longer tracked here): CI/CD pipeline
(`.github/workflows/ci.yml` + `deploy.yml`), systemd unit and Linux deploy
script, Windows/nssm deploy script, health endpoint at `GET /v1/health`,
`knip` dead-code/dependency audit wired into CI, web-side coverage
thresholds, bundle visualizer on web build, **admin CRUD on the
two dictionary tables** — `POST/PATCH/DELETE /v1/constants/type` and
`POST/PATCH/DELETE /v1/constants/user`, gated by `RolesGuard +
@Roles(UserRole.ADMIN)` and writing `admin.*` rows to `audit_log` via
the promoted-to-common `AuditService`, and **DTI removal frontend
wiring** — `DtiMultiSelect` no longer locks baseline chips, and
`useFunctionForm` fires `useFtsFunctionControllerDetachDtiV1Mutation`
in parallel with the existing batch-attach call on update submit.
Read endpoints stay `@Public()` pending the auth-gating-on-reads
decision below. See `docs/improvement-potential.md` § Done for
cross-references.

---

## Backend gaps

### DTI full-replace endpoint

- **Current behavior**: only the additive `POST .../dtis/batch` endpoint
  exists. There is no single call that synchronises a given list against
  the current attachment set.
- **What unblocks**: add `PUT /v1/fts-functions/:id/dtis` with
  full-replace semantics (remove missing + add new) in
  `apps/api/src/module/fts-function/fts-function.controller.ts`. The
  existing `batch` endpoint must remain additive-only.
- **Trigger**: needed once the frontend wants a single "save DTIs" call
  rather than the current additive flow.

### Soft-delete + counter + audit cross-cutting concerns

- **Current behavior**: each service method that reads `FtsFunction`
  manually applies `where: { isDeleted: false }`, and counter updates +
  audit-log writes are wired by hand in the affected mutators.
- **What unblocks**: a `prisma.$extends` client extension that
  auto-applies the `isDeleted: false` filter on reads, fans out counter
  updates, and emits audit-log rows. See audit doc §5 for the design
  sketch.
- **Source reference**:
  `apps/api/src/module/fts-function/fts-function.service.ts` JSDoc.

### LRU cache for `filteredTotal`

- **Current behavior**:
  `apps/api/src/module/fts-function/fts-function-counter.service.ts`
  caches only the _overall_ non-deleted total. Every list request that
  carries filters/search runs a fresh `COUNT(*)` against the DB.
- **What unblocks**: add an LRU cache keyed by the canonicalised
  filter/search arguments inside `FtsFunctionCounterService` and
  invalidate on writes that change the matching set.
- **Trigger**: deferred until list-page load profiling shows the
  per-request `COUNT(*)` is hot.

### `FtsFunction` / `Constant` endpoints are still `@Public()`

- **Current behavior**: `AuthModule` is mounted and a global `JwtAuthGuard`
  protects every route, BUT `FtsFunctionController`, `ConstantController`
  and `HealthController` are explicitly opted-out via `@Public()`. This is
  intentional for the first deploy — flipping the switch (removing the
  decorator) would break the existing frontend, which has not yet wired
  login flows.
- **What unblocks**: a product decision. Once the frontend lands its login
  UI, drop the `@Public()` decorators on `FtsFunctionController` /
  `ConstantController` and decide which endpoints are still anonymous
  (likely none for FtsFunction, possibly read-only Constants). `/v1/health`
  stays `@Public()` for uptime probes. `/v1/auth/me` and `/v1/profile/*`
  already require a JWT.
- **Reference**: `apps/api/src/module/auth/decorators/public.decorator.ts`,
  `apps/api/src/app.module.ts` (global `JwtAuthGuard`).

### Refresh-token full-revoke on password / email change

- **Current behavior**: `PATCH /v1/profile/password` and
  `PATCH /v1/profile/email` write a sentinel record to
  `refresh_token_blacklist` for the user. They cannot, however, revoke
  every still-live refresh token because there is no per-user issued-token
  index — the blacklist is keyed by SHA-256 of the raw token. Existing
  refresh tokens issued before the change therefore remain technically
  valid until their natural expiry (14 days). The post-change response
  returns a fresh pair so the **current** client is fine; **other**
  devices keep working until refresh expiry.
- **What unblocks**: an `IssuedToken` table (or a `tokenVersion` column
  on User that all access/refresh tokens carry as a claim and that gets
  bumped on password / email change). Not implemented; left as a known
  trade-off.
- **Why this matters**: a stolen refresh token issued before the password
  was changed remains usable for up to 14 days. For the current internal
  FTS deployment the threat surface is acceptable; for external use,
  ship `tokenVersion` first.

## Frontend gaps

### Vitest "click-disabled-submit-then-assert-noop" tests broken by `mode: onChange`

- **Current behavior**: 6 vitest cases (Login / Register / Profile)
  click the submit button to assert "the mutation was NOT called"
  for invalid input. After auth/profile forms switched to
  `disabled={!isValid}`, those clicks now throw
  `Unable to perform pointer interaction as the element has
pointer-events: none`. The pre-condition is correct (button is
  disabled exactly because the form is invalid), but the test shape
  is wrong.
- **What unblocks**: replace each `click(submit)` + `expect(mutation
not called)` pair with a direct `expect(submit).toBeDisabled()`.
  ~10 minutes of mechanical edits across the three test files.
  Tracked in `docs/open-questions.md` F8.

### `authApi.ts` is hand-written (codegen pending)

- **Current behavior**: `apps/web/src/shared/api/authApi.ts` mirrors
  the shape `@rtk-query/codegen-openapi` would emit. It now includes
  `useLazyAuthControllerCheckEmailV1Query` (added in this session).
- **What unblocks**: when the backend is reachable from the codegen
  agent, run `pnpm web:codegen` so all `/v1/auth/*` and `/v1/profile/*`
  hooks land in `ftsFunctionsApi.ts` and `authApi.ts` can be deleted.
  Tracked in `docs/open-questions.md` F1.

### `strategyProjectIds` is form-only

- **Current behavior**:
  `apps/web/src/entities/fts-function/mocks/validation.ts` declares a
  `strategyProjectIds: string[]` field on `FunctionFormFields` and the
  legacy mock UI renders it, but `submitCreate` / `submitUpdate` do not
  forward it as a first-class column on `FtsFunction` — the backend
  models "Strategy D" via DTI attachments instead, attached after
  creation.
- **What unblocks**: either (a) drop `strategyProjectIds` from the form
  type once the legacy UI stops referencing it, or (b) translate the
  field into the appropriate DTI attachment payload at submit time.
  Needs design discussion on which path to take.

## End-to-end test gaps

These are `test.fixme(...)` Playwright tests already wired to light up
green once the underlying UI plumbing lands. They are documented here so
the dependency is tracked outside the spec files.

### Snackbar surfaces typed backend error codes

- **Affected tests**:
  - `apps/web/e2e/error-handling.spec.ts` — `TYPE_CATEGORY_MISMATCH`
    (expected snackbar text:
    `Значение поля {{column}} не соответствует требуемой категории справочника ({{category}}).`)
  - `apps/web/e2e/error-handling.spec.ts` — `USER_ROLE_MISMATCH`
    (expected snackbar text:
    `Пользователь в роли «{{slot}}» не соответствует необходимой ветви ФНС или должности.`)
- **What unblocks**: wire the form's submit path to the RTK Query
  mutation that flows through `rtkErrorMiddleware` so backend error
  payloads are surfaced via the snackbar with the `params`
  interpolation. Tracked in `docs/refactor-journey.md` as Worker G.

### Tree-edge LinkPicker flow

- **Affected tests**:
  - `apps/web/e2e/tree-edges.spec.ts` — "link two rows via the
    LinkPicker" (full happy path: open modal, select row, switch to
    `tab-link-picker`, tick a candidate, click create, verify it appears
    in `tab-links`).
  - `apps/web/e2e/tree-edges.spec.ts` — "duplicate edge is rejected with
    DUPLICATE_TREE_EDGE snackbar text".
- **What unblocks**:
  1. Add per-row `data-testid="link-candidate-<id>"` and
     `data-testid="button-create-links"` attributes to
     `LinkPicker.tsx`.
  2. Route the create-link action through the backend mutation so the
     `DUPLICATE_TREE_EDGE` snackbar surfaces. Same dependency as the
     snackbar tests above (Worker G).

## Lint plugin gaps

These are `@registry/eslint-plugin` rules whose visitors ship empty so
the rule list, message catalogue, and config wiring stay stable as the
detection logic matures. The plugin README's status table reflects
this.

### `sibling-jsx-data-variation` (Class 29)

- **Current behavior**: rule registered, empty visitor, no diagnostics
  emitted.
- **What unblocks**: implement the opening-tag-signature grouping
  described in
  `packages/eslint-plugin-registry-functions/src/rules/sibling-jsx-data-variation.ts`
  JSDoc — group adjacent JSXElement siblings by tag name + statically
  valued attribute names; report at the first sibling when 3+ share the
  signature and ≥half of attribute values are literal. Auto-fix is
  intentionally skipped (hint-only).

### `testid-registry` (Class 32)

- **Current behavior**: rule registered, empty visitor, no diagnostics
  emitted.
- **What unblocks**: cross-reference the sibling test file
  (`<base>.test.tsx` / `<base>.spec.tsx`) for `getByTestId` /
  `findByTestId` usages of any `data-testid="<literal>"` in the
  component, and report when the literal is not sourced from a
  `*_TEST_IDS` registry exported from the same file. A simpler v1
  fallback (flag any component with 2+ literal `data-testid` attributes
  not sourced from a registry) is documented in the rule's JSDoc.

## Infrastructure gaps

### Frontend telemetry sink

- **Current behavior**: the backend logs via `nestjs-pino` with
  request-scoped child loggers; the frontend has no telemetry sink yet.
- **What unblocks**: needs design discussion on the target sink (Sentry
  vs. self-hosted vs. reuse of the backend pino stream) and on the
  privacy posture for an internal FTS deployment. Tracked in
  `docs/architecture.md` §Logging.

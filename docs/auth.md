# Authentication & Profile modules

Backend authentication for `apps/api`. Email-based sign-up with verification
link, JWT access + refresh tokens, refresh rotation with SHA-256 blacklist,
forgot/reset password, audit log of auth events. Plus a Profile module for
self-service updates (full name, login, email change with re-verification,
password change, avatar upload via MinIO presigned URLs).

## Auth endpoints (all under `/v1/auth`)

| Method | Path                   | Auth        | Body / Notes                                                                       |
| ------ | ---------------------- | ----------- | ---------------------------------------------------------------------------------- |
| POST   | `/register`            | Public      | `{ email, password, firstName, lastName, patronymic? }` — sends verification email |
| POST   | `/verify-email`        | Public      | `{ token }` — flips `emailVerified=true`                                           |
| POST   | `/resend-verification` | Public      | `{ email }` — does not reveal whether email exists                                 |
| POST   | `/login`               | Public      | `{ identifier, password }` — `identifier` is email OR `login`                      |
| POST   | `/refresh`             | Refresh JWT | `Authorization: Bearer <refreshToken>` — rotates                                   |
| POST   | `/logout`              | Refresh JWT | revokes refresh token                                                              |
| POST   | `/forgot-password`     | Public      | `{ email }` — sends reset link if user exists                                      |
| POST   | `/reset-password`      | Public      | `{ token, password }` — token expires after 1 hour                                 |
| GET    | `/me`                  | Access JWT  | returns the current user                                                           |

`POST /login` returns `{ accessToken, refreshToken, expiresIn }`.

## Profile endpoints (all under `/v1/profile`, all require Access JWT)

| Method | Path                    | Body / Response                                                                                                            |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`                     | → `ProfileDto` with presigned `avatarUrl` if user has an avatar                                                            |
| PATCH  | `/`                     | `{ fullName?, login? }` → updated `ProfileDto`                                                                             |
| PATCH  | `/email`                | `{ newEmail }` → 202; sets `emailVerified=false`, sends verification email, blacklists existing refresh tokens             |
| PATCH  | `/password`             | `{ currentPassword, newPassword }` → `{ accessToken, refreshToken, expiresIn }`; current password verified, others revoked |
| POST   | `/avatar/presigned-url` | `{ contentType }` → `{ uploadUrl, key, getUrl, expiresAt }`. Client PUT's directly to MinIO.                               |
| POST   | `/avatar/confirm`       | `{ key }` → records key on user, deletes previous MinIO object, returns updated `ProfileDto`                               |

`ProfileDto`: `{ id, login, email, fullName, role, ftsPositionRole, ftsFunctionRole, ftsBranchType, emailVerified, avatarUrl, createdAt, updatedAt }`.

### Avatar key format

Keys are namespaced by user: `avatars/<userId>/<uuid>.<ext>` where `ext` is
derived from the request's `contentType` (`image/png` → `png`, `image/jpeg` →
`jpg`, etc.). The service rejects `confirm` payloads whose key does not start
with the calling user's `avatars/<userId>/` prefix — clients cannot smuggle
in foreign keys.

### Avatar overwrite policy

On every successful `confirm`, the previous MinIO object (if any) is deleted
asynchronously. There is no avatar history. This is reversible — see
`docs/open-questions.md` § A8 for the recorded decision.

### Presigned URL expiry

| Operation | TTL    |
| --------- | ------ |
| PUT       | 15 min |
| GET       | 1 hour |

If a `getUrl` returned with `GET /v1/profile` is stale, the client refetches
it by hitting `/v1/profile` again — every read issues a fresh GET URL.

## Storage module (MinIO / S3-compatible)

`StorageModule` exposes a single `MinioService` (global) wrapping the AWS
SDK v3 S3 client in path-style mode. On startup it `HeadBucket`'s the
configured bucket and creates it if missing. If MinIO is unreachable the
warning is logged and the app keeps running — local development without a
MinIO container is supported.

Env vars: `MINIO_ENDPOINT`, `MINIO_BUCKET`, `MINIO_ACCESS_KEY`,
`MINIO_SECRET_KEY` (see `apps/api/.env.example`).

## Token lifetimes

| Token   | Default lifetime | Env var                           |
| ------- | ---------------- | --------------------------------- |
| Access  | 15 minutes       | `JWT_ACCESS_TOKEN_EXPIRATION_MS`  |
| Refresh | 14 days          | `JWT_REFRESH_TOKEN_EXPIRATION_MS` |

Refresh tokens are signed with a separate secret (`JWT_REFRESH_TOKEN_SECRET`)
and carry a `jti` claim so a stolen-and-detected token can be revoked. On
every successful `/refresh`, the previous refresh token is added to a
blacklist (table `refresh_token_blacklist`, indexed by SHA-256 of the
token — the raw token is never stored).

## How to gate a route

Auth is enabled globally via `APP_GUARD: JwtAuthGuard` in `app.module.ts`.
**Every endpoint requires a valid access token by default.** To opt out, add
`@Public()` to a method or class:

```ts
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Get()
list() { ... }
```

Currently `FtsFunctionController`, `ConstantController` and
`HealthController` are class-level `@Public()` (a follow-up product decision
will tighten this; see `docs/known-limitations.md`).

## How to read the current user

```ts
import { CurrentUser, type JwtUserPayload } from '../auth/decorators/current-user.decorator';

@Get('mine')
mine(@CurrentUser() user: JwtUserPayload) {
  return this.service.findByOwner(user.sub);
}
```

## Flow diagrams

```
register → email-link → verify-email → login → /v1/auth/me 200
                                          │
                                          ├── access (15m) → use on protected routes
                                          └── refresh (14d) → /v1/auth/refresh → new pair (old one is blacklisted)

forgot-password → email-link → reset-password (token, new password)
```

## Email service

`IEmailService` lives at `apps/api/src/module/email/email.types.ts` and is
bound to `ResendEmailService` by default. To swap providers (e.g. an internal
SMTP relay), implement the same interface and switch the binding in
`EmailModule`. If `RESEND_API_KEY` is empty or the `resend` SDK is not
installed, the service falls back to a console stub that logs the rendered
HTML — useful in tests and local dev.

### Verification email — current HTML

```html
<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:0;background:#f8fafc;">
    <table width="100%" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table
            width="560"
            style="max-width:560px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;"
          >
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #e2e8f0;">
                <div
                  style="font-size:14px;letter-spacing:0.04em;text-transform:uppercase;color:#1f6feb;font-weight:600;"
                >
                  Реестр функций ФНС
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">
                  Подтвердите ваш email
                </h1>
                <p>Здравствуйте, Иванов И. И.!</p>
                <p>
                  Чтобы завершить регистрацию в Реестре функций ФНС, подтвердите
                  ваш email — нажмите кнопку ниже:
                </p>
                <a
                  href="{verifyUrl}"
                  style="display:inline-block;background:#1f6feb;color:#fff;padding:14px 28px;border-radius:8px;font-weight:600;"
                >
                  Подтвердить email
                </a>
                <p style="font-size:13px;color:#64748b;">
                  Если кнопка не работает — скопируйте ссылку:
                  <span style="color:#1f6feb;">{verifyUrl}</span>
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="padding:20px 32px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;"
              >
                Если вы не запрашивали это письмо — просто проигнорируйте
                его.<br />
                Реестр функций ФНС · автоматическая рассылка, отвечать не нужно.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

The reset-password email follows the same shell with a different headline,
button label, and a 1-hour validity reminder.

## Audit log

Every register / login / logout / email-verified / password-reset event is
persisted to the `audit_log` table with:

- `userId` — actor (or `null` for unknown email password-reset requests)
- `event` — short event name (`auth.login`, `auth.register`, …)
- `ipAddress`, `userAgent`
- `metadata` (JSON, optional)

Audit-log writes are best-effort — a failure logs a warning but does not
fail the user-facing operation.

## Backward compatibility (login field)

Existing `User` rows have `email = null` and a populated `login`. The
`/login` endpoint accepts an `identifier` that is matched against `email`
first, then falls back to `login`. New registrations always set `email`
and require email verification before login. Old `login`-based users are
not forced to verify.

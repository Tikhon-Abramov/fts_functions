# Audit logging

The backend writes an audit row for every meaningful mutation
(authentication events + admin CRUD on the `Type` / `User` dictionaries).
The rows live in MariaDB while they are «hot», then a nightly cron rotates
old rows to JSONL files in MinIO and deletes them from the database.

## Writer flow

`AuditService` (`apps/api/src/common/audit/audit.service.ts`) exposes one
named record-method per known event:

```text
auth.register · auth.login · auth.logout · auth.email_verified
auth.password_reset_requested · auth.password_reset_completed
admin.type_create · admin.type_update · admin.type_delete
admin.user_create · admin.user_update · admin.user_delete
```

Every callsite uses a typed method; free-text events are not allowed.
A failed `prisma.auditLog.create` only logs `warn` — it must never break
the surrounding business operation. The audit log is append-only.

## Schema

`audit_log` (`apps/api/db/schema.prisma` → `model AuditLog`) holds:

| column      | meaning                                       |
| ----------- | --------------------------------------------- |
| `id`        | autoincrement                                 |
| `event`     | one of the event names above                  |
| `userId`    | actor (or affected user for `admin.*`)        |
| `ipAddress` | request IP if known                           |
| `userAgent` | request user-agent if known                   |
| `metadata`  | free-form JSON snapshot (changes / email / …) |
| `createdAt` | row timestamp                                 |

Indexed on `userId+createdAt`, `event+createdAt`, and `createdAt` alone.

## Retention & rotation

`AuditRotationService`
(`apps/api/src/common/audit/audit-rotation.service.ts`) runs every night
at **02:00 server time**. It:

1. Selects every `audit_log` row older than `AUDIT_LOG_RETENTION_DAYS`
   (default **14**) in batches of 1000.
2. Serialises them into JSONL (one `JSON.stringify(row)` per line).
3. Uploads the result to the `AUDIT_LOG_BUCKET` (default
   `registry-audit-logs`) under
   `audit/<YYYY>/audit-<YYYY>-<MM>-<DD>.jsonl`.
4. Only after the upload succeeds, runs a single
   `prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } })`.

If the upload fails the DELETE is skipped — the next nightly tick
retries idempotently. Re-running the cron after a successful upload
finds zero rows and exits.

`rotateNow()` is exposed for tests (and for an optional admin-only HTTP
endpoint if you want to expose it later — currently not wired).

## File layout in MinIO

```
registry-audit-logs/
└── audit/
    ├── 2026/
    │   ├── audit-2026-04-25.jsonl
    │   ├── audit-2026-04-26.jsonl
    │   └── …
    └── 2027/
        └── …
```

## Configuration

| env var                    | default               | meaning                                             |
| -------------------------- | --------------------- | --------------------------------------------------- |
| `AUDIT_LOG_BUCKET`         | `registry-audit-logs` | target bucket                                       |
| `AUDIT_LOG_RETENTION_DAYS` | `14`                  | rotate rows older than this                         |
| `AUDIT_LOG_CRON`           | `0 2 * * *`           | informational; cron decorator binds at compile time |

### Disabling rotation in dev

Set `AUDIT_LOG_RETENTION_DAYS=0` in `.env.development.local`. The cron
method becomes a no-op, the bucket-ensure on startup is skipped, and
your local audit rows stay in MariaDB indefinitely. This is the
recommended switch when you have no MinIO running locally.

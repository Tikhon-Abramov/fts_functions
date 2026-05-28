#!/usr/bin/env bash
# ============================================================
# One-shot FTS bringup, run on the FTS Windows host (Git Bash).
#
# Assumes the deploy zip has been extracted to:
#   D:/services/registry-functions/
# and that node_modules came bundled (INCLUDE_NODE_MODULES=1).
#
# Steps:
#   1. Write `.env` with the FTS-shared MySQL credentials
#   2. Create the `registry_functions` database
#   3. Apply every SQL migration via the mysql client (no prisma migrate)
#   4. Mark migrations as applied in `_prisma_migrations` so future deploys
#      that run `prisma migrate deploy` see them as already-up
#   5. Seed via node + ts-node loader (the Linux-built artefact has no
#      Windows prisma engine, but `@prisma/adapter-mariadb` is pure JS
#      so the seed works cross-platform)
#   6. nssm install + start the service (one-time)
#
# Re-running steps 5+6 is a no-op (seed wipes-and-replaces; nssm refuses
# to re-install an existing service).
# ============================================================
set -euo pipefail

ROOT="${ROOT:-D:/services/registry-functions}"
PORT="${PORT:-8787}"
SERVICE_NAME="${SERVICE_NAME:-registry-functions}"
DB_USER="${DB_USER:-services_development}"
DB_PASS="${DB_PASS:-TrollingLeFBI}"
DB_NAME="${DB_NAME:-registry_functions}"
MYSQL='/c/Program Files/MySQL/MySQL Server 9.6/bin/mysql.exe'
NODE='/c/Program Files/nodejs/node.exe'
NSSM='/c/Program Files/nssm/nssm.exe'

cd "$ROOT/apps/api"

# ---- 1. .env ----
cat > .env <<EOF
NODE_ENV=production
APP_NAME=Реестр функций ФНС
PINO_LOG_LEVEL=info

NODE_HOST=0.0.0.0
NODE_HTTP_PORT=$PORT

THROTTLE_TTL=60000
THROTTLE_LIMIT=1000000

COOKIE_SECRET=fts-noauth-cookie-not-used-32-bytes-padding-padding
JWT_ACCESS_TOKEN_SECRET=fts-noauth-access-32-bytes-padding-padding
JWT_ACCESS_TOKEN_EXPIRATION_MS=900000
JWT_REFRESH_TOKEN_SECRET=fts-noauth-refresh-32-bytes-padding-padding
JWT_REFRESH_TOKEN_EXPIRATION_MS=1209600000
JWT_VERIFICATION_TOKEN_SECRET=fts-noauth-verif-32-bytes-padding-padding
JWT_VERIFICATION_TOKEN_EXPIRATION_MS=43200000
JWT_PASSWORD_RESET_TOKEN_SECRET=fts-noauth-reset-32-bytes-padding-padding
JWT_PASSWORD_RESET_TOKEN_EXPIRATION_MS=300000

DATABASE_USER=$DB_USER
DATABASE_PASSWORD=$DB_PASS
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=$DB_NAME
DATABASE_CONNECTION_LIMIT=50
DATABASE_URL=mysql://$DB_USER:$DB_PASS@127.0.0.1:3306/$DB_NAME?connection_limit=50

ALLOWED_ORIGINS=*
EOF
echo "[1/6] .env written"

# ---- 2. Database ----
"$MYSQL" -u "$DB_USER" -p"$DB_PASS" \
  -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "[2/6] Database '$DB_NAME' ready"

# ---- 3. Migrations ----
for sql in db/migrations/*/migration.sql; do
  echo "    applying: $sql"
  "$MYSQL" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$sql"
done
echo "[3/6] All migrations applied"

# ---- 4. Mark migrations in _prisma_migrations ----
"$MYSQL" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<'SQL'
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `checksum` VARCHAR(64) NOT NULL,
  `finished_at` DATETIME(3),
  `migration_name` VARCHAR(255) NOT NULL,
  `logs` TEXT,
  `rolled_back_at` DATETIME(3),
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL

for dir in db/migrations/*/; do
  name=$(basename "$dir")
  if [[ "$name" == "migration_lock.toml" ]]; then continue; fi
  checksum=$(sha256sum "$dir/migration.sql" | cut -d' ' -f1)
  uuid=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || powershell -Command "[guid]::NewGuid().ToString()")
  "$MYSQL" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    INSERT IGNORE INTO _prisma_migrations
      (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
    VALUES
      ('$uuid', '$checksum', NOW(3), '$name', NOW(3), 1);
  "
done
echo "[4/6] _prisma_migrations populated"

# ---- 5. Seed (compiled JS — no ts-node needed) ----
echo "[5/6] Running seed (this clears + repopulates fts_functions, types, users)..."
"$NODE" db/seeds-compiled/index.js
echo "[5/6] Seed complete"

# ---- 6. NSSM (idempotent — skip if service already exists) ----
if "$NSSM" status "$SERVICE_NAME" >/dev/null 2>&1; then
  echo "[6/6] NSSM service '$SERVICE_NAME' already exists; restarting..."
  "$NSSM" restart "$SERVICE_NAME" || true
else
  KIND='app'
  SDIR='registry-functions'
  MAIN="$ROOT/apps/api/dist/src/main.js"
  APPDIR="$ROOT/apps/api"
  LOGDIR="$ROOT/logs"
  TAG="fts:kind=$KIND;port=$PORT;sdir=$SDIR"
  mkdir -p "$LOGDIR"
  "$NSSM" install "$SERVICE_NAME" "$NODE" "$MAIN"
  "$NSSM" set "$SERVICE_NAME" AppDirectory     "$APPDIR"
  "$NSSM" set "$SERVICE_NAME" AppStdout        "$LOGDIR/$SERVICE_NAME-stdout.log"
  "$NSSM" set "$SERVICE_NAME" AppStderr        "$LOGDIR/$SERVICE_NAME-stderr.log"
  "$NSSM" set "$SERVICE_NAME" AppRotateFiles   1
  "$NSSM" set "$SERVICE_NAME" AppRotateOnline  1
  "$NSSM" set "$SERVICE_NAME" AppRotateBytes   104857600
  "$NSSM" set "$SERVICE_NAME" Start            SERVICE_AUTO_START
  "$NSSM" set "$SERVICE_NAME" Description      "$TAG"
  "$NSSM" start "$SERVICE_NAME"
  echo "[6/6] NSSM mounted and started"
fi

# ---- final check ----
sleep 2
echo "---"
"$NSSM" status "$SERVICE_NAME" || true
echo "Health check (curl http://127.0.0.1:$PORT/v1/health):"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:$PORT/v1/health" || true

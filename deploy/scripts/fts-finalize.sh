#!/usr/bin/env bash
# Final-stage FTS bringup: seed + NSSM + start (assumes .env, DB,
# migrations, node_modules already in place from prior steps).
set -euo pipefail

ROOT="${ROOT:-D:/services/fts-interacton-tables/registry-functions}"
PORT="${PORT:-4012}"
SERVICE_NAME="${SERVICE_NAME:-registry-functions}"
NODE='/c/Program Files/nodejs/node.exe'
NSSM='/c/Program Files/nssm/nssm.exe'

cd "$ROOT/apps/api"

# Mirror generated prisma into src/ so the seed's relative require resolves.
mkdir -p src/generated
[ -d dist/src/generated/prisma ] && cp -rn dist/src/generated/prisma src/generated/ || true

echo "[1/3] Running seed..."
"$NODE" db/seeds-compiled/index.js
echo "[1/3] Seed complete"

echo "[2/3] NSSM mount + start..."
if "$NSSM" status "$SERVICE_NAME" >/dev/null 2>&1; then
  "$NSSM" restart "$SERVICE_NAME" || "$NSSM" start "$SERVICE_NAME" || true
  echo "  service already mounted; restarted"
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
  echo "  service mounted and started"
fi

echo "[3/3] Health check..."
sleep 3
curl -sS -o /dev/null -w "Health: HTTP %{http_code}\n" "http://127.0.0.1:$PORT/v1/health" || true
echo ""
echo "=== READY URL: http://10.252.63.18:$PORT/ ==="

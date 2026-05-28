#!/usr/bin/env bash
# ============================================================
# Linux deploy — registry-functions → cats server (systemd)
#
# Usage:
#   ./deploy-cats.sh                Build locally, sync, migrate, restart.
#   ./deploy-cats.sh --restart-only Skip build/sync/migrate, just restart.
#
# Required env:
#   DEPLOY_HOST   Target host (or SSH alias from ~/.ssh/config).
# Optional env:
#   DEPLOY_USER   Defaults to "registry".
#   DEPLOY_DIR    Defaults to "/opt/registry-functions".
#
# Idempotent: safe to re-run. The systemd unit name is `registry-api`.
# ============================================================
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:?DEPLOY_HOST required}"
DEPLOY_USER="${DEPLOY_USER:-registry}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/registry-functions}"
SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

RESTART_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --restart-only) RESTART_ONLY=1 ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

# Auto-detect repo root from script location (deploy/scripts/ → repo root).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

log()  { echo "[$(date +%H:%M:%S)] $*"; }

if [ "$RESTART_ONLY" -eq 1 ]; then
  log "Restart-only: restarting registry-api on ${SSH_TARGET}..."
  ssh "$SSH_TARGET" "sudo systemctl restart registry-api"
  log "Done."
  exit 0
fi

# 1. Build locally
log "Installing deps + building (turbo)..."
pnpm install --frozen-lockfile
pnpm turbo run build

# 2. Sync (excluding node_modules, .git, dev artefacts; preserve server-side .env files).
log "Syncing to ${SSH_TARGET}:${DEPLOY_DIR}/..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='**/node_modules' \
  --exclude='*.test.*' \
  --exclude='*.spec.*' \
  --exclude='apps/web/test-results' \
  --exclude='apps/web/playwright-report' \
  --exclude='apps/api/coverage' \
  --exclude='apps/web/coverage' \
  --exclude='apps/api/.env' \
  --exclude='apps/api/.env.*.local' \
  --exclude='apps/web/.env' \
  --exclude='apps/web/.env.*' \
  ./ "${SSH_TARGET}:${DEPLOY_DIR}/"

# 3. Install runtime deps + run migrations on server.
log "Installing prod deps + running prisma migrate deploy on server..."
ssh "$SSH_TARGET" "cd ${DEPLOY_DIR} && \
  pnpm install --frozen-lockfile --prod && \
  pnpm --filter=@registry/api exec prisma migrate deploy"

# 4. Restart service (idempotent).
log "Restarting registry-api..."
ssh "$SSH_TARGET" "sudo systemctl restart registry-api"

log "Deployed to ${DEPLOY_HOST}."

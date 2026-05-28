#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Windows deploy — registry-functions → FTS prod (nssm)
#
# Single-service deploy modeled after the multi-service
# miudol-tables/scripts/ci-cd/deploy.sh. Pinned to one service
# (registry-functions); every hardcoded constant from the reference
# is exposed as an env var so this script can be retargeted without
# editing.
#
# Commands:
#   deploy   (default)            Build + zip + scp + extract + restart + health
#   versions                      List backups on the remote
#   revert [N]                    Roll back to backup N (latest if omitted)
#   --help | -h                   Show usage and resolved env vars
#   --dry-run                     Resolve env, run pre-flight checks, do NOT deploy
#
# Env vars (defaults match the FTS prod layout):
#   SSH_HOST              ssh alias / host       (default: fts)
#   REMOTE_DIR            service tree root      (default: /d/services/registry-functions)
#   OLD_DIR               backup root            (default: ${REMOTE_DIR}/old)
#   SEVEN_ZIP             7-Zip path on remote   (default: '"/c/Program Files/7-Zip/7z.exe"')
#   PORT                  health check port      (default: 8019)
#   INCLUDE_NODE_MODULES  1 = include prod NM    (default: 0)
#   SERVICE_NAME          nssm service name      (default: registry-functions)
#   KEEP_BACKUPS          how many to retain     (default: 10)
#   HEALTH_PATH           health endpoint path   (default: /v1/health)
#
# Mount once on the server: see deploy/scripts/MOUNT-FTS.md.
# ============================================================

# ---- repo root (deploy/scripts/ → repo root) ----
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# ---- env-driven config (sensible FTS-prod defaults) ----
SSH_HOST="${SSH_HOST:-fts}"
REMOTE_DIR="${REMOTE_DIR:-/d/services/registry-functions}"
OLD_DIR="${OLD_DIR:-${REMOTE_DIR}/old}"
SEVEN_ZIP="${SEVEN_ZIP:-\"/c/Program Files/7-Zip/7z.exe\"}"
PORT="${PORT:-8019}"
INCLUDE_NODE_MODULES="${INCLUDE_NODE_MODULES:-0}"
SERVICE_NAME="${SERVICE_NAME:-registry-functions}"
KEEP_BACKUPS="${KEEP_BACKUPS:-10}"
HEALTH_PATH="${HEALTH_PATH:-/v1/health}"

ZIP_NAME="${SERVICE_NAME}-deploy.zip"
LOCAL_ZIP="${BASE}/${ZIP_NAME}"

# ---- colours / logging (matches reference deploy.sh) ----
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; NC=''
fi

log()  { printf '%b[%s]%b %s\n' "$CYAN"  "$(date +%H:%M:%S)" "$NC" "$*"; }
ok()   { printf '%b[OK]%b %s\n'   "$GREEN" "$NC" "$*"; }
warn() { printf '%b[WARN]%b %s\n' "$YELLOW" "$NC" "$*"; }
fail() { printf '%b[FAIL]%b %s\n' "$RED" "$NC" "$*" >&2; exit 1; }

# ---- cleanup local zip on exit (success or failure) ----
cleanup_local_zip() {
  if [ -f "$LOCAL_ZIP" ]; then
    rm -f "$LOCAL_ZIP" 2>/dev/null || true
  fi
}
trap cleanup_local_zip EXIT

# ---- usage / dry-run ----
print_usage() {
  cat <<EOF
Windows deploy — single-service wrapper for ${SERVICE_NAME}.

Usage:
  ${0##*/}                   Full build + deploy + health check
  ${0##*/} deploy            Same as above
  ${0##*/} versions          List remote backups
  ${0##*/} revert [N]        Roll back to backup N (latest if omitted)
  ${0##*/} --dry-run         Pre-flight checks; print plan; no side effects
  ${0##*/} -h | --help       This help

Resolved env vars (override any with VAR=val ${0##*/} ...):
  SSH_HOST              ${SSH_HOST}
  REMOTE_DIR            ${REMOTE_DIR}
  OLD_DIR               ${OLD_DIR}
  SEVEN_ZIP             ${SEVEN_ZIP}
  PORT                  ${PORT}
  HEALTH_PATH           ${HEALTH_PATH}
  INCLUDE_NODE_MODULES  ${INCLUDE_NODE_MODULES}
  SERVICE_NAME          ${SERVICE_NAME}
  KEEP_BACKUPS          ${KEEP_BACKUPS}

Repo root (auto-detected): ${BASE}
EOF
}

# ---- parse args ----
CMD="deploy"
ARG=""
DRY_RUN=0
while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help)   print_usage; exit 0 ;;
    --dry-run)   DRY_RUN=1; shift ;;
    deploy)      CMD="deploy"; shift ;;
    versions)    CMD="versions"; shift ;;
    revert)      CMD="revert"; shift; ARG="${1:-}"; [ -n "$ARG" ] && shift || true ;;
    *)           fail "unknown arg: $1 (try --help)" ;;
  esac
done

# ---- ssh helper (single source of truth for the connect-timeout) ----
rssh() { ssh -o ConnectTimeout=5 "$SSH_HOST" "$@"; }

# ---- preflight: check local repo state + tools ----
preflight_local() {
  command -v pnpm >/dev/null 2>&1 || fail "pnpm not on PATH"
  command -v zip  >/dev/null 2>&1 || fail "zip not on PATH (apt install zip / brew install zip)"
  command -v scp  >/dev/null 2>&1 || fail "scp not on PATH"
  [ -f "$BASE/package.json" ]    || fail "repo root sanity check failed: $BASE/package.json missing"
  [ -f "$BASE/turbo.json" ]      || fail "expected turbo.json at $BASE"
  [ -f "$BASE/pnpm-lock.yaml" ]  || fail "expected pnpm-lock.yaml at $BASE"
}

# ---- preflight: ssh reachable ----
preflight_ssh() {
  log "Testing SSH connection to ${SSH_HOST}..."
  rssh 'echo ok' >/dev/null 2>&1 || fail "Cannot SSH to $SSH_HOST"
  ok "SSH connection OK"
}

# ---- build locally ----
build() {
  log "pnpm install --frozen-lockfile..."
  ( cd "$BASE" && pnpm install --frozen-lockfile )
  ok "Dependencies installed"

  log "pnpm turbo run build..."
  ( cd "$BASE" && pnpm turbo run build )
  ok "Build complete"

  # Built artefacts must exist after turbo.
  [ -d "$BASE/apps/api/dist" ] || fail "missing apps/api/dist after build"
  [ -d "$BASE/apps/web/dist" ] || fail "missing apps/web/dist after build"
  [ -f "$BASE/apps/api/dist/main.js" ] || warn "apps/api/dist/main.js not present — verify nest build output path"

  if [ "$INCLUDE_NODE_MODULES" = "1" ]; then
    [ -d "$BASE/node_modules" ] || fail "INCLUDE_NODE_MODULES=1 but node_modules missing"
  fi
}

# ---- pack the archive ----
pack() {
  log "Creating ${ZIP_NAME}..."
  rm -f "$LOCAL_ZIP"

  # Excludes: tests, .git, sourcemaps, .env files, dev-only artefacts.
  # The reference deploy.sh keeps backend/dist + frontend/dist + package.json.
  # We mirror that with our pnpm-monorepo layout.
  local EXCLUDES=(
    -x '*.git/*' -x '*.git*'
    -x '*.env' -x '*.env.*'
    -x '*test-results/*' -x '*playwright-report/*'
    -x '*coverage/*'
    -x '*.test.*' -x '*.spec.*'
    -x '*/__tests__/*'
    -x '*.map'
    -x '*.tsbuildinfo'
    -x '*/.cache/*'
  )

  # Always-included payload: built apps, packages, manifests, deploy scripts.
  local PAYLOAD=(
    apps/api/dist
    apps/api/package.json
    apps/api/db
    apps/api/zod
    apps/api/prisma.config.ts
    apps/web/dist
    apps/web/package.json
    packages
    package.json
    pnpm-lock.yaml
    pnpm-workspace.yaml
    turbo.json
    deploy
  )

  # Skip optional payload entries that simply don't exist (api/zod is not
  # universal); zip otherwise warns & exits with non-zero in -y mode.
  local payload_present=()
  local p
  for p in "${PAYLOAD[@]}"; do
    if [ -e "$BASE/$p" ]; then
      payload_present+=("$p")
    fi
  done

  if [ "$INCLUDE_NODE_MODULES" = "1" ]; then
    log "Including node_modules (this can be ~200MB)"
    payload_present+=(node_modules)
    EXCLUDES+=(-x 'node_modules/.cache/*' -x 'node_modules/.pnpm/*/node_modules/*/test/*')
  fi

  ( cd "$BASE" && zip -qr "$LOCAL_ZIP" "${payload_present[@]}" "${EXCLUDES[@]}" )

  local size
  size=$(du -h "$LOCAL_ZIP" | awk '{print $1}')
  ok "Zip created: ${ZIP_NAME} (${size})"
}

# ---- upload + remote rotate + extract + restart ----
upload_and_swap() {
  log "Ensuring remote dirs exist..."
  rssh "mkdir -p '${REMOTE_DIR}' '${OLD_DIR}'"

  log "Uploading ${ZIP_NAME} to ${SSH_HOST}:${REMOTE_DIR}/..."
  scp -O "$LOCAL_ZIP" "${SSH_HOST}:${REMOTE_DIR}/${ZIP_NAME}"
  ok "Uploaded"

  # ---- backup-rotate, extract, restart ----
  # Idempotent w.r.t. stuck zip: rotate ONLY if the live dist exists, so a
  # previous failed deploy that left only the zip behind doesn't double-rotate.
  log "Rotating backup, extracting, restarting..."
  # Compose the remote script as a heredoc so the shell vars expand locally.
  local remote_script
  remote_script=$(cat <<EOS
set -e
cd '${REMOTE_DIR}'

# Decide if a rotation is warranted (live dist present).
ROTATE=0
if [ -d apps/api/dist ] || [ -d apps/web/dist ]; then ROTATE=1; fi

# Stop the service via services.sh if available, else fall back to nssm.
if command -v services.sh >/dev/null 2>&1; then
  services.sh stop '${SERVICE_NAME}' 2>/dev/null || true
else
  nssm stop '${SERVICE_NAME}' 2>/dev/null || true
fi

if [ "\$ROTATE" -eq 1 ]; then
  NUM=\$(ls -d '${OLD_DIR}/${SERVICE_NAME}-'* 2>/dev/null | wc -l)
  NUM=\$((NUM + 1))
  BACKUP='${OLD_DIR}/${SERVICE_NAME}-'\${NUM}
  mkdir -p "\$BACKUP/apps/api" "\$BACKUP/apps/web"
  if [ -d apps/api/dist ]; then cp -r apps/api/dist "\$BACKUP/apps/api/dist"; fi
  if [ -d apps/web/dist ]; then cp -r apps/web/dist "\$BACKUP/apps/web/dist"; fi
  echo "Backed up to \$BACKUP"

  # Trim oldest backups beyond KEEP_BACKUPS. Numeric sort by trailing -N:
  # we strip the constant prefix so sort sees just the integer.
  PREFIX='${OLD_DIR}/${SERVICE_NAME}-'
  ALL=\$(ls -1d "\${PREFIX}"* 2>/dev/null | sed "s|^\${PREFIX}||" | sort -n)
  COUNT=\$(echo "\$ALL" | grep -c . || true)
  if [ "\$COUNT" -gt ${KEEP_BACKUPS} ]; then
    EXTRA=\$((COUNT - ${KEEP_BACKUPS}))
    echo "\$ALL" | head -n \$EXTRA | while read -r n; do rm -rf "\${PREFIX}\${n}"; done
    echo "Pruned \$EXTRA old backup(s); keeping ${KEEP_BACKUPS}"
  fi
fi

# Wipe live dists and extract over the top.
rm -rf apps/api/dist apps/web/dist
${SEVEN_ZIP} x '${ZIP_NAME}' -y >/dev/null
rm -f '${ZIP_NAME}'

# Optional prod dep install if zip carried node_modules off OR a fresh tree.
if [ "${INCLUDE_NODE_MODULES}" = "1" ]; then
  echo "node_modules came from zip; skipping pnpm install"
else
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile --prod || echo "[WARN] pnpm install --prod failed; service may not start"
  fi
fi

if command -v services.sh >/dev/null 2>&1; then
  services.sh start '${SERVICE_NAME}'
else
  nssm start '${SERVICE_NAME}'
fi
EOS
)
  rssh "$remote_script"
  ok "Remote swap complete"
}

# ---- health check, with rollback to most recent backup on failure ----
health_check() {
  log "Health check: GET http://localhost:${PORT}${HEALTH_PATH} (on ${SSH_HOST})..."
  # The health endpoint must be hit FROM the server (PORT is local to it).
  local code=""
  local attempt
  for attempt in 1 2 3 4 5; do
    sleep 3
    code=$(rssh "curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:${PORT}${HEALTH_PATH}" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
      ok "Health check passed (200) on attempt ${attempt}"
      return 0
    fi
    warn "Attempt ${attempt}/5: got '${code}' — retrying..."
  done

  warn "Health check failed (last code: ${code:-unknown}) — rolling back"
  rollback_latest || warn "Rollback also failed; manual intervention required"
  fail "Deploy failed health check on port ${PORT}${HEALTH_PATH}"
}

# ---- versions: list remote backups ----
list_versions() {
  preflight_ssh
  echo ""
  echo "Backups for ${SERVICE_NAME} under ${OLD_DIR}:"
  echo "---"
  # Numeric sort by trailing -N. Done remotely in one ssh hop to avoid
  # round-trips per backup (matters when there are many versions).
  rssh "set -e
    cd '${OLD_DIR}' 2>/dev/null || { echo '(no backups dir yet)'; exit 0; }
    ls -1d '${SERVICE_NAME}-'* 2>/dev/null | sed 's|^${SERVICE_NAME}-||' | sort -n | while read -r n; do
      d='${SERVICE_NAME}-'\${n}
      api=\$(du -sh \"\$d/apps/api/dist\" 2>/dev/null | cut -f1)
      web=\$(du -sh \"\$d/apps/web/dist\" 2>/dev/null | cut -f1)
      printf '  [%s]  api=%s  web=%s  -> %s\n' \"\$n\" \"\${api:-?}\" \"\${web:-?}\" \"\$d\"
    done"
  echo ""
}

# ---- revert ----
# Print the highest backup index, or empty if none.
latest_backup_n() {
  rssh "ls -1d '${OLD_DIR}/${SERVICE_NAME}-'* 2>/dev/null | sed 's|.*/${SERVICE_NAME}-||' | sort -n | tail -1"
}

rollback_latest() {
  local n
  n=$(latest_backup_n)
  if [ -z "$n" ]; then
    warn "No backups available — cannot rollback"
    return 1
  fi
  do_revert "$n"
}

revert_to() {
  local version="${1:-}"
  preflight_ssh
  if [ -z "$version" ]; then
    log "No version arg — picking latest"
    version=$(latest_backup_n)
    [ -n "$version" ] || fail "No backups found"
  fi

  printf 'Revert %s to backup #%s? [y/N] ' "$SERVICE_NAME" "$version"
  read -r yn
  case "$yn" in [yY]) ;; *) echo "Aborted."; return 0 ;; esac

  do_revert "$version"
}

do_revert() {
  local version="$1"
  local backup="${OLD_DIR}/${SERVICE_NAME}-${version}"

  rssh "test -d '${backup}'" || fail "backup not found: ${backup}"

  log "Stopping ${SERVICE_NAME}..."
  rssh "command -v services.sh >/dev/null 2>&1 && services.sh stop '${SERVICE_NAME}' 2>/dev/null || nssm stop '${SERVICE_NAME}' 2>/dev/null || true"

  log "Restoring dists from ${backup}..."
  rssh "set -e; \
    cd '${REMOTE_DIR}'; \
    rm -rf apps/api/dist apps/web/dist; \
    mkdir -p apps/api apps/web; \
    [ -d '${backup}/apps/api/dist' ] && cp -r '${backup}/apps/api/dist' apps/api/dist; \
    [ -d '${backup}/apps/web/dist' ] && cp -r '${backup}/apps/web/dist' apps/web/dist"

  log "Starting ${SERVICE_NAME}..."
  rssh "command -v services.sh >/dev/null 2>&1 && services.sh start '${SERVICE_NAME}' || nssm start '${SERVICE_NAME}'"

  ok "Reverted ${SERVICE_NAME} to backup #${version}"
}

# ---- dispatch ----
case "$CMD" in
  deploy)
    if [ "$DRY_RUN" -eq 1 ]; then
      print_usage
      echo ""
      log "Dry-run: running local pre-flight checks (no remote calls, no build)..."
      preflight_local
      ok "Local pre-flight OK"
      log "Would: build → zip → scp ${ZIP_NAME} → rotate backup → extract → restart → health check"
      exit 0
    fi
    preflight_local
    preflight_ssh
    echo ""
    echo "=========================================="
    echo " Deploying: ${SERVICE_NAME} → ${SSH_HOST}:${REMOTE_DIR}  (port ${PORT})"
    echo "=========================================="
    build
    pack
    upload_and_swap
    health_check
    echo ""
    ok "============ ${SERVICE_NAME} deployed ============"
    ;;
  versions)
    list_versions
    ;;
  revert)
    revert_to "$ARG"
    ;;
  *)
    print_usage
    exit 1
    ;;
esac

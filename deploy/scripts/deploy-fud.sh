#!/usr/bin/env bash
# ============================================================
# FUD deploy → FTS Windows (nssm)
#
# Параллельный деплой рядом с registry-functions: своя папка, своя
# nssm-служба, свой порт. Раздельная отгрузка dist и node_modules:
#
#   dist          — лёгкий ежедневный зип (~5–15 MB): только apps/*/dist,
#                   manifests, packages/shared/dist. С ним же делается
#                   backup-ротация (старые dist'ы хранятся как FUD-N).
#   modules       — тяжёлый зип (~200 MB): только apps/api/node_modules.
#                   Делается редко — когда поменялся package.json
#                   / pnpm-lock.yaml. Не бэкапится: лёгко восстановить.
#   deploy        — оба сразу. По умолчанию для первого деплоя.
#   versions      — табличка существующих бэкапов на сервере.
#   revert  [N]   — откатить dist на бэкап N (без N — самый свежий).
#                   node_modules не трогаются.
#   prune   <N>   — удалить конкретный бэкап #N.
#   prune --keep K — оставить K самых свежих, остальные удалить.
#   prune --all   — удалить ВСЕ бэкапы (с подтверждением).
#   status        — статус nssm-службы + health-check.
#
# Запускать можно с Linux и из Git Bash на Windows.
#
# Первый раз: deploy/scripts/MOUNT-FUD.md (создать каталог + замонтировать
# nssm-службу). Без этого `deploy` упадёт на проверке REMOTE_DIR.
#
# Все хардкодед-значения вынесены в env vars наверху для лёгкой
# перенастройки без правки скрипта:
#   SERVICE_NAME REMOTE_DIR OLD_DIR PORT HEALTH_PATH KEEP_BACKUPS
#   SSH_HOST SEVEN_ZIP
# ============================================================
set -euo pipefail

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# ---- config (env-overridable) ----
# Имя nssm-службы (lowercase) и каталога на сервере (Uppercase). Сделано по
# требованию: «сервис под это с именем fud», «директория FUD».
SERVICE_NAME="${SERVICE_NAME:-fud}"
SDIR_NAME="${SDIR_NAME:-FUD}"
REMOTE_DIR="${REMOTE_DIR:-/d/services/fts-interacton-tables/${SDIR_NAME}}"
OLD_DIR="${OLD_DIR:-${REMOTE_DIR}/old}"
PORT="${PORT:-5189}"
HEALTH_PATH="${HEALTH_PATH:-/v1/health}"
KEEP_BACKUPS="${KEEP_BACKUPS:-20}"
SSH_HOST="${SSH_HOST:-fts}"
SEVEN_ZIP="${SEVEN_ZIP:-\"/c/Program Files/7-Zip/7z.exe\"}"

DIST_ZIP="${SERVICE_NAME}-dist.zip"
MODULES_ZIP="${SERVICE_NAME}-modules.zip"
LOCAL_DIST_ZIP="${BASE}/${DIST_ZIP}"
LOCAL_MODULES_ZIP="${BASE}/${MODULES_ZIP}"

# ---- colors / logging ----
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; NC=''
fi
log()  { printf '%b[%s]%b %s\n' "$CYAN" "$(date +%H:%M:%S)" "$NC" "$*"; }
ok()   { printf '%b[OK]%b %s\n'   "$GREEN" "$NC" "$*"; }
warn() { printf '%b[WARN]%b %s\n' "$YELLOW" "$NC" "$*"; }
fail() { printf '%b[FAIL]%b %s\n' "$RED" "$NC" "$*" >&2; exit 1; }

# ---- cleanup local zips on exit (success or failure) ----
cleanup_local_zips() {
  rm -f "$LOCAL_DIST_ZIP" "$LOCAL_MODULES_ZIP" 2>/dev/null || true
}
trap cleanup_local_zips EXIT

# ---- shorter ssh helper, single timeout ----
rssh() { ssh -o ConnectTimeout=5 "$SSH_HOST" "$@"; }

# ============================================================
# Pre-flight: local tools + remote reachability + remote layout
# ============================================================
preflight_local() {
  command -v pnpm >/dev/null 2>&1 || fail "pnpm not on PATH. Install: npm i -g pnpm@10.33.2"
  command -v zip  >/dev/null 2>&1 || fail "zip not on PATH. apt install zip / brew install zip / on Windows: use Git Bash (msys ships zip)"
  command -v scp  >/dev/null 2>&1 || fail "scp not on PATH (install OpenSSH client)"
  command -v ssh  >/dev/null 2>&1 || fail "ssh not on PATH"
  [ -f "$BASE/package.json" ]    || fail "Repo root sanity check failed: $BASE/package.json missing"
  [ -f "$BASE/pnpm-lock.yaml" ]  || fail "Expected pnpm-lock.yaml at repo root: $BASE"
  [ -f "$BASE/turbo.json" ]      || fail "Expected turbo.json at repo root: $BASE"
}

preflight_ssh() {
  log "Testing SSH to ${SSH_HOST}..."
  if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$SSH_HOST" 'echo ok' >/dev/null 2>&1; then
    warn "SSH к '${SSH_HOST}' не работает в BatchMode."
    warn "Загрузите ключ в ssh-agent: eval \"\$(ssh-agent -s)\" && ssh-add ~/.ssh/fts"
    fail "SSH недоступен."
  fi
  ok "SSH connection OK"
}

preflight_remote() {
  rssh "test -d '${REMOTE_DIR}'" 2>/dev/null \
    || fail "Каталог '${REMOTE_DIR}' не существует на сервере. См. deploy/scripts/MOUNT-FUD.md (шаг 1)."
}

# ============================================================
# Build (используется обеими ветками — dist и modules)
# ============================================================
build_repo() {
  log "pnpm install --frozen-lockfile..."
  ( cd "$BASE" && pnpm install --frozen-lockfile )
  ok "Dependencies installed"

  log "pnpm turbo run build..."
  ( cd "$BASE" && pnpm turbo run build )
  ok "Build complete"

  [ -d "$BASE/apps/api/dist" ]            || fail "apps/api/dist отсутствует после build"
  [ -d "$BASE/apps/web/dist" ]            || fail "apps/web/dist отсутствует после build"
  [ -d "$BASE/packages/shared/dist" ]     || fail "packages/shared/dist отсутствует после build"
  [ -f "$BASE/apps/api/dist/src/main.js" ] || warn "apps/api/dist/src/main.js не найден — проверь nest-cli.json"
}

# ============================================================
# Pack DIST (минимальный пакет)
# ============================================================
pack_dist() {
  log "Pack ${DIST_ZIP}..."
  rm -f "$LOCAL_DIST_ZIP"

  # Что включаем — только то, что меняется при обычном code-update:
  #   - apps/api/dist (NestJS build)
  #   - apps/api/package.json (нужен runtime — nest читает paths)
  #   - apps/api/db (Prisma schema + migrations + seeds)
  #   - apps/api/prisma.config.ts (если есть)
  #   - apps/web/dist (vite build)
  #   - apps/web/package.json
  #   - packages/shared/dist (workspace dep, импортируется api+web)
  #   - packages/shared/package.json
  #   - корневые манифесты (на сервере НЕ запускаем pnpm install, но prisma и
  #     остальные tools читают эти файлы для resolve workspace-путей).
  local PAYLOAD=(
    apps/api/dist
    apps/api/package.json
    apps/api/db
    apps/web/dist
    apps/web/package.json
    packages/shared/dist
    packages/shared/package.json
    package.json
    pnpm-lock.yaml
    pnpm-workspace.yaml
  )

  # Опциональные пути — добавляем, только если существуют (zip иначе ругается)
  local OPTIONAL=(
    apps/api/prisma.config.ts
    apps/api/zod
    packages/shared/index.d.ts
    packages/shared/index.js
    packages/shared/index.mjs
    packages/shared/index.d.mts
  )

  local present=()
  local p
  for p in "${PAYLOAD[@]}"; do
    [ -e "$BASE/$p" ] && present+=("$p") || fail "ожидался $p, но его нет — переcборка?"
  done
  for p in "${OPTIONAL[@]}"; do
    [ -e "$BASE/$p" ] && present+=("$p")
  done

  # Исключаем мусор, даже если он внутри dist (.map для prod не нужен,
  # tests/__tests__/coverage в dist быть не должно, но на всякий случай).
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

  ( cd "$BASE" && zip -qr "$LOCAL_DIST_ZIP" "${present[@]}" "${EXCLUDES[@]}" )
  local size; size=$(du -h "$LOCAL_DIST_ZIP" | awk '{print $1}')
  ok "${DIST_ZIP} собран (${size})"
}

# ============================================================
# Pack NODE_MODULES (отдельный тяжёлый пакет)
# ============================================================
pack_modules() {
  log "Pack ${MODULES_ZIP}..."
  rm -f "$LOCAL_MODULES_ZIP"

  [ -d "$BASE/node_modules" ] || fail "Корневой node_modules отсутствует — сначала 'pnpm install'"

  # На сервере pnpm нет, поэтому везём весь dependency-дерево корневой папки.
  # node_modules/.cache не нужен в проде.
  local EXCLUDES=(
    -x 'node_modules/.cache/*'
    -x '*.map'
  )

  ( cd "$BASE" && zip -qr "$LOCAL_MODULES_ZIP" node_modules apps/api/node_modules apps/web/node_modules packages/shared/node_modules "${EXCLUDES[@]}" 2>/dev/null \
    || zip -qr "$LOCAL_MODULES_ZIP" node_modules "${EXCLUDES[@]}" )

  local size; size=$(du -h "$LOCAL_MODULES_ZIP" | awk '{print $1}')
  ok "${MODULES_ZIP} собран (${size})"
}

# ============================================================
# DIST: upload → rotate → extract → restart → health
# ============================================================
upload_dist() {
  log "Upload ${DIST_ZIP} → ${SSH_HOST}:${REMOTE_DIR}/..."
  scp -O "$LOCAL_DIST_ZIP" "${SSH_HOST}:${REMOTE_DIR}/${DIST_ZIP}"
  ok "Uploaded"

  log "Remote: stop service, rotate backup, extract..."
  local remote_script
  remote_script=$(cat <<EOS
set -e
cd '${REMOTE_DIR}'

# Backup-ротация только если live dist уже есть (первый деплой пропустит).
ROTATE=0
if [ -d apps/api/dist ] || [ -d apps/web/dist ] || [ -d packages/shared/dist ]; then ROTATE=1; fi

nssm stop '${SERVICE_NAME}' 2>/dev/null || true

if [ "\$ROTATE" -eq 1 ]; then
  NUM=\$(ls -1d '${OLD_DIR}/${SERVICE_NAME}-'* 2>/dev/null | sed 's|.*/${SERVICE_NAME}-||' | sort -n | tail -1)
  NUM=\${NUM:-0}
  NUM=\$((NUM + 1))
  BACKUP='${OLD_DIR}/${SERVICE_NAME}-'\${NUM}
  mkdir -p "\$BACKUP/apps/api" "\$BACKUP/apps/web" "\$BACKUP/packages/shared"
  [ -d apps/api/dist ]        && cp -r apps/api/dist        "\$BACKUP/apps/api/dist"        || true
  [ -d apps/web/dist ]        && cp -r apps/web/dist        "\$BACKUP/apps/web/dist"        || true
  [ -d packages/shared/dist ] && cp -r packages/shared/dist "\$BACKUP/packages/shared/dist" || true
  echo "Backed up to FUD-\$NUM"

  # Авто-прун: оставляем KEEP_BACKUPS самых свежих.
  PREFIX='${OLD_DIR}/${SERVICE_NAME}-'
  ALL=\$(ls -1d "\${PREFIX}"* 2>/dev/null | sed "s|^\${PREFIX}||" | sort -n)
  COUNT=\$(printf '%s\n' "\$ALL" | grep -c . || true)
  if [ "\$COUNT" -gt ${KEEP_BACKUPS} ]; then
    EXTRA=\$((COUNT - ${KEEP_BACKUPS}))
    printf '%s\n' "\$ALL" | head -n \$EXTRA | while read -r n; do
      rm -rf "\${PREFIX}\${n}"
    done
    echo "Auto-pruned \$EXTRA old backup(s); keeping ${KEEP_BACKUPS}"
  fi
fi

# Чистим live dist'ы и извлекаем поверх. node_modules не трогаем!
rm -rf apps/api/dist apps/web/dist packages/shared/dist
${SEVEN_ZIP} x '${DIST_ZIP}' -y >/dev/null
rm -f '${DIST_ZIP}'

nssm start '${SERVICE_NAME}' 2>/dev/null || echo "WARN: nssm start не сработал — служба может быть не замонтирована"
EOS
)
  rssh "$remote_script"
  ok "Remote dist swap complete"
}

# ============================================================
# MODULES: upload → stop → wipe → extract → start
# (Без бэкапа: модули воспроизводимы из pnpm-lock; бэкап-папка
#  весом ~200 MB × N версий быстро забьёт диск.)
# ============================================================
upload_modules() {
  log "Upload ${MODULES_ZIP} → ${SSH_HOST}:${REMOTE_DIR}/..."
  scp -O "$LOCAL_MODULES_ZIP" "${SSH_HOST}:${REMOTE_DIR}/${MODULES_ZIP}"
  ok "Uploaded"

  log "Remote: stop service, wipe node_modules, extract..."
  local remote_script
  remote_script=$(cat <<EOS
set -e
cd '${REMOTE_DIR}'

nssm stop '${SERVICE_NAME}' 2>/dev/null || true

# Целиком чистим — pnpm с разным lockfile может оставить старые версии,
# которые поломают runtime через старые версии в .pnpm/.
rm -rf node_modules apps/*/node_modules packages/*/node_modules

${SEVEN_ZIP} x '${MODULES_ZIP}' -y >/dev/null
rm -f '${MODULES_ZIP}'

nssm start '${SERVICE_NAME}' 2>/dev/null || echo "WARN: nssm start не сработал — служба может быть не замонтирована"
EOS
)
  rssh "$remote_script"
  ok "Remote node_modules swap complete"
}

# ============================================================
# Health check + rollback at failure (только для dist-deploy)
# ============================================================
health_check_with_rollback() {
  log "Health: GET http://localhost:${PORT}${HEALTH_PATH} on ${SSH_HOST}..."
  local code="" attempt
  for attempt in 1 2 3 4 5; do
    sleep 3
    code=$(rssh "curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:${PORT}${HEALTH_PATH}" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
      ok "Health OK (200) на попытке ${attempt}"
      return 0
    fi
    warn "Попытка ${attempt}/5: код '${code}' — повтор..."
  done
  warn "Health не прошёл (последний код: ${code:-unknown}) — откат на последний бэкап"
  cmd_revert "" || warn "Откат не удался; нужна ручная разборка"
  fail "Deploy зафейлил health-check на порту ${PORT}${HEALTH_PATH}"
}

# ============================================================
# VERSIONS: список бэкапов
# ============================================================
cmd_versions() {
  preflight_ssh
  echo ""
  echo "Backups for ${SERVICE_NAME} в ${OLD_DIR}:"
  echo "------------------------------------------------------------"
  rssh "set -e
    cd '${OLD_DIR}' 2>/dev/null || { echo '(пока нет бэкапов)'; exit 0; }
    ls -1d '${SERVICE_NAME}-'* 2>/dev/null | sed 's|^${SERVICE_NAME}-||' | sort -n | while read -r n; do
      d='${SERVICE_NAME}-'\${n}
      api=\$(du -sh \"\$d/apps/api/dist\" 2>/dev/null | cut -f1)
      web=\$(du -sh \"\$d/apps/web/dist\" 2>/dev/null | cut -f1)
      shr=\$(du -sh \"\$d/packages/shared/dist\" 2>/dev/null | cut -f1)
      mtime=\$(stat -c '%y' \"\$d\" 2>/dev/null | cut -d. -f1)
      printf '  [%-3s]  api=%s  web=%s  shared=%s  %s\n' \"\$n\" \"\${api:-?}\" \"\${web:-?}\" \"\${shr:-?}\" \"\${mtime}\"
    done"
  echo ""
}

# ============================================================
# REVERT: откатить dist на конкретный бэкап
# ============================================================
latest_backup_n() {
  rssh "ls -1d '${OLD_DIR}/${SERVICE_NAME}-'* 2>/dev/null | sed 's|.*/${SERVICE_NAME}-||' | sort -n | tail -1"
}

cmd_revert() {
  local version="${1:-}"
  preflight_ssh
  preflight_remote
  if [ -z "$version" ]; then
    log "Версия не указана — беру самый свежий бэкап"
    version=$(latest_backup_n)
    [ -n "$version" ] || fail "Нет ни одного бэкапа в ${OLD_DIR}"
  fi
  local backup="${OLD_DIR}/${SERVICE_NAME}-${version}"
  rssh "test -d '${backup}'" || fail "Бэкап не найден: ${backup}"

  printf "Откатить %s на FUD-%s? [y/N] " "$SERVICE_NAME" "$version"
  read -r yn
  case "$yn" in [yY]) ;; *) echo "Отмена."; return 0 ;; esac

  log "Stop ${SERVICE_NAME}..."
  rssh "nssm stop '${SERVICE_NAME}' 2>/dev/null || true"

  log "Restore dist из ${backup}..."
  rssh "set -e
    cd '${REMOTE_DIR}'
    rm -rf apps/api/dist apps/web/dist packages/shared/dist
    mkdir -p apps/api apps/web packages/shared
    [ -d '${backup}/apps/api/dist' ]        && cp -r '${backup}/apps/api/dist'        apps/api/dist
    [ -d '${backup}/apps/web/dist' ]        && cp -r '${backup}/apps/web/dist'        apps/web/dist
    [ -d '${backup}/packages/shared/dist' ] && cp -r '${backup}/packages/shared/dist' packages/shared/dist"

  log "Start ${SERVICE_NAME}..."
  rssh "nssm start '${SERVICE_NAME}' 2>/dev/null || true"
  ok "${SERVICE_NAME} откачен на FUD-${version}"
}

# ============================================================
# PRUNE: удалить старый dist
#   prune <N>          — удалить конкретный
#   prune --keep K     — оставить K самых свежих
#   prune --all        — удалить всё (с подтверждением)
# ============================================================
cmd_prune() {
  preflight_ssh
  case "${1:-}" in
    "")
      echo "Usage: $0 prune <N> | --keep K | --all"
      cmd_versions
      return 1
      ;;
    --all)
      printf "Удалить ВСЕ бэкапы %s? [y/N] " "$SERVICE_NAME"
      read -r yn
      case "$yn" in [yY]) ;; *) echo "Отмена."; return 0 ;; esac
      rssh "rm -rf '${OLD_DIR}/${SERVICE_NAME}-'*"
      ok "Все бэкапы удалены"
      ;;
    --keep)
      local K="${2:-}"
      [[ "$K" =~ ^[0-9]+$ ]] || fail "Usage: $0 prune --keep <number>"
      local removed
      removed=$(rssh "set -e
        cd '${OLD_DIR}' 2>/dev/null || exit 0
        ALL=\$(ls -1d '${SERVICE_NAME}-'* 2>/dev/null | sed 's|^${SERVICE_NAME}-||' | sort -n)
        COUNT=\$(printf '%s\n' \"\$ALL\" | grep -c . || true)
        if [ \"\$COUNT\" -gt ${K} ]; then
          EXTRA=\$((COUNT - ${K}))
          printf '%s\n' \"\$ALL\" | head -n \$EXTRA | while read -r n; do
            rm -rf '${SERVICE_NAME}-'\${n}
            echo \"removed FUD-\${n}\"
          done
        else
          echo \"nothing to remove (have \$COUNT, keep ${K})\"
        fi")
      printf '%s\n' "$removed"
      ok "Prune --keep ${K} done"
      ;;
    *)
      local N="$1"
      [[ "$N" =~ ^[0-9]+$ ]] || fail "Аргумент должен быть номером версии (или --keep K / --all)"
      rssh "test -d '${OLD_DIR}/${SERVICE_NAME}-${N}'" || fail "Бэкап FUD-${N} не найден"
      printf "Удалить бэкап FUD-%s? [y/N] " "$N"
      read -r yn
      case "$yn" in [yY]) ;; *) echo "Отмена."; return 0 ;; esac
      rssh "rm -rf '${OLD_DIR}/${SERVICE_NAME}-${N}'"
      ok "FUD-${N} удалён"
      ;;
  esac
}

# ============================================================
# STATUS
# ============================================================
cmd_status() {
  preflight_ssh
  echo ""
  log "nssm status:"
  rssh "nssm status '${SERVICE_NAME}' 2>&1 | tr -d '\0' | sed 's/^/  /' || true"
  log "Health-check (http://localhost:${PORT}${HEALTH_PATH}):"
  local code
  code=$(rssh "curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:${PORT}${HEALTH_PATH}" 2>/dev/null || echo "000")
  echo "  HTTP ${code}"
  log "Listening ports:"
  rssh "netstat -ano 2>/dev/null | grep ':${PORT} ' | sed 's/^/  /' || echo '  (порт ${PORT} не слушают)'"
  echo ""
}

# ============================================================
# Main dispatch
# ============================================================
print_usage() {
  cat <<EOF
FUD parallel deploy → FTS Windows

Команды:
  $(basename "$0") deploy                Build → ship dist + node_modules → restart → health
  $(basename "$0") dist                  Build → ship только dist (без modules)
  $(basename "$0") modules               Build → ship только node_modules (без dist)
  $(basename "$0") versions              Список бэкапов на сервере
  $(basename "$0") revert [N]            Откатить dist на бэкап N (без N — самый свежий)
  $(basename "$0") prune <N>             Удалить бэкап N
  $(basename "$0") prune --keep K        Оставить K самых свежих
  $(basename "$0") prune --all           Удалить ВСЕ бэкапы
  $(basename "$0") status                Статус службы + health
  $(basename "$0") --dry-run             Только pre-flight (без побочек)
  $(basename "$0") --help                Эта помощь

Resolved env:
  SERVICE_NAME=${SERVICE_NAME}
  REMOTE_DIR=${REMOTE_DIR}
  OLD_DIR=${OLD_DIR}
  PORT=${PORT}
  HEALTH_PATH=${HEALTH_PATH}
  KEEP_BACKUPS=${KEEP_BACKUPS}
  SSH_HOST=${SSH_HOST}
  BASE=${BASE}

Первый раз: deploy/scripts/MOUNT-FUD.md.
EOF
}

# --- arg parse ---
DRY_RUN=0
positional=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) print_usage; exit 0 ;;
    *) positional+=("$arg") ;;
  esac
done
set -- "${positional[@]}"
CMD="${1:-deploy}"
ARG1="${2:-}"
ARG2="${3:-}"

# --dry-run: только pre-flight + план
if [ "$DRY_RUN" = "1" ]; then
  print_usage
  echo ""
  log "Dry-run: checks only, no remote side effects"
  preflight_local
  preflight_ssh
  preflight_remote
  ok "All pre-flight checks passed. Would run: $CMD ${ARG1} ${ARG2}"
  exit 0
fi

case "$CMD" in
  deploy)
    preflight_local; preflight_ssh; preflight_remote
    echo ""
    echo "================================================================"
    echo " Deploying ${SERVICE_NAME} (dist + node_modules) → ${SSH_HOST}:${REMOTE_DIR}"
    echo "================================================================"
    build_repo
    pack_dist
    pack_modules
    upload_dist
    upload_modules
    health_check_with_rollback
    echo ""
    ok "============ ${SERVICE_NAME} deployed (full) ============"
    ;;
  dist)
    preflight_local; preflight_ssh; preflight_remote
    echo ""
    echo "================================================================"
    echo " Deploying ${SERVICE_NAME} (dist only) → ${SSH_HOST}:${REMOTE_DIR}"
    echo "================================================================"
    build_repo
    pack_dist
    upload_dist
    health_check_with_rollback
    echo ""
    ok "============ ${SERVICE_NAME} deployed (dist only) ============"
    ;;
  modules)
    preflight_local; preflight_ssh; preflight_remote
    echo ""
    echo "================================================================"
    echo " Deploying ${SERVICE_NAME} (node_modules only) → ${SSH_HOST}:${REMOTE_DIR}"
    echo "================================================================"
    # Для модулей build необязателен, но без него node_modules может быть
    # битый/неполный; запустим pnpm install сами.
    log "pnpm install --frozen-lockfile..."
    ( cd "$BASE" && pnpm install --frozen-lockfile )
    ok "Dependencies installed"
    pack_modules
    upload_modules
    health_check_with_rollback
    echo ""
    ok "============ ${SERVICE_NAME} deployed (modules only) ============"
    ;;
  versions)
    cmd_versions
    ;;
  revert)
    cmd_revert "$ARG1"
    ;;
  prune)
    cmd_prune "$ARG1" "$ARG2"
    ;;
  status)
    cmd_status
    ;;
  *)
    print_usage
    exit 1
    ;;
esac

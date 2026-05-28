# MOUNT-FUD — одноразовая регистрация `fud` на FTS Windows

Выполняется **один раз** перед первым `pnpm deploy:fud`. Дальнейшие деплои
делает `deploy/scripts/deploy-fud.sh` без ручных шагов на сервере.

## Конвенция

| Поле | Значение | Где используется |
|---|---|---|
| nssm-служба | `fud` (lowercase) | `nssm.exe install fud …` |
| Каталог на сервере | `FUD` (uppercase) | `D:\services\fts-interacton-tables\FUD\` |
| Порт | `5189` | nssm-Description-тег + health |
| База данных MySQL | `fud_functions` | `apps/api/.env` |
| Логи приложения | `apps/api/logs/` (см. `LOGS_DIR` в `apps/api/src/common/config/logging-config.ts`) | pino пишет приложение |
| Логи nssm (stdout/stderr) | **те же** `apps/api/logs/` (`fud-stdout.log`, `fud-stderr.log`) | nssm `AppStdout` / `AppStderr` |
| Лимит размера лога | 100 MB на файл, авторотация онлайн | nssm `AppRotateBytes 104857600` |

Все параметры взяты с шаблона `scripts/ci-cd/services.sh::cmd_mount()` из
**miudol-tables** (внешний tool, лежит на FTS-сервере по PATH).

---

## 0. Предусловия

- SSH-ключ для FTS лежит в `~/.ssh/fts`, alias `fts` прописан в `~/.ssh/config`.
- На FTS-боксе уже стоят: `node v24.x`, `npm`, `nssm`, `7-Zip`, `MySQL 9.6 client`.
- На FTS-боксе **НЕТ** интернета — поэтому каждый `pnpm deploy:fud` несёт с
  собой `node_modules` (или ставит их отдельно командой `pnpm deploy:fud:modules`).

---

## 1. Создать каталог на сервере

С Linux (или Git Bash на Windows):

```bash
ssh fts "mkdir -p /d/services/fts-interacton-tables/FUD/{apps/api,apps/web,packages/shared,old}"
ssh fts "mkdir -p /d/services/fts-interacton-tables/FUD/apps/api/logs"
```

`logs/` обязательно создаётся заранее — иначе nssm создаст саму папку, но
приложение pino-логгер может упасть при попытке записать в ещё-не-существующий
файл.

---

## 2. Создать БД и положить production `.env`

Создать БД (один раз):

```bash
ssh fts "mysql -uservices_development -pTrollingLeFBI -e \
  'CREATE DATABASE IF NOT EXISTS fud_functions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'"
```

Залить `.env` через STDIN (чтобы секреты не оставались в локальной FS):

```bash
ssh fts 'cat > /d/services/fts-interacton-tables/FUD/apps/api/.env' <<'EOF'
NODE_ENV=production
NODE_HOST=127.0.0.1
NODE_HTTP_PORT=5189

# Куда приложение пишет pino-логи. nssm-stdout/stderr ниже укажем
# на ЭТУ ЖЕ папку — чтобы все логи службы лежали в одном месте.
LOGS_DIR=logs
PINO_LOG_LEVEL=info

DATABASE_USER=services_development
DATABASE_PASSWORD=TrollingLeFBI
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=fud_functions
DATABASE_URL=mysql://services_development:TrollingLeFBI@127.0.0.1:3306/fud_functions?connection_limit=20

# Остальные обязательные ENV из apps/api/.env.example
# (JWT/Cookie/etc. валидатор требует ненулевых значений, см. apps/api/.env.example).
EOF
```

---

## 3. Первый раз: отправить файлы (build будет, mount ещё нет)

С dev-машины (Linux или Windows Git Bash):

```bash
pnpm deploy:fud:dry      # проверки: SSH, каталог, инструменты, локальная сборка не запускается
pnpm deploy:fud           # full deploy (dist + node_modules)
```

При первом запуске deploy-скрипт скажет:
> `WARN: nssm start не сработал — служба может быть не замонтирована`

Это ожидаемо. Файлы лягут на место, nssm-служба создаётся в шаге 4.

---

## 4. Замонтировать nssm-службу `fud`

Зайти на FTS-бокс через SSH и выполнить **по образцу `services.sh::cmd_mount()`**.
Логи stdout/stderr направляем в ту же папку, куда приложение пишет
свои pino-логи (`apps/api/logs/`); включаем ротацию nssm с лимитом 100 MB.

```bash
ssh fts
```

Внутри Git Bash на FTS:

```bash
SVC='D:/services/fts-interacton-tables'
APP_DIR="${SVC}/FUD/apps/api"
MAIN="${APP_DIR}/dist/src/main.js"
LOGDIR="${APP_DIR}/logs"

# 1) Установить службу — Node запускает скомпилированный main.js
'/c/Program Files/nssm/nssm.exe' install fud \
  'C:\Program Files\nodejs\node.exe' \
  "$(cygpath -w "$MAIN")"

# 2) Рабочая директория = apps/api (.env читается оттуда)
'/c/Program Files/nssm/nssm.exe' set fud AppDirectory   "$(cygpath -w "$APP_DIR")"

# 3) STDOUT/STDERR в ту же папку, что и логи приложения
'/c/Program Files/nssm/nssm.exe' set fud AppStdout      "$(cygpath -w "$LOGDIR/fud-stdout.log")"
'/c/Program Files/nssm/nssm.exe' set fud AppStderr      "$(cygpath -w "$LOGDIR/fud-stderr.log")"

# 4) Ротация nssm — копия шаблона services.sh::cmd_mount: 100 MB / файл,
#    online (без остановки службы), 1 = on.
'/c/Program Files/nssm/nssm.exe' set fud AppRotateFiles  1
'/c/Program Files/nssm/nssm.exe' set fud AppRotateOnline 1
'/c/Program Files/nssm/nssm.exe' set fud AppRotateBytes  104857600   # 100 MB

# 5) Автозапуск на boot, Description-тег для services.sh-listing
'/c/Program Files/nssm/nssm.exe' set fud Start           SERVICE_AUTO_START
'/c/Program Files/nssm/nssm.exe' set fud Description     'fts:kind=table;port=5189;sdir=FUD'

# 6) Поехали
'/c/Program Files/nssm/nssm.exe' start fud
'/c/Program Files/nssm/nssm.exe' status fud   # → SERVICE_RUNNING
```

После этого `services.sh list` сама подхватит `fud` через тег
`fts:kind=table;port=5189;sdir=FUD` в Description — **отдельно править
services.sh не нужно**, это его контракт обнаружения.

### Альтернатива через `services.sh mount` (НЕ работает as-is для FUD)

В `miudol-tables/scripts/ci-cd/services.sh::cmd_mount()` зашит путь
`backend/dist/backend/src/main.js`, рассчитанный на npm-flat layout
(`<sdir>/backend/`). У FUD — pnpm-monorepo (`<sdir>/apps/api/`), поэтому
вызов `services.sh mount fud FUD 5189 table` создаст службу с НЕВЕРНЫМ
путём к `main.js` и nssm её запустить не сможет.

Если хотите всё-таки через `services.sh`, то после `mount`-а допишите:

```bash
nssm set fud Application      "C:\Program Files\nodejs\node.exe"
nssm set fud AppParameters    "D:\services\fts-interacton-tables\FUD\apps\api\dist\src\main.js"
nssm set fud AppDirectory     "D:\services\fts-interacton-tables\FUD\apps\api"
nssm set fud AppStdout        "D:\services\fts-interacton-tables\FUD\apps\api\logs\fud-stdout.log"
nssm set fud AppStderr        "D:\services\fts-interacton-tables\FUD\apps\api\logs\fud-stderr.log"
```

Прямой блок из шага 4 короче и яснее.

---

## 5. Заполнить БД сидами (один раз)

Сиды лежат в `apps/api/db/seeds/` уже в зипе. С FTS-бокса:

```bash
cd /d/services/fts-interacton-tables/FUD/apps/api
node_modules/.bin/tsx db/seeds/index.ts
```

Если `Cannot find module 'tsx'` — значит ехал `dist`-only без модулей.
Запусти `pnpm deploy:fud:modules` чтобы догнать node_modules.

---

## 6. Health-check

С dev-машины:

```bash
ssh fts "curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5189/v1/health"
# → 200
```

Или через скрипт:

```bash
pnpm deploy:fud:status
```

---

## Откат и история

```bash
pnpm deploy:fud:versions          # таблица бэкапов
pnpm deploy:fud:revert            # откат на самый свежий dist-бэкап
pnpm deploy:fud:revert 5          # откат на конкретную версию

# Чистка старых бэкапов
./deploy/scripts/deploy-fud.sh prune 3            # удалить конкретный
./deploy/scripts/deploy-fud.sh prune --keep 5     # оставить 5 самых свежих
./deploy/scripts/deploy-fud.sh prune --all        # снести все (с подтверждением)
```

Бэкапы лежат в `D:/services/fts-interacton-tables/FUD/old/fud-<N>/`.

---

## Если что-то пошло не так

| Симптом | Что проверить |
|---|---|
| `Cannot find module '@registry/shared'` в логах nssm | `packages/shared/dist` отсутствует на сервере → `pnpm deploy:fud` (full, не dist-only) |
| `EADDRINUSE :5189` | порт занят. `services.sh list` покажет, кто; смени порт в `apps/api/.env` + nssm Description |
| `nssm status` = `SERVICE_PAUSED` | смотри `apps/api/logs/fud-stderr.log` (там и pino, и сам Node stderr) |
| `scp` молча умирает | SSH-ключ не загружен: `eval "$(ssh-agent -s)" && ssh-add ~/.ssh/fts` |
| Health-check fail → автоматический rollback | хорошо — но смотри почему: `ssh fts 'tail -40 /d/services/fts-interacton-tables/FUD/apps/api/logs/fud-stderr.log'` |
| Файлы `*-stdout.log` / `*-stderr.log` бесконечно растут | проверь `nssm.exe get fud AppRotateFiles` (должно быть `1`). Если нет — пере-выполни шаг 4.4 |

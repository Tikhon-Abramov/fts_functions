# Mounting `registry-functions` on the FTS prod server

The FTS prod tooling (`miudol-tables/scripts/ci-cd/services.sh`) auto-discovers
services via the nssm `Description` field (prefix `fts:`). There is no
hardcoded service list to edit — registering a new service is purely a
one-time `nssm install` + `Description` tag step on the server.

This document records the exact commands to run **once**, on the FTS prod
server (alias `fts` → `10.252.63.18`), to register `registry-functions`.
After it's mounted, `services.sh` will pick it up (`services.sh list`,
`services.sh status registry-functions`, `services.sh restart …`, etc.) and
`deploy/scripts/deploy-windows.sh` from this repo will deploy/rotate it.

---

## Why we can't just call `services.sh mount`

The built-in `mount` helper in `services.sh` (lines 184–222) hardcodes a
table-app layout:

```
$root/backend/dist/backend/src/main.js
```

`registry-functions` ships a different layout (Nest API + Vite web,
pnpm-turbo monorepo):

```
apps/api/dist/main.js
apps/web/dist/index.html
```

So the `mount` helper would point nssm at the wrong file. We do the
equivalent steps by hand below, then tag with `kind=app` (the existing
taxonomy uses `kind=table` for the read-only reference tables — `app` is
the right slot for a CRUD service).

If/when the FTS team is willing to extend `services.sh mount` to accept a
`--main` override, this doc can collapse to a single line:
`services.sh mount registry-functions registry-functions 8019 app`.

---

## Pre-requisites

- The repo has been deployed to the server at least once
  (`./deploy/scripts/deploy-windows.sh` from a dev machine), so
  `D:/services/registry-functions/apps/api/dist/main.js`
  exists.
- A free port. The default in this repo is `8019` (matches the dev `/dev/19`
  layout). The FTS taxonomy uses 5004–5012 for tables; `8019` keeps us
  clear of that range. Pick a different port via `PORT=…` if it conflicts —
  remember to update the tag below to match.

## One-time mount commands

Run on the FTS server (Git Bash) **or** from a machine with the `fts` SSH
alias. Adjust `PORT` if `8019` is already taken.

```bash
SVC='D:/services'
NAME='registry-functions'
PORT=8019
SDIR='registry-functions'
KIND='app'
NODE='C:/Program Files/nodejs/node.exe'

ROOT="$SVC/$SDIR"
MAIN="$ROOT/apps/api/dist/main.js"
APPDIR="$ROOT/apps/api"
LOGDIR="$ROOT/logs"
TAG="fts:kind=$KIND;port=$PORT;sdir=$SDIR"

ssh fts "mkdir -p '$LOGDIR'"
ssh fts "nssm install '$NAME' '$NODE' '$MAIN'"
ssh fts "nssm set '$NAME' AppDirectory     '$APPDIR'"
ssh fts "nssm set '$NAME' AppStdout        '$LOGDIR/$NAME-stdout.log'"
ssh fts "nssm set '$NAME' AppStderr        '$LOGDIR/$NAME-stderr.log'"
ssh fts "nssm set '$NAME' AppRotateFiles   1"
ssh fts "nssm set '$NAME' AppRotateOnline  1"
ssh fts "nssm set '$NAME' AppRotateBytes   104857600"
ssh fts "nssm set '$NAME' Start            SERVICE_AUTO_START"
ssh fts "nssm set '$NAME' Description      '$TAG'"
ssh fts "nssm start '$NAME'"
```

Verify the service is auto-discovered:

```bash
services.sh list                       # registry-functions should appear
services.sh status registry-functions  # detailed view
services.sh logs   registry-functions  # pino app log
```

## Initial deploy

From a dev machine in the repo root:

```bash
./deploy/scripts/deploy-windows.sh --help        # show resolved env
PORT=8019 ./deploy/scripts/deploy-windows.sh     # build + push + restart
./deploy/scripts/deploy-windows.sh versions      # list backups
./deploy/scripts/deploy-windows.sh revert        # roll back to most recent
```

## Removing the service

```bash
services.sh remove registry-functions   # interactive prompt; refuses non-fts
```

## Tag taxonomy

Existing `kind=` values in `services.sh`:

| kind      | meaning                                          |
| --------- | ------------------------------------------------ |
| `table`   | Read-only reference-table services (vpd, pmv, …) |
| `app`     | CRUD apps — **registry-functions**               |
| `cache`   | Infra: redis                                     |
| `proxy`   | Infra: nginx                                     |
| `db`      | Infra: MySQL, Postgres                           |
| `storage` | Infra: minio                                     |

`app` is the right slot for `registry-functions`: CRUD service, not a
read-only table.

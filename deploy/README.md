# Deploy

Production deployment of `registry-functions` runs in two layouts:

1. **cats** — Linux box managed by `systemd`. Mounted under nginx at the URL
   prefix `/ck-functions/` and proxied to the Node process on `127.0.0.1:3000`.
2. **fts-server** — Windows box managed by `nssm` (the same SSH alias `fts`
   that the miudol-tables family uses). Two services per app
   (`registry-api`, `registry-web`).

Both targets share the same build output; the deployer scripts package and
ship that output differently. Pick whichever target you have provisioned.

---

## Two deployment targets

### Target A — `cats` (Linux/systemd)

Files:

- `deploy/systemd/registry-api.service` — systemd unit (hardened: `NoNewPrivileges`,
  `ProtectSystem=strict`, `ProtectHome=true`, `PrivateTmp=true`, `MemoryMax=1G`).
- `deploy/scripts/deploy-cats.sh` — bash deployer (build locally → rsync → migrate →
  restart). Idempotent; safe to re-run.

One-time server bootstrap:

```bash
# As root on the cats box:
sudo useradd --system --create-home --shell /bin/false registry
sudo mkdir -p /opt/registry-functions
sudo chown -R registry:registry /opt/registry-functions

# Copy the unit file in place:
sudo cp deploy/systemd/registry-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable registry-api

# Drop the production .env at /opt/registry-functions/apps/api/.env
# (rsync excludes .env files, so they must be installed by hand).
```

Subsequent deploys:

```bash
# From a developer box that has SSH access to the cats host:
DEPLOY_HOST=cats.example.internal ./deploy/scripts/deploy-cats.sh

# Just restart (after, e.g., editing .env on the server):
DEPLOY_HOST=cats.example.internal ./deploy/scripts/deploy-cats.sh --restart-only
```

The script uses `pnpm --filter=@registry/api exec prisma migrate deploy` to
apply pending migrations on the server before the restart.

### Target B — `fts-server` (Windows/nssm)

Files:

- `deploy/scripts/deploy-fts-server.sh` — bash deployer that builds locally,
  packages a 7-Zip archive, ships via SCP, rotates a backup directory on the
  server, extracts, and restarts the `registry-api` + `registry-web` nssm
  services. Mirrors the conventions in
  `miudol-tables/all-projects-20260311/scripts/ci-cd/deploy.sh` (SSH alias
  `fts`, 7-Zip on the server at `/c/Program Files/7-Zip/7z.exe`, per-deploy
  `old/<svc>-<N>` backup rotation).

One-time server bootstrap (Windows-side, via SSH):

```cmd
# Install nssm + 7-Zip on the server.
# Register both services pointing at the deployed dist:
nssm install registry-api "C:\Program Files\nodejs\node.exe" "D:\services\fts-interacton-tables\registry-functions\current\apps\api\dist\main.js"
nssm install registry-web ...
nssm set registry-api AppDirectory D:\services\fts-interacton-tables\registry-functions\current\apps\api
```

Subsequent deploys:

```bash
# From a developer box (~/.ssh/config must define the 'fts' alias).
SSH_HOST=fts ./deploy/scripts/deploy-fts-server.sh

# Restart-only (no rebuild/upload):
SSH_HOST=fts ./deploy/scripts/deploy-fts-server.sh --restart-only
```

---

## SSH key + alias setup

Both deploy scripts assume passwordless SSH (key-based auth):

1. Generate an Ed25519 key pair (skip if you already have one):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/registry_deploy -C "registry-deploy"
   ```
2. Copy the public key to each target:
   ```bash
   ssh-copy-id -i ~/.ssh/registry_deploy.pub registry@cats.example.internal
   ssh-copy-id -i ~/.ssh/registry_deploy.pub deployer@fts.example.internal
   ```
3. Define the `fts` alias in `~/.ssh/config` (used by `deploy-fts-server.sh`):
   ```
   Host fts
     HostName fts.example.internal
     User deployer
     IdentityFile ~/.ssh/registry_deploy
   ```

---

## CI-driven deploys (GitHub Actions)

`.github/workflows/deploy.yml` runs from a `workflow_dispatch` (manual,
choose `cats` or `fts-server`) or automatically on a `v*.*.*` tag push (cats only).

Before the workflow can run, configure the repository's GitHub **Environment**
named `production`:

1. Settings → Environments → New environment → `production`.
2. Add **required reviewers** (one or more team members must approve each
   deploy run). This is the manual approval gate.
3. Optionally set a deployment branch policy (e.g. `main` + `v*.*.*` tags).

### Secrets to configure (Settings → Secrets and variables → Actions → Secrets)

- `DEPLOY_SSH_KEY` — full PEM/OpenSSH private key whose public key was
  installed on both deploy targets via `ssh-copy-id`.

### Variables to configure (Settings → Secrets and variables → Actions → Variables)

**Cats (Linux + systemd) target:**
| Variable | Required? | Default if unset | Purpose |
|---|---|---|---|
| `CATS_DEPLOY_HOST` | ✅ yes | — | Hostname or IP of the cats server |
| `CATS_DEPLOY_USER` | optional | `registry` | SSH user account on the cats server |
| `CATS_DEPLOY_DIR` | optional | `/opt/registry-functions` | Install path on cats |

**Fts-server (Windows + nssm) target:**
| Variable | Required? | Default if unset | Purpose |
|---|---|---|---|
| `FTS_DEPLOY_HOST` | ✅ yes | — | SSH alias or hostname for the Windows server |
| `FTS_DEPLOY_SVC` | optional | `/d/services/fts-interacton-tables/registry-functions` | On-disk service tree on the Windows host |
| `FTS_DEPLOY_SVC_API` | optional | `registry-api` | nssm service name for the API process |
| `FTS_DEPLOY_SVC_WEB` | optional | `registry-web` | nssm service name for the static-web process |
| `FTS_DEPLOY_SEVEN_ZIP` | optional | `"/c/Program Files/7-Zip/7z.exe"` | Path to 7z.exe on the Windows host (must include the surrounding quotes for paths with spaces) |

Variables (not secrets) are fine for hostnames and paths; rotate the SSH key,
not the variables, when access changes.

### Provisioning checklist (one-time, before first deploy)

1. **Generate a deploy SSH keypair** (locally or on a CI machine — never reuse a personal key):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/registry-deploy -N ''
   ```
2. **Install the public key on the cats server**:
   ```bash
   ssh-copy-id -i ~/.ssh/registry-deploy.pub registry@cats.example.internal
   ```
3. **Install the public key on the fts-server** (`~/.ssh/authorized_keys` of the Windows SSH user).
4. **Add the private key to GitHub Secrets** as `DEPLOY_SSH_KEY` (paste the full file contents including the `-----BEGIN/END-----` lines).
5. **Add Variables** per the tables above. At minimum: `CATS_DEPLOY_HOST` for cats target, `FTS_DEPLOY_HOST` for fts-server target.
6. **Configure GitHub Environment `production`**:
   - Settings → Environments → New → `production`
   - Add required reviewers (these people must click Approve on each deploy run)
   - Optional: deployment branch policy (`main` + `v*.*.*` tags only)

### First deploy — local sanity check before GitHub

Before clicking the "Run workflow" button on GitHub, prove the script works
from a local machine that already has SSH access:

```bash
# Cats:
DEPLOY_HOST=cats.example.internal pnpm deploy:cats

# Fts-server:
SSH_HOST=fts pnpm deploy:fts        # uses the 'fts' SSH alias from ~/.ssh/config
```

If either succeeds locally, the GitHub workflow with the same env values
will succeed too — the workflow just runs the same script.

---

## nginx (cats target only)

The nginx snippet lives at `deploy/nginx/ck-functions.conf`. Include it from
your main `nginx.conf` inside an `http { server { ... } }` block:

```nginx
http {
    server {
        listen 80;
        server_name your.host;

        include /path/to/repo/deploy/nginx/ck-functions.conf;
    }
}
```

After editing nginx configuration, reload manually:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

The `alias` path inside the snippet (`/var/www/ck-functions/`) MUST match the
real deploy target where the frontend `dist/` contents are copied.

## Frontend deploy notes

Vite is configured so that `base` switches automatically by mode:

- Dev (`pnpm --filter=@registry/web dev`): `base: '/'` — dev server at `http://127.0.0.1:8787/`.
- Prod (`pnpm --filter=@registry/web build`): `base: '/ck-functions/'` — all asset
  paths in `dist/index.html` are prefixed with `/ck-functions/`.

Build and copy to the cats deploy target:

```bash
cd apps/web
pnpm build
sudo rm -rf /var/www/ck-functions
sudo mkdir -p /var/www/ck-functions
sudo cp -r dist/* /var/www/ck-functions/
```

`apps/web/.env.production` sets `VITE_API_BASE_URL=/ck-functions` (a relative
path). nginx handles proxying `/ck-functions/api/...` to the backend.

## Backend run command (cats; manual fallback)

The `registry-api.service` unit handles this normally. Manual run for debugging:

```bash
cd apps/api
NODE_ENV=production node dist/main.js
```

NOTE: `apps/api/src/main.ts` does NOT set a NestJS global prefix. nginx strips
the `/ck-functions` prefix before proxying to the backend, so backend routes
(including `api/docs`, `api/json`, `api/yaml`, and versioned routes `/v1/...`)
stay as-is.

## Health endpoint

`GET /v1/health` (added in this iteration) returns
`{ status, version, uptime, db }` and is intentionally unauthenticated so
reverse-proxies and uptime monitors can probe it without credentials.

If/when the `AuthModule` lands (see `docs/known-limitations.md` §
Authentication + authorisation), the health controller MUST be allow-listed
explicitly so the probe doesn't regress behind auth.

## Deploy gotchas

- nginx must be reloaded manually after changes (`sudo systemctl reload nginx`).
- Ensure the `alias` path in `ck-functions.conf` and the frontend copy target
  in the deploy step stay in sync.
- The trailing slash on `proxy_pass http://127.0.0.1:3000/api/;` is important:
  it rewrites `/ck-functions/api/foo` to `/api/foo` on the backend.
- If you move the backend off `127.0.0.1:3000`, update the three `proxy_pass`
  lines in `ck-functions.conf`.
- The fts-server script keeps every previous deploy under `old/current-N`. Prune
  manually if disk usage becomes an issue.

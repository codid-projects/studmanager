# Docker deployment — StudManagerWeb

Next.js 16 (App Router) + React 19 + pnpm, built into a standalone runtime image,
pushed to `registry.studmarket.net` by Azure Pipelines and run on the Contabo VPS
via Portainer.

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | 3-stage build: `deps` → `builder` → `runner` (standalone, non-root) |
| `docker-entrypoint.sh` | Validates `STUDMANAGER_API_URL` at container start |
| `.dockerignore` | Keeps `node_modules`, `.env*`, docs and stray assets out of the build context |
| `azure-pipelines.yml` | CI: build and push `registry.studmarket.net/studmanager-web` |
| `portainer-stack.yml` | **Pull-only stack to paste into Portainer on the VPS** |
| `docker-compose.yml` | Local equivalent, with a `build:` block for `docker compose build` |
| `.env.example` | Template for the stack's environment variables |

`next.config.js` also gained `output: 'standalone'` — the runner stage depends on it.

## Environment variables — build-time vs runtime

This is the one thing to get right.

| Variable | When it applies | Notes |
|---|---|---|
| `STUDMANAGER_API_URL` | **Runtime** | The backend the server-side proxy talks to. Set it in the Portainer stack; no rebuild needed. Default `https://api-pro.studmanager.net`. |
| `IMAGE_TAG` | Runtime | Which pushed tag the stack runs. `latest`, or a `$(Build.BuildId)` to roll back. |
| `NPM_NETWORK` | Runtime | The Nginx Proxy Manager docker network to join. |
| `PORT` / `HOSTNAME` | Runtime | Default `3000` / `0.0.0.0`. |
| `NEXT_PUBLIC_STUDMANAGER_API_MODE` | **Build time only** | Pipeline variable `apiMode`. Keep it at `server` for production. |

### How the URL stays runtime-settable

The production image is built in `server` transport mode. Browser requests go to
same-origin Next API routes, and those routes read `STUDMANAGER_API_URL` on the
server at runtime. The backend host is therefore not baked into the browser
bundle.

Two consequences worth knowing:

- It applies on **container recreate** (compose up / Portainer redeploy), not on a bare
  `docker restart` - a restart cannot change env vars anyway.
- The legacy entrypoint placeholder replacement remains idempotent for older/direct
  images, but the current production path does not require exposing the backend URL
  as a `NEXT_PUBLIC_*` value.

An invalid value (not starting with `http://` or `https://`) fails the container at
startup rather than producing a broken `new URL()` at runtime.

### Why production uses server mode

`direct` = browser calls the API host itself. `server` = browser calls Next's own
`/api/*` routes, which forward to the API. Production uses `server` mode so the
public site avoids backend CORS and does not hardcode the API host into browser
requests.

The generic `/api/proxy` route handles client API calls that do not have a
dedicated `route.ts` yet, and `/api/backend-media` proxies relative backend media
paths.

Note: `pnpm api:direct` / `pnpm api:server` write `.env.local`. That file is excluded
by `.dockerignore` on purpose, so a stale local copy can never override the build args.

## Pipeline setup (one time)

Create it from **Pipelines → New pipeline → Azure Repos Git → StudManagerWeb →
Existing YAML file → `/azure-pipelines.yml`**.

No pipeline variables or secrets are needed: authentication goes through the
**`DockerRegistry`** Docker Registry service connection
(*Project settings → Service connections*). If that connection is ever renamed,
update `dockerRegistryConnection` in `azure-pipelines.yml`.

The first run will ask for permission to use the service connection — approve it once.

Pointing at a different backend does **not** need a pipeline run — set
`STUDMANAGER_API_URL` in the stack and redeploy.

The pipeline builds and pushes only. Deploying is a manual **Pull and redeploy**
on the stack in Portainer.

## Deploy on the VPS

### Portainer

1. **Registries** → make sure `registry.studmarket.net` is registered with credentials,
   otherwise the pull fails with `no basic auth credentials`.
2. **Stacks → Add stack → Web editor**, paste **`portainer-stack.yml`**
   (not `docker-compose.yml` — the web editor cannot handle its `build:` block).
3. Set `NPM_NETWORK` under **Environment variables** to the network Nginx Proxy
   Manager runs on, and optionally `IMAGE_TAG`.
4. Deploy. After each pipeline run: **Pull and redeploy** with **Re-pull image** ticked,
   otherwise Docker keeps the `:latest` layer it already has.

The stack publishes no host port — NPM reaches the container over the shared
network. Add a proxy host forwarding to `studmanagerweb:3000` (scheme `http`).

### Plain SSH

```bash
docker compose pull && docker compose up -d
```

## Reverse proxy

The VPS runs **Nginx Proxy Manager**, and `portainer-stack.yml` joins its docker
network instead of publishing a port — so NPM terminates TLS and forwards to
`http://studmanagerweb:3000`. Host port 3000 is already taken on that box anyway
(`docker ps --filter publish=3000` shows by what).

`docker-compose.yml` is the local-only variant and does bind `127.0.0.1:3000`.

## Local check

```bash
docker compose build && docker compose up -d
```

`/` should return 307 → `/ar/login`, and `/ar/login` should return 200.

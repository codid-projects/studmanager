# Docker deployment — StudManagerWeb

Next.js 16 (App Router) + React 19 + pnpm, built into a standalone runtime image,
pushed to `registry.studmarket.net` by Azure Pipelines and run on the Contabo VPS
via Portainer.

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | 3-stage build: `deps` → `builder` → `runner` (standalone, non-root) |
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
| `NEXT_PUBLIC_STUDMANAGER_API_URL` | **Build time only** | Inlined by `next build` into **both** the client and server bundles. Setting it on the container does nothing — pointing at another API means a **new pipeline run**. |
| `NEXT_PUBLIC_STUDMANAGER_API_MODE` | **Build time only** | `direct` (browser → API host, needs CORS) or `server` (browser → Next `/api/*` → API). Currently `direct`. |
| `IMAGE_TAG` | Runtime | Which pushed tag the stack runs. `latest`, or a `$(Build.BuildId)` to roll back. |
| `PORT` / `HOSTNAME` | Runtime | Default `3000` / `0.0.0.0`. |

Defaults if nothing is passed: `https://studmanagerapi-dev.studmarket.net`, mode `direct`
— same as the repo's current behaviour (`lib/api/transport.ts`).

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

To point a build at a different backend, override `apiUrl` / `apiMode` when queueing
the run (or edit the `variables:` block).

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

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
| `docker-compose.yml` | The stack Portainer runs on the VPS |
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

The pipeline mirrors the existing `StudManagerApi` one. Create it from
**Pipelines → New pipeline → Azure Repos Git → StudManagerWeb → Existing YAML file →
`/azure-pipelines.yml`**, then add these pipeline variables:

| Variable | Secret | Value |
|---|---|---|
| `REGISTRY_USERNAME` | no | registry user |
| `REGISTRY_PASSWORD` | **yes** | registry password |

These go in the **Pipeline settings UI**, not in the YAML.

To point a build at a different backend, override `apiUrl` / `apiMode` when queueing
the run (or edit the `variables:` block).

The pipeline builds and pushes only. Deploying is a manual **Pull and redeploy**
on the stack in Portainer.

## Deploy on the VPS

### Portainer

1. **Registries → Add registry** → `registry.studmarket.net` with the same credentials.
2. **Stacks → Add stack**, paste `docker-compose.yml` (or point it at this repo).
3. Add the variables from `.env.example`.
4. Deploy. After each pipeline run, hit **Pull and redeploy** on the stack to pick up
   the new `:latest` image.

### Plain SSH

```bash
docker compose pull && docker compose up -d
```

## Reverse proxy

`docker-compose.yml` binds to `127.0.0.1:3000` — it expects Nginx / Traefik /
Nginx Proxy Manager in front, terminating TLS. Point the proxy at
`http://127.0.0.1:3000`, or put the container on the proxy's docker network and
target `http://studmanagerweb:3000`.

To expose the app directly on the VPS instead, change the mapping to `"3000:3000"`.

## Local check

```bash
docker compose build && docker compose up -d
```

`/` should return 307 → `/ar/login`, and `/ar/login` should return 200.

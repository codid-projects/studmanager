# syntax=docker/dockerfile:1.7
# StudManagerWeb — Next.js 16 / React 19 / pnpm
# Multi-stage build producing a small standalone runtime image.

# ---------------------------------------------------------------------------
# 1. deps — install node_modules once, cached on the lockfile
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# 2. builder — run `next build`
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the browser bundle at BUILD time.
# Keep the backend URL private: the container reads STUDMANAGER_API_URL at
# runtime and server-side Next routes proxy requests to it.
ARG NEXT_PUBLIC_STUDMANAGER_API_URL=
ARG NEXT_PUBLIC_STUDMANAGER_API_MODE=server
ENV NEXT_PUBLIC_STUDMANAGER_API_URL=$NEXT_PUBLIC_STUDMANAGER_API_URL
ENV NEXT_PUBLIC_STUDMANAGER_API_MODE=$NEXT_PUBLIC_STUDMANAGER_API_MODE

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# ---------------------------------------------------------------------------
# 3. runner — standalone output only, no pnpm, no source, non-root
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
 && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["node", "server.js"]

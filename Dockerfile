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

# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time,
# so they must be passed as build args — setting them at `docker run` has
# no effect on the browser code. See docker-compose.yml.
ARG NEXT_PUBLIC_STUDMANAGER_API_URL=https://studmanagerapi-dev.studmarket.net
ARG NEXT_PUBLIC_STUDMANAGER_API_MODE=direct
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

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]

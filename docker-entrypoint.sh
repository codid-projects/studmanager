#!/bin/sh
# Makes the backend API URL a RUNTIME setting instead of a build-time one.
#
# `next build` inlines NEXT_PUBLIC_* into the compiled bundles, so the image is
# built with the literal placeholder below and this script rewrites it on every
# container start with whatever STUDMANAGER_API_URL says.
#
# Idempotent: `docker restart` cannot change env vars, and anything that DOES
# change them (compose up / Portainer redeploy) recreates the container from a
# fresh image layer where the placeholder is intact. A restart simply finds
# nothing to replace.

set -eu

PLACEHOLDER='__STUDMANAGER_API_URL__'

# Never leave the placeholder in place — `new URL(path, base)` would throw.
API_URL="${STUDMANAGER_API_URL:-https://studmanagerapi-dev.studmarket.net}"
API_URL="${API_URL%/}"

case "$API_URL" in
  http://*|https://*) ;;
  *)
    echo "[entrypoint] STUDMANAGER_API_URL must start with http:// or https:// (got '$API_URL')" >&2
    exit 1
    ;;
esac

# Escape the sed replacement metacharacters: backslash, delimiter, ampersand.
ESCAPED_URL=$(printf '%s' "$API_URL" | sed -e 's/[\\|&]/\\&/g')

MATCHES=$(find /app/.next -type f \
  \( -name '*.js' -o -name '*.json' -o -name '*.html' -o -name '*.rsc' \) \
  -exec grep -l "$PLACEHOLDER" {} + 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "$MATCHES" | while IFS= read -r file; do
    sed -i "s|$PLACEHOLDER|$ESCAPED_URL|g" "$file"
  done
  echo "[entrypoint] API base URL set to $API_URL"
else
  echo "[entrypoint] API base URL already resolved, nothing to substitute"
fi

exec "$@"

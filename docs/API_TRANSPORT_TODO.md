# API Transport Mode TODO

Current phase:

```txt
STUDMANAGER_API_URL=https://api-pro.studmanager.net
NEXT_PUBLIC_STUDMANAGER_API_MODE=server
```

This makes browser code call the Next server proxy. The proxy reads
`STUDMANAGER_API_URL` from the server environment, so the backend host is not
hardcoded into the browser bundle.

Local direct-debug switch:

```txt
NEXT_PUBLIC_STUDMANAGER_API_URL=https://api-pro.studmanager.net
npm run api:direct
```

Then restart the Next dev server. This makes browser code call the backend
directly so requests are visible in DevTools Network.

Switch back to server mode:

```txt
npm run api:server
```

Files prepared for fast switch:

- `lib/api/transport.ts`
- `lib/api/client.ts`
- `.env.local` via `scripts/set-api-mode.mjs`

Remaining Phase 2 work:

- Remove client-readable bearer cookie/localStorage token use when server mode is final.

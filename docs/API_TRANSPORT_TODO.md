# API Transport Mode TODO

Current phase:

```txt
NEXT_PUBLIC_STUDMANAGER_API_MODE=direct
```

This makes browser code call the backend directly so requests are visible in DevTools Network.

Phase 2 switch:

```txt
npm run api:server
```

Then restart the Next dev server. This changes the app back to server-side Next API proxy calls where browser requests are hidden behind `/api/*` routes.

Switch back to direct mode:

```txt
npm run api:direct
```

Files prepared for fast switch:

- `lib/api/transport.ts`
- `lib/api/client.ts`
- `.env.local` via `scripts/set-api-mode.mjs`

Remaining Phase 2 work:

- Keep `server` mode as the default for production.
- Remove client-readable bearer cookie/localStorage token use when server mode is final.
- Keep `/api/auth/login`, `/api/horses`, `/api/horses/studbook`, and `/api/horses/import` as the only browser-facing API paths.

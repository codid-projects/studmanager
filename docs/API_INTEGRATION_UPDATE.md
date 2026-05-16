# StudManager Integration Update

Date: 2026-05-16

## Done

- Implemented real sign-in against `POST /api/users/login`.
- Added a server-side API interceptor that attaches the bearer token from an HTTP-only cookie.
- Added same-origin Next API routes so the frontend does not call the backend directly with tokens.
- Replaced the fake auth cookie login flow with backend auth and route-safe cookies.
- Added Arabic handling for backend auth errors, including `Invalid credentials.`
- Connected the horses list page to `GET /api/Horses`.
- Connected the horse profile page to `GET /api/Horses/{localId}`.
- Added service support for Studbook search/import:
  - `GET /api/ExternalHorses/search-external-horses`
  - `POST /api/ExternalHorses/import-horse`
- Added service support for profile related data:
  - `GET /api/ExternalHorses/{localId}/offsprings`
  - `GET /api/ExternalHorses/{localId}/siblings`
- Added typed response models and clean helper files to keep page/component code smaller.
- Added fallback UI for empty states, missing images, missing Arabic/English names, missing owner/breeder, and backend errors.

## Verified

- Login with:

```json
{
  "username": "karen",
  "password": "Karen@manager123"
}
```

- Successful login returned token and user data for `Karen Boles`.
- Invalid login returned `401` with `Invalid credentials.`, now translated in Arabic UI.
- `GET /api/Horses?pageNumber=1&pageSize=6` returned horse data.
- `GET /api/Horses/15` returned full horse detail.
- `npm run build` completed successfully.

## Notes

- External Studbook, offspring, and sibling endpoints timed out during live checks on 2026-05-16, so they are integrated defensively:
  - Studbook search loads only when the modal opens.
  - Related profile data failure does not break the detail page.
  - The interceptor has a timeout cap.
- Manual horse creation is not implemented because the provided Swagger/Postman contract does not include a manual create horse endpoint.

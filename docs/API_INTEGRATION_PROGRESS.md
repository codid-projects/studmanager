# StudManager API Integration Progress

Date: 2026-05-16

## Completed

- Added a server-side API interceptor in `lib/api/http.ts`.
- Added typed API contracts in `lib/api/types.ts`.
- Added auth service in `lib/api/auth-service.ts`.
- Added horse service in `lib/api/horses-service.ts`.
- Added response formatting helpers in `lib/api/horse-formatters.ts`.
- Added API error normalization and Arabic message translation in `lib/api/errors.ts`.
- Replaced fake login with real backend login through `POST /api/auth/login`.
- Stored auth state using cookies:
  - `studmanager-auth`: readable route gate cookie.
  - `studmanager-token`: HTTP-only bearer token cookie.
  - `studmanager-user`: non-sensitive user summary.
- Updated route protection to continue using the existing auth cookie.
- Replaced mock horses list with backend-loaded horses from `/api/Horses`.
- Replaced horse detail mock with backend detail from `/api/Horses/{localId}`.
- Added same-origin Next routes for Studbook search/import so browser code does not handle bearer tokens.
- Added Arabic login errors for invalid credentials and network failures.
- Added build verification with `npm run build`.

## API Base

Default:

```txt
https://studmanagerapi-dev.studmarket.net
```

Override:

```txt
STUDMANAGER_API_BASE_URL=https://studmanagerapi-dev.studmarket.net
```

## APIs Used

### Login

Backend endpoint:

```txt
POST /api/users/login
```

Next endpoint used by UI:

```txt
POST /api/auth/login
```

Payload:

```json
{
  "username": "karen",
  "password": "Karen@manager123",
  "rememberMe": true,
  "locale": "ar"
}
```

Verified success response shape:

```json
{
  "succeeded": true,
  "message": "Login successful.",
  "statusCode": 200,
  "data": {
    "accessToken": "JWT_TOKEN",
    "expiresAt": "2026-05-16T20:15:26.7921207Z",
    "userId": 1,
    "username": "karen",
    "fullName": "Karen Boles",
    "userProfileImage": null,
    "roles": [
      {
        "id": 1,
        "name": "StudManager",
        "arabicName": "مدير المزرعة"
      }
    ]
  }
}
```

Verified invalid credentials response:

```json
{
  "status": 401,
  "title": "Unauthorized",
  "detail": "Invalid credentials."
}
```

Arabic handling:

```txt
Invalid credentials. -> اسم المستخدم أو كلمة المرور غير صحيحة.
```

### Horses List

Backend endpoint:

```txt
GET /api/Horses?pageNumber=1&pageSize=24&search=
```

Verified response note:

The backend returns the paged object directly, not wrapped in `{ data, succeeded, statusCode }`.

Verified sample:

```json
{
  "data": [
    {
      "id": 15,
      "englishName": "Masa Sebha",
      "arabicName": "ماسة سبحة",
      "knownAs": null,
      "dateofBirth": "2024-05-15",
      "gender": "Female",
      "color": "grey",
      "horseProfileImage": "",
      "strainEn": null,
      "strainAr": null,
      "specialEn": null,
      "specialAr": null,
      "isActive": true
    }
  ],
  "currentPage": 1,
  "pageSize": 6,
  "totalCount": 3,
  "totalPages": 0,
  "hasPreviousPage": false,
  "hasNextPage": false,
  "succeeded": true,
  "messages": [],
  "extraInfo": null
}
```

Handled cases:

- Empty list shows localized no-records state.
- Missing image uses a fallback horse image.
- Arabic UI uses `arabicName` first, then English fallback.
- English UI uses `englishName` first, then Arabic fallback.
- Gender display is localized for common English values.

### Horse Detail

Backend endpoint:

```txt
GET /api/Horses/{localId}
```

Verified with:

```txt
GET /api/Horses/15
```

Verified response shape:

```json
{
  "succeeded": true,
  "message": "Success",
  "statusCode": 200,
  "data": {
    "id": 15,
    "studbookId": 41993,
    "englishName": "Masa Sebha",
    "arabicName": "ماسة سبحة",
    "dateofBirth": "2024-05-15",
    "gender": "Female",
    "color": "grey",
    "type": "Filly",
    "images": [],
    "videos": [],
    "horseProfileImage": "",
    "isActive": true,
    "owner": null,
    "breeder": null
  }
}
```

Handled cases:

- Missing text fields render `-`.
- Missing owner or breeder is safe.
- Empty `images` or `videos` arrays fall back to existing sample media.
- Profile tabs remain client-side, but data is loaded on the Next server.

### Studbook Search

Backend endpoint:

```txt
GET /api/ExternalHorses/search-external-horses?SearchTerm={term}&PageNumber=1&PageSize=12
```

Next endpoint used by UI:

```txt
GET /api/horses/studbook?search={term}&pageNumber=1&pageSize=12&locale=ar
```

Status:

- Integrated in the modal.
- Live checks timed out on 2026-05-16, so it is loaded only when the modal opens instead of blocking the horses page.
- Server fetch timeout is capped in the interceptor.

Handled cases:

- Loading state.
- Empty state.
- Backend errors localized when possible.
- Browser never sees the bearer token.

### Import Horse From Studbook

Backend endpoint:

```txt
POST /api/ExternalHorses/import-horse
```

Next endpoint used by UI:

```txt
POST /api/horses/import
```

Payload:

```json
{
  "studbookId": 41993,
  "strain": null,
  "specialLine": null,
  "strainAr": null,
  "specialLineAr": null,
  "locale": "ar"
}
```

Expected backend response:

```json
{
  "succeeded": true,
  "message": "Success",
  "statusCode": 200,
  "data": 15
}
```

Handled cases:

- No selected Studbook horse returns a localized validation error.
- Import failure shows localized backend message.
- Successful import reloads the horse list.

### Offspring And Siblings

Backend endpoints:

```txt
GET /api/ExternalHorses/{localId}/offsprings?pageNumber=1&pageSize=15
GET /api/ExternalHorses/{localId}/siblings?pageNumber=1&pageSize=15
```

Status:

- Service functions are implemented.
- Profile page attempts to load them without blocking the main horse detail.
- Live checks timed out on 2026-05-16, so failures fall back to empty tables.

## Files Added

- `lib/api/http.ts`
- `lib/api/types.ts`
- `lib/api/errors.ts`
- `lib/api/auth-service.ts`
- `lib/api/horses-service.ts`
- `lib/api/horse-formatters.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/horses/studbook/route.ts`
- `app/api/horses/import/route.ts`
- `components/horses/HorsesPageClient.tsx`
- `components/horses/StudbookImportModal.tsx`
- `components/horses/HorseProfilePageClient.tsx`
- `components/horses/profile/RelatedHorsesTable.tsx`

## Files Updated

- `lib/auth.ts`
- `proxy.ts` indirectly continues to use the existing auth cookie constants.
- `components/auth/LoginPageContent.tsx`
- `app/[locale]/horses/page.tsx`
- `app/[locale]/horses/[id]/page.tsx`
- `components/horses/HorseInfoTab.tsx`
- `components/horses/HorsePhotosTab.tsx`
- `components/horses/HorseVideosTab.tsx`
- `public/locales/en.json`
- `public/locales/ar.json`

## Verification

Command:

```txt
npm run build
```

Result:

```txt
Compiled successfully.
TypeScript passed.
Dynamic routes generated for /[locale]/horses and /[locale]/horses/[id].
```

Known build warnings:

- Existing Recharts warnings about chart containers with width/height `-1` during static generation.
- Existing metadataBase warning from Next metadata generation.

These warnings are unrelated to the API integration changes.

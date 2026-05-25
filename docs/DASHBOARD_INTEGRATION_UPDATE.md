# Dashboard Integration Update

Date: 2026-05-25

## What Changed

- Rebuilt the dashboard screen to match the provided RTL reference design:
  - Split hero metrics for available horses and yearly production.
  - Cost analysis card with feed, veterinary, and operational percentages.
  - Profit, expenses, horse count, and sales summary cards.
  - Stud information panel.
  - Health record, current ration, latest activities, report notice, calendar, and event list panels.
- Kept the dashboard responsive for desktop, tablet, and mobile layouts.
- Added Arabic and English translation keys for the new dashboard labels.
- Increased dashboard card, font, and calendar sizing for better readability.
- Fixed RTL alignment issues in stud information rows and forced the calendar/event section to keep the reference layout order.
- Removed mock dashboard content. Sections without documented APIs now render `0`, `-`, or the localized no-records state.
- Added an activities modal opened from `آخر الأنشطة / All`, with scrollable content and backend pagination.
- Replaced the static news page with backend-loaded newsfeed data.

## New Backend Integration

- Added typed dashboard contracts in `lib/api/types.ts`:
  - `DashboardDto`
  - `OffspringSummaryDto`
  - `ActivityDto`
  - `ActivityTypeEnum`
  - `ExternalNewsFeedResponse`
  - `AttachmentDto`
  - `CommentDto`
  - `LikeDto`
- Added `lib/api/dashboard-service.ts` for server-side backend calls.
- Added `lib/api/newsfeed-service.ts` for server-side newsfeed calls.
- Added same-origin Next API routes:
  - `GET /api/dashboard` -> backend `GET /api/Dashboard`
  - `GET /api/dashboard/activities` -> backend `GET /api/Dashboard/activities`
  - `GET /api/newsfeed` -> backend `GET /api/ExternalHorses/newsfeed`
- Updated the dashboard UI to load:
  - Main dashboard counts and finance values from `GET /api/Dashboard`.
  - Latest activity feed from `GET /api/Dashboard/activities?pageNumber=1&pageSize=6`.
  - Paginated modal activity pages from `GET /api/Dashboard/activities?pageNumber={page}&pageSize=10`.
  - Stud details from the existing default stud integration.
- Updated the news tab to load paginated items from `GET /api/ExternalHorses/newsfeed?pageNumber={page}&pageSize=10`.

## Fallback Behavior

- The dashboard no longer uses mock fallback records.
- Failed dashboard, activity, stud, or newsfeed requests do not break the page.
- Missing numeric API values render as `0`.
- Missing list-based API values render the localized no-records state.

## Verified

- `npm run build` completed successfully.
- Build still prints existing chart container warnings from other pages during static generation; no dashboard build errors were introduced.

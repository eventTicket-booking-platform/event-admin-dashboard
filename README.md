# Event Admin Dashboard

Admin and host dashboard for Event Hub. This Angular application manages events, categories, bookings, users, notification operations, and profile settings.

## Stack

- Angular 21
- Angular Material
- Tailwind CSS
- SSR-enabled Angular app

## Features

- Admin login through auth service
- Dashboard with booking, event, and notification summary cards
- Event CRUD with multipart banner upload and ticket-tier editing
- Event status management
- Category create, update, and delete
- Booking admin list and booking detail inspection
- Booking stats
- User directory with pagination
- ADMIN-only host application review with status filtering and pagination
- Notification logs and failed-notification retry
- Host-password email trigger
- Profile view and update
- Avatar upload
- Password reset request and reset submission
- Token and endpoint configuration stored in browser local storage

## Route Map

- `/login`
- `/dashboard`
- `/events`
- `/bookings`
- `/users`
- `/host-applications` (ADMIN only)
- `/categories`
- `/notifications`
- `/settings`

## Backend Integration

The dashboard talks to live services, normally through the gateway base URL `/api`.

Used backend paths include:

- auth service:
  - login
  - refresh token
  - get profile
  - update profile
  - request password reset code
  - reset password
  - upload avatar
  - list users
  - list, approve and reject host applications
- event service:
  - list admin events
  - get event detail
  - create event
  - update event
  - change event status
  - delete event
  - categories list and CRUD
- booking service:
  - booking stats
  - admin booking list
  - booking detail
- notification service:
  - stats
  - logs
  - failed notifications
  - retry failed notification
  - send host password

## Access Model

- ADMIN and HOST use this same dashboard; CUSTOMER cannot enter it.
- Both roles see Overview, Events, Bookings and their own profile Settings.
- Users, Host Applications, Categories management and Notifications are ADMIN-only in navigation
  and child-route guards. Hosts do not request global user lists/email lookups
  or notification statistics. Shared booking/event endpoints return only the
  host's owned events and associated booking data; ADMIN retains platform totals.
- UI role decoding only controls presentation. Event Service enforces ownership
  using `Event.createdBy` and the JWT subject. Booking Service verifies event
  ownership through Event Service before returning host booking data; frontend
  filters are never trusted for access control. Event creation no longer submits
  an owner, and the backend ignores one supplied by older clients.
- Auth Service restricts global user listing/email resolution to ADMIN. The
  auth interceptor supplies bearer tokens to notification calls; the gateway
  requires ADMIN for notification administration and rejects public forwarding
  of internal inventory/count APIs. Direct service ports must remain private,
  since Notification Service and internal inventory commands still trust that
  network boundary.
- Deploy Event Service first and audit old client-supplied `createdBy` values.
  Unauthenticated management uses existing authentication handling; an
  authenticated non-owner receives 403.

Run `npm test -- --watch=false` for role/guard/sidebar tests and `npm run build`
for the production build. Backend HTTP/database tests cover authoritative
ownership, scoped pagination/totals and customer own-booking behavior.

## Host Application Review (Phase 4)

Open **Host Applications** as ADMIN. The list defaults to PENDING and supports
APPROVED/REJECTED filters with the existing Previous/Next pagination pattern.
Each row shows applicant details, organization, reason, status and review dates.
Only pending applications have actions. Approve opens an inline confirmation;
Reject requires a nonblank reason of at most 2,000 characters. Controls are
disabled during review requests, and status changes appear only after backend
success. The list then refreshes; rejection reasons remain visible in the result
notice and rejected rows. Conflicts reload stale data; failures show snackbar
feedback and allow retry without claiming success.

The feature uses the existing configured auth base URL and bearer-token/refresh
interceptor for `/user-service/api/v1/host-applications/admin` and its
`/{id}/approve` and `/{id}/reject` PATCH endpoints. HOST cannot see its navigation
or enter its guarded route. Backend ADMIN authorization remains authoritative.
No Keycloak calls or notification behavior are added to the dashboard.

## Local Setup

1. Install dependencies:

```powershell
npm install
```

2. Ensure these backend services are up:
   - `gateway-service-api`
   - `auth-service-api`
   - `event-service-api`
   - `booking-service-api`
   - `notification-service-api`

3. Start the app:

```powershell
npm start
```

Default dev port: `4200`. Open `http://localhost:4200/login`.

During local development, `/api/*` requests are proxied to `http://localhost:9090` by `proxy.conf.json`, so the gateway must be running locally on port `9090`.

The Kubernetes container runs the SSR server on port `4000`.
Use `/health` for container or ingress health checks.

## Production

```powershell
npm run build
```

For SSR runtime, the app uses:

- `PORT` for the server port
- `API_BASE_URL` or `GATEWAY_API_BASE_URL` for the gateway base URL. The container default is `http://gateway-service:9090/api`.

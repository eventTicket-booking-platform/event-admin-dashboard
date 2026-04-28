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

- Login is intended for `admin` and `host` accounts.
- Route guarding only checks whether a token exists.
- Notification admin endpoints are currently called without bearer auth because the notification service does not enforce auth in code.

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

Default dev port: `4200`

The Kubernetes container runs the SSR server on port `4000`.

## Production

```powershell
npm run build
```

For SSR runtime, the app uses:

- `PORT` for the server port
- `API_BASE_URL` for server-side API base URL

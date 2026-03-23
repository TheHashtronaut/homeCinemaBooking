# Home Cinema Booking (Separated Frontend + Backend)

This project now runs as **two services**:

- **Frontend**: Next.js (`/`, `/customer`, `/admin`, etc.)
- **Backend**: Express API (`/api/auth/*`, `/api/movies`, `/api/bookings`, admin APIs)

Data is still local for now, stored in:

- `data/db.json` (auto-created by backend)

## What’s included

- Auth (real backend flow)

- Register/Login is handled by the backend with session cookies.
- Bootstrap: you can log in as `admin` / `admin` (creates the first admin account).
- If you register first before bootstrap login, first registered user becomes `admin`.
- Other users become `customer`.
- Booking requests require a logged-in `customer`.
- Admin pages require an `admin`.

- Admin can:
  - Create/edit movies (`title`, `posterUrl`)
  - Create showtimes (single screen “calendar slot”: `date` + `start time` + `end time`)
  - Approve/reject booking requests
  - Cancel approved bookings
- Customer can:
  - Browse movies + showtimes
  - Request a slot
  - View their booking history (logged-in user)

## Capacity + approvals (v1)

- Each `Showtime` has `capacity = 10`
- When admin clicks **Approve**, the backend checks:
  - `approvedCount(showtimeId) < 10`
- Overlapping showtimes are allowed (admin decides)
- Multiple pending requests per customer are allowed
- Cancelling an approved booking moves it to `CANCELLED` and it no longer counts toward capacity

## Local setup

1. Install dependencies:
   - `npm install`
   - `npm --prefix backend install`
2. Start both services:
   - `npm run dev:all`

Default ports:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

Optional env:
- `BACKEND_URL` (frontend server-side API base; default `http://localhost:4000`)
- `NEXT_PUBLIC_BACKEND_URL` (for future client-side direct API calls)
- `FRONTEND_URL` (backend CORS origin; default `http://localhost:3000`)
- `BACKEND_PORT` (backend port; default `4000`)

## Routes

- Customer:
  - `/customer` (browse movies + show calendar showtimes; request bookings when logged in)
  - `/customer/bookings` (view booking requests for the logged-in customer)
- Admin:
  - `/admin` (pending queue + approve/reject/cancel)
  - `/admin/movies` (manage movies)
  - `/admin/showtimes` (manage showtimes)

- Auth:
  - `/auth/login`
  - `/auth/register`

## API base

Backend API base URL:

- `http://localhost:4000`


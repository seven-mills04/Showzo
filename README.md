# Showzo

A movie ticket booking app: pick a city, browse what's playing, choose a show, select seats and pay.

**Live:** https://showzo-chi.vercel.app
**API:** https://showzo-api-gtl4.onrender.com/api/health

The API runs on a free plan that sleeps when idle, so the first visit after a quiet spell can take up to a minute while it wakes up. The site shows a notice while that happens.

**Stack:** Java 21, Spring Boot 3, Spring Data JPA, MySQL 8, Spring Security with JWT, React + Vite + MUI, Docker Compose, GitHub Actions.

## Status

| Part | State |
| --- | --- |
| Catalogue API (cities, movies, theatres, shows) | Done |
| Sign-up and login (JWT) | Done |
| Seat map with seat locking | Done |
| Checkout (Razorpay test mode), tickets with QR, my bookings | Done |
| React frontend | Done |
| Deployment (Render + TiDB Cloud + Vercel) | Done |

## Run locally

Requires Docker Desktop.

```
docker compose up --build
```

Then, in a second terminal, start the website:

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The API runs on http://localhost:8080 and seeds itself with demo cities, theatres, movies and a week of shows. All movie titles and theatre names are invented.

## API

| Method | Path | What it returns |
| --- | --- | --- |
| GET | `/api/cities` | All cities |
| GET | `/api/movies?city=delhi-ncr` | Movies playing in a city. Optional `language`, `genre`, `q` |
| GET | `/api/movies/coming-soon` | Upcoming releases |
| GET | `/api/movies/{slug}` | One movie |
| GET | `/api/movies/{slug}/shows?city=delhi-ncr&date=2026-11-20` | Shows for a day, grouped by theatre |
| POST | `/api/auth/register` | Creates an account, returns a token |
| POST | `/api/auth/login` | Returns a token |
| GET | `/api/auth/me` | The logged-in user (needs `Authorization: Bearer <token>`) |
| GET | `/api/shows/{id}/seats` | Seat map of a show with prices and each seat's status |
| POST | `/api/shows/{id}/holds` | Holds seats for 8 minutes. Body: `{"seats": ["C4", "C5"]}` (login needed) |
| DELETE | `/api/shows/{id}/holds` | Releases your held seats (login needed) |
| POST | `/api/shows/{id}/checkout` | Prices your held seats and creates a payment order (login needed) |
| POST | `/api/bookings/{id}/confirm` | Verifies the payment and books the seats (login needed) |
| GET | `/api/bookings` | Your confirmed bookings (login needed) |
| GET | `/api/bookings/{id}` | One of your bookings (login needed) |

## Payments

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (test-mode keys) to pay through Razorpay's checkout popup. Never commit these keys.

1. The server works out the amount from the held seats and creates a Razorpay order.
2. The browser pays inside Razorpay's popup and gets back a payment id and a signature.
3. The server recomputes the signature (HMAC-SHA256 of `order_id|payment_id` with the secret key). The seats are booked only if it matches, so a made-up "payment succeeded" message from the browser books nothing.

Without the keys the app runs in demo mode: the pay button opens a clearly labelled practice step and no money moves.

## How seat locking works

Two people can open the same show and click the same seat at the same moment. Only one may get it.

- A seat that is held or booked is a row in `seat_reservations`. A free seat has no row.
- The table has a unique constraint on `(show_id, seat_label)`.
- Holding a seat is a plain insert. There is no "is it free?" check first, because two requests could both pass that check before either one saves. The database accepts one insert and rejects the other, and the loser gets a `409 Conflict`.
- A hold expires after 8 minutes. Expired holds are ignored when reading and cleared by a background job every minute.
- A request for several seats is one transaction: if any seat is taken, none are held.

`SeatHoldApiTest.onlyOneOfManySimultaneousRequestsGetsTheSeat` fires eight requests for one seat at once and checks that exactly one wins.

## How it is organised

```
backend/src/main/java/com/showzo
  catalogue/   cities, movies, theatres, screens, shows
  booking/     seat map, seat holds, checkout and bookings
  payment/     Razorpay gateway and the keyless demo gateway
  auth/        registration, login, JWT filter, security rules
  user/        user accounts
  seed/        demo data and the daily show planner
  common/      error handling and shared config

frontend/src
  pages/       one file per screen (home, movie, seats, checkout, ticket, bookings, sign in)
  components/  header, footer, poster artwork, movie card, ticket
  api.js       every call to the backend
  context.jsx  logged-in user and chosen city
  theme.js     colours and fonts
```

## Deployment

| Part | Where | Notes |
| --- | --- | --- |
| Website | Vercel | Builds `frontend/` on every push to `main`. `VITE_API_URL` points at the API. |
| API | Render (free web service, Singapore) | Built from `backend/Dockerfile` using `render.yaml`. Redeploys on every push to `main`. |
| Database | TiDB Cloud Starter (Singapore) | MySQL-compatible. Free plan with a $0 spending limit. |

Settings on Render (Environment page): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGINS`, and optionally `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. None of these are stored in the repo.

The seat-locking race (eight people requesting one seat at once) was also run against the live TiDB database: one request won and seven were rejected.

## Tests

```
cd backend
mvn verify
```

Tests run against an in-memory H2 database, so they need no MySQL. GitHub Actions runs them on every push.

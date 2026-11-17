# Showzo

A movie ticket booking app: pick a city, browse what's playing, choose a show, select seats and pay.

**Stack:** Java 21, Spring Boot 3, Spring Data JPA, MySQL 8, Spring Security with JWT, React + Vite + MUI, Docker Compose, GitHub Actions.

## Status

| Part | State |
| --- | --- |
| Catalogue API (cities, movies, theatres, shows) | Done |
| Sign-up and login (JWT) | Done |
| Seat map with seat locking | Next |
| Checkout (Razorpay test mode) and tickets | Planned |
| React frontend | Planned |

## Run locally

Requires Docker Desktop.

```
docker compose up --build
```

The API starts on http://localhost:8080 and seeds itself with demo cities, theatres, movies and a week of shows. All movie titles and theatre names are invented.

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

## How it is organised

```
backend/src/main/java/com/showzo
  catalogue/   cities, movies, theatres, screens, shows
  auth/        registration, login, JWT filter, security rules
  user/        user accounts
  seed/        demo data and the daily show planner
  common/      error handling and shared config
```

## Tests

```
cd backend
mvn verify
```

Tests run against an in-memory H2 database, so they need no MySQL. GitHub Actions runs them on every push.

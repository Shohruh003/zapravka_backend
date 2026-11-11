# Zapravka Backend

Node.js + Express + TypeScript + MongoDB (Mongoose) + JWT backend for the **Zapravka**
gas-station navigator (TAD Industries). Rebuilt from scratch to match the two existing
frontends' API contract — see [`API_CONTRACT.md`](./API_CONTRACT.md).

## Stack
- **Express 4** + **TypeScript** (CommonJS, run with `tsx`)
- **MongoDB** via **Mongoose 8** (geospatial station search)
- **JWT** access/refresh (`jsonwebtoken`), **bcryptjs** password hashing
- **Multer** image uploads, **CORS**, **morgan**
- Standard `{ serviceName, clientId, userId, requestId, data }` envelope

## Requirements
- Node ≥ 20 (tested on v22)
- MongoDB — easiest via Docker (`docker compose up -d`), or a local `mongod`, or Atlas.

## Setup

```bash
cd backend
npm install
cp .env.example .env        # already provided with dev defaults

# 1) start MongoDB (Docker)
npm run db:up               # docker compose up -d   (mongo:7 on :27017)

# 2) seed demo data (gas categories, station admins, sample stations, super-admin)
npm run seed

# 3) run the API (hot reload)
npm run dev                 # http://localhost:5000
```

Production build: `npm run build && npm start`.

## Default accounts (dev)
- **Super-admin (admin panel login):** `998901112233` / `admin123`
- **Station admins (seed):** `998901110011`, `998901110022` / `admin123`
- **Driver OTP:** dev mode — the OTP is returned in the register response and logged to
  the console. With `OTP_DEV_FIXED=0000` (default) it is always `0000`.

## Environment (`.env`)
| Var | Default | Notes |
|---|---|---|
| `PORT` | `5000` | |
| `BASE_URL` | `http://localhost:5000` | used to build absolute file URLs |
| `MONGODB_URI` | `mongodb://localhost:27017/zapravka` | |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev values | change in prod |
| `OTP_MODE` | `dev` | `dev` returns OTP in response; `eskiz`/`playmobile` = TODO real SMS |
| `OTP_DEV_FIXED` | `0000` | fixed dev OTP; empty = random 4-digit |
| `CORS_ORIGINS` | `*` | comma-separated list or `*` |
| `SUPER_ADMIN_PHONE` / `SUPER_ADMIN_PASSWORD` | `998901112233` / `admin123` | auto-created on boot |

## Project layout
```
src/
  app.ts            express app (middleware + routes)
  index.ts          bootstrap (db connect + listen)
  config/           env, db
  middleware/       envelope, auth(JWT), error, upload(multer)
  models/           User, Car, CarFuel, GasCategory, Station
  modules/          auth, profile, station, gasCategory, car, carFuel, stationAdmin, files
  routes/           mounts everything under /api/v1
  seed/             demo data
  utils/            jwt, otp, response(envelope), phone, asyncHandler
```

## Connecting the frontends
Point each app's `VITE_API_URL` to `http://localhost:5000`:
- `zapravka/.env`      → `VITE_API_URL=http://localhost:5000`
- `zapravka-admin/.env` → `VITE_API_URL=http://localhost:5000`

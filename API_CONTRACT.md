# Zapravka Backend — API Contract

Reverse-engineered from the two existing frontends (`zapravka`, `zapravka-admin`) and
rebuilt from scratch. Base URL (dev): `http://localhost:5000`.

## Envelope

**Every** request body (JSON routes) uses:

```json
{ "serviceName": "test", "clientId": "test-client", "userId": "123", "requestId": "test-request", "data": { ... } }
```

**Every** response uses:

```json
{ "status": "ok", "serviceName": "...", "clientId": "...", "userId": "...", "requestId": "...", "data": ... }
```

On error: `{ "status": "error", "error": "message", "data": null }` with an appropriate HTTP code.

Multipart routes (station create/update) send the meta + data fields **flat** as form fields
(plus `file`), not nested under `data`.

## Auth

`token` travels inside `data.token` (most routes) or `Authorization: Bearer <token>` (car update).
`access_token` is a real JWT whose **`sub` claim = user id** (the client decodes it).

| Method | Path | data | returns (`data`) |
|---|---|---|---|
| POST | `/api/v1/auth/register` | `{ password, phoneNumber, firstName, lastName }` | `{ phoneNumber, otp }` (otp only in dev) |
| POST | `/api/v1/auth/verifyOtp` | `{ phoneNumber, otp }` | `{ access_token, refresh_token }` |
| POST | `/api/v1/auth/login` | `{ phoneNumber, password }` | `{ access_token, refresh_token }` |
| POST | `/api/v1/auth/me` | `{ token }` | `{ id, phoneNumber, name, firstName, lastName }` |
| POST | `/api/v1/profile/updateProfile` | `{ token, userId, firstName, lastName, oldPassword?, newPassword? }` | updated profile |

## Stations

| Method | Path | data | returns (`data`) |
|---|---|---|---|
| POST | `/api/v1/station/getStations` | `{ token, latitude, longitude, name?, gasCategoryId?[], limit, page }` | `IStation[]` (geo-sorted when lat/lng ≠ 0) |
| POST | `/api/v1/station/getStationsById` | `{ token, id }` | `IStation` |
| POST | `/api/v1/station/dashboard` | `{ token }` | `[{ allStationsCount, petrolStationsCount, gasStationsCount, powerStationsCount, dizelStationsCount, stationsAdminsCount }]` |
| POST | `/api/v1/station/createStations` | multipart: `name, address, phoneNumber, latitude, longitude, user_id, type(JSON[]), file, token` | created `IStation` |
| POST | `/api/v1/station/updateStations` | multipart: `stationId, name?, address?, latitude?, longitude?, user_id?, file?, token` | updated `IStation` |
| POST | `/api/v1/station/delete` | `{ id, token }` | `{ id }` |

`IStation` includes BOTH shapes consumers rely on: flat `gasCategory[]` (admin) **and** nested
`gasCategories[]` (client), plus `businessHours[]`, `location{type,coordinates:[lng,lat]}`, and
`filePath` as an **absolute URL**. Station `type` ∈ `gas | electric | diesel | benzine`.

## Gas categories

| Method | Path | data | returns |
|---|---|---|---|
| POST | `/api/v1/gasCategory/getGasCategories` | `{ token, name_uz, name_ru, limit, page }` | `IGasCategory[]` (`{ id, name_uz, name_ru }`) |

## Cars (use `_id`, not `id`)

| Method | Path | data | returns |
|---|---|---|---|
| POST | `/api/v1/car/getCarsByUserId` | `{ token, id }` | `ICar[]` |
| POST | `/api/v1/car/createCars` | `{ userId, carBrand, color, plateNumber, engineType, token }` | `ICar` |
| POST | `/api/v1/car/deleteCars` | `{ token, id }` | `{ id }` |
| PUT | `/api/v1/car/:carId` | `Partial<ICar>` (Bearer auth) | `ICar` |

## Car fuels (use `_id`, nested `gasCategory`)

| Method | Path | data | returns |
|---|---|---|---|
| POST | `/api/v1/carFuel/getCarFuelsByCarId` | `{ token, carId }` | `ICarFuel[]` |
| POST | `/api/v1/carFuel/createCarFuels` | `{ token, carId, gasCategoryId }` | `ICarFuel` |
| POST | `/api/v1/carFuel/deleteCarFuels` | `{ token, id }` | `{ id }` |

## Station admins (superAdmin only; `getAll` is **double-nested**)

| Method | Path | data | returns |
|---|---|---|---|
| POST | `/api/v1/stationAdmin/create` | `{ phoneNumber, password, firstName, lastName, token }` | admin |
| POST | `/api/v1/stationAdmin/getAll` | `{ name, token }` | `{ data: StationAdmin[], count }` |
| POST | `/api/v1/stationAdmin/update` | `{ id, firstName?, lastName?, token }` | admin |
| POST | `/api/v1/stationAdmin/delete` | `{ id, token }` | `{ id }` |

## Files

| Method | Path | returns |
|---|---|---|
| GET | `/api/v1/files/:filename` | the uploaded image |

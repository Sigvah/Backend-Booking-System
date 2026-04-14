# Fjord Line – Backend Booking System

Backend API for booking ferry passages on the Bergen–Stavanger–Hirtshals–Kristiansand route. Built with C# and ASP.NET Core Minimal APIs.

## Getting started

**Prerequisites:** [.NET 10 SDK](https://dotnet.microsoft.com/download)

```bash
cd FjordLine
dotnet run
```

The API starts on `http://localhost:5104`.

## Interactive UI

Open `http://localhost:5104/scalar` in your browser for a full interactive API explorer (Scalar).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/departures` | List all departures with route, time and remaining capacity |
| `POST` | `/departures/{id}/bookings` | Register a booking |
| `GET` | `/departures/{id}/manifest` | Get passenger list for a departure |
| `DELETE` | `/departures/{id}/bookings/{bookingId}` | Cancel a booking |

### GET /departures

```bash
curl http://localhost:5104/departures
```

### POST /departures/{id}/bookings

```bash
curl -X POST http://localhost:5104/departures/11111111-0000-0000-0000-000000000001/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "passengerName": "Alice Hansen",
    "passengerCount": 2,
    "boardingPort": "Bergen",
    "disembarkPort": "Kristiansand",
    "vehicle": null
  }'
```

Valid ports: `Bergen`, `Stavanger`, `Hirtshals`, `Kristiansand`

Valid vehicle types: `Car`, `Bus`, `Bicycle` (or `null`)

Returns `409 Conflict` if capacity is exceeded on any segment of the journey.

### GET /departures/{id}/manifest

```bash
curl http://localhost:5104/departures/11111111-0000-0000-0000-000000000001/manifest
```

### DELETE /departures/{id}/bookings/{bookingId}

```bash
curl -X DELETE http://localhost:5104/departures/11111111-0000-0000-0000-000000000001/bookings/{bookingId}
```

## Seed data

Two departures are pre-loaded on startup:

| ID | Route | Departure |
|----|-------|-----------|
| `11111111-0000-0000-0000-000000000001` | Bergen → Stavanger → Hirtshals → Kristiansand | +3 days |
| `11111111-0000-0000-0000-000000000002` | Bergen → Stavanger → Hirtshals → Kristiansand | +10 days |

## Multi-leg capacity

Capacity is tracked independently per segment. A passenger boarding in Bergen and disembarking in Stavanger only occupies the Bergen–Stavanger segment, leaving capacity on subsequent segments available for other passengers.

## Running tests

```bash
cd FjordLine.Tests
dotnet test
```

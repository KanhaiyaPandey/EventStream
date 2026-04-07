# EventStream

**Real-time event analytics platform.** Ingest events through a simple HTTP API, process them asynchronously through a durable queue, detect anomalies automatically, and visualise everything on a live dashboard that updates via WebSockets.

Self-hostable · TurboRepo monorepo · TypeScript throughout

---

## Table of contents

- [Architecture](#architecture)
- [How it works](#how-it-works)
- [Monorepo structure](#monorepo-structure)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Tech stack](#tech-stack)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT                                                         │
│  Browser / Next.js 14  (:3000)                                  │
└──────────┬──────────────────────────────▲────────────────────────┘
           │ POST /api/track              │ Socket.io
           │                              │ new_event · analytics_update
┌──────────▼──────────────────────────────┴────────────────────────┐
│  API LAYER  (Express · :4000)                                   │
│  Rate limiter → Zod validation → enqueue             ◄──────────┤
│                                  └─► 202 { jobId }   subscriber │
└──────────┬───────────────────────────────────────────────────────┘
           │ BullMQ job                                ▲
┌──────────▼──────────────────────────────┐            │ publish
│  QUEUE  (BullMQ + Redis)                │            │
│  eventQueue · retry + exponential back- │            │
│  off · dead-letter on exhaustion        │            │
└──────────┬──────────────────────────────┘            │
           │ consume                                   │
┌──────────▼──────────────────────────────────────────-┴───────────┐
│  WORKER  (src/workers/eventWorker.ts)                            │
│  1. Persist event → MongoDB                                      │
│  2. Anomaly detection (moving-average spike check)               │
│  3. Alert service (console · cooldown · pluggable)               │
│  4. Publish "event ingested" → Redis Pub/Sub                     │
└────────────────────────┬─────────────────────────────────────────┘
                         │ write
              ┌──────────▼──────────────┐
              │  MongoDB                │
              │  Events collection      │
              │  Aggregation pipelines  │
              └─────────────────────────┘
```

---

## How it works

### End-to-end flow

1. **Ingest** — the browser (or any HTTP client) sends `POST /api/track` with an event payload.
2. **Queue** — the API validates the payload with Zod, enqueues a job in BullMQ (backed by Redis), and immediately returns `202 { jobId }`. The HTTP response is never blocked by a database write.
3. **Process** — the worker picks up the job, persists the event document to MongoDB, and retries with exponential back-off on failure.
4. **Detect** — the anomaly detection service runs a moving-average spike check on the incoming event rate. If a threshold is exceeded (and the alert cooldown has elapsed) it fires an alert.
5. **Broadcast** — the worker publishes an "event ingested" message to Redis Pub/Sub. The API process subscribes to that channel and broadcasts two Socket.io events to all connected dashboard clients: `new_event` (the persisted document) and `analytics_update` (a fresh summary aggregate).
6. **Dashboard** — the Next.js frontend receives real-time updates over the WebSocket and updates the live feed and summary widgets without polling.

### Dashboard initialisation

On load the dashboard fires three parallel requests:

| Request | Purpose |
|---|---|
| `GET /api/analytics/summary` | Summary widgets (totals, breakdown, top types) |
| `GET /api/events?limit=20&page=1` | Recent events table |
| `GET /api/analytics/event-types` | Event type filter options |

Subsequent data arrives over Socket.io — no further polling required.

### What "summary" means

`GET /api/analytics/summary` returns:

| Field | Description |
|---|---|
| `totalEvents` | Total documents in MongoDB |
| `eventsToday` | Events since the start of the current day |
| `uniqueUsers` | Count of distinct `userId` values |
| `eventBreakdown` | Per-`eventType` counts |
| `topEventTypes` | Top N types with count and % of total |
| `recentActivity` | Latest event documents |

The UI adds `connectedClients` (active Socket.io connections) on the client side.

---

## Monorepo structure

```
eventstream/
├── apps/
│   ├── api/                  Express + Socket.io backend
│   │   ├── src/
│   │   │   ├── routes/       Express route handlers
│   │   │   ├── workers/      eventWorker.ts (BullMQ consumer)
│   │   │   ├── services/     anomalyService · alertService
│   │   │   └── middleware/   rateLimiter · validation
│   │   └── .env.example
│   └── web/                  Next.js 14 dashboard
│       ├── app/              App router pages + layouts
│       ├── components/       Chart · Table · Widget components
│       └── .env.local.example
└── packages/
    ├── config/               Shared tsconfig · tailwind · eslint · types
    └── ui/                   Shared React components
```

---

## Quick start

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 |
| Redis | ≥ 6 (BullMQ + Pub/Sub) |
| MongoDB | ≥ 6 local **or** Atlas URI |

### 1 — Install dependencies

```bash
npm install
```

### 2 — Configure environment variables

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.local.example apps/web/.env.local
```

See [Environment variables](#environment-variables) for the full list.

### 3 — Start development servers

```bash
npm run dev
```

This starts the API server, the background worker, and the Next.js dev server in parallel via TurboRepo.

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API | http://localhost:4000 |

---

## Environment variables

### `apps/api/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | API server port |
| `MONGODB_URI` | `mongodb://localhost:27017/eventstream` | MongoDB connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string (BullMQ + Pub/Sub) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds |
| `ANOMALY_THRESHOLD` | `3` | Spike multiplier to trigger an alert |
| `ANOMALY_COOLDOWN_MS` | `60000` | Minimum ms between consecutive alerts |
| `NODE_ENV` | `development` | `development` \| `production` |

### `apps/web/.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API base URL (browser-visible) |

---

## API reference

### Track an event

```
POST /api/track
Content-Type: application/json
```

```json
{
  "eventType": "page_view",
  "userId": "u-123",
  "properties": {
    "url": "/home",
    "referrer": "https://example.com"
  }
}
```

**Response** `202 Accepted`

```json
{ "jobId": "42" }
```

The event is enqueued immediately. Persistence is handled asynchronously by the worker.

---

### Query events

```
GET /api/events?eventType=page_view&limit=20&page=1
```

| Parameter | Type | Description |
|---|---|---|
| `eventType` | string | Filter by event type |
| `limit` | number | Results per page (default: 20) |
| `page` | number | Page number (1-indexed, default: 1) |

---

### Analytics summary

```
GET /api/analytics/summary
```

Returns aggregated totals, per-type breakdown, top types, and recent activity.

---

### Timeseries

```
GET /api/analytics/timeseries?interval=hour&hours=24&eventType=page_view
```

| Parameter | Type | Description |
|---|---|---|
| `interval` | `minute` \| `hour` \| `day` | Bucket size |
| `hours` | number | Lookback window in hours |
| `eventType` | string | Optional filter |

---

### Event types

```
GET /api/analytics/event-types
```

Returns the distinct set of event types present in the store.

---

### SQL-like query endpoint

```
GET /api/analytics/query?eventType=purchase&timeRange=24h
```

Runs a MongoDB aggregation pipeline. Accepts `eventType` and `timeRange` (`1h`, `24h`, `7d`, `30d`).

---

## Tech stack

| Layer | Technology |
|---|---|
| Monorepo | TurboRepo |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts, Zustand |
| Backend | Express, Socket.io, Zod, Helmet |
| Queue | BullMQ (Redis-backed), exponential back-off |
| Database | MongoDB + Mongoose |
| Real-time | Redis Pub/Sub → Socket.io |
| Rate limiting | `express-rate-limit` (configurable via env) |
| Shared types | `@eventstream/config` package |

---

## Configuration

### Rate limiting

Rate limiting is applied per-IP per time window and is configurable without code changes:

```
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

The middleware is extracted into a reusable factory in `apps/api/src/middleware/rateLimiter.ts`.

### Anomaly detection

The worker runs a moving-average spike check after each event write. If the recent event rate exceeds `ANOMALY_THRESHOLD` × the rolling average (and the cooldown has elapsed), the alert service fires. The alert service is modular — the current implementation logs to the console, and the interface is designed for Slack or email integrations to be added without changing the detection logic.

### Worker retries

BullMQ is configured with exponential back-off. Jobs that exhaust all retry attempts are moved to a dead-letter queue and are not silently dropped.

---

## Deployment

### Docker (recommended)

A sample `docker-compose.yml` should include three services: `api` (Node.js), `web` (Next.js), `redis`, and `mongo`.

```yaml
services:
  redis:
    image: redis:7-alpine
  mongo:
    image: mongo:7
  api:
    build: ./apps/api
    environment:
      REDIS_URL: redis://redis:6379
      MONGODB_URI: mongodb://mongo:27017/eventstream
    depends_on: [redis, mongo]
  web:
    build: ./apps/web
    environment:
      NEXT_PUBLIC_API_URL: http://api:4000
    depends_on: [api]
```

### Production checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a managed Redis instance (Upstash, Redis Cloud, ElastiCache) with TLS
- [ ] Use MongoDB Atlas or a replica set for durability
- [ ] Configure `RATE_LIMIT_MAX` appropriate to expected traffic
- [ ] Expose only the API and web ports; Redis and MongoDB should be internal
- [ ] Set up process supervision for the worker (PM2, systemd, or a separate container)
- [ ] Forward worker logs and anomaly alerts to your observability stack

---

## Roadmap

| Phase | Description | Status |
|---|---|---|
| ✅ Core | Express API, MongoDB, Socket.io real-time | Done |
| ✅ Queue | BullMQ async ingestion, worker process, retry | Done |
| ✅ Observability | Anomaly detection, alert service, rate limiting | Done |
| 3 | Replace Redis queue with Kafka for multi-consumer fan-out | Planned |
| 4 | Authentication, API keys, multi-project support | Planned |
| 5 | MongoDB read replicas, Atlas Search for complex queries | Planned |
| 6 | Managed cloud offering (one-click deploy) | Planned |

---

## Contributing

1. Fork the repo and create a branch from `main`.
2. Run `npm install` and `npm run dev` to confirm the full stack starts.
3. Add tests for any new logic in the worker or API routes.
4. Open a pull request — describe the problem solved and link to any relevant issue.

---

## License

MIT
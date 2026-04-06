# ⚡ EventStream — Real-Time Event Analytics Platform

A production-grade, self-hostable analytics platform built with TurboRepo.
Track user events via a simple API and visualise them on a live dashboard.

---

## 🏗️ Monorepo Structure

```
eventstream/
├── apps/
│   ├── api/        Express + Socket.io backend  (port 4000)
│   └── web/        Next.js 14 dashboard          (port 3000)
└── packages/
    ├── config/     Shared tsconfig, tailwind, eslint, types
    └── ui/         Shared React components
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas URI

### 1. Install all dependencies
```bash
npm install
```

### 2. Configure environment variables

**API:**
```bash
cp apps/api/.env.example apps/api/.env
# Edit MONGODB_URI if not using localhost
```

**Web:**
```bash
cp apps/web/.env.local.example apps/web/.env.local
# NEXT_PUBLIC_API_URL defaults to http://localhost:4000
```

### 3. Run in development (both apps in parallel)
```bash
npm run dev
```

| App | URL |
|-----|-----|
| Dashboard | http://localhost:3000 |
| API | http://localhost:4000 |

---

## 📡 API Reference

### Ingest an event
```bash
curl -X POST http://localhost:4000/api/track \
  -H "Content-Type: application/json" \
  -d '{"eventType":"page_view","userId":"u123","properties":{"url":"/home"}}'
```

### Query events
```
GET /api/events?eventType=page_view&limit=50&page=1
GET /api/analytics/summary
GET /api/analytics/timeseries?interval=hour&hours=24
GET /api/analytics/event-types
```

---

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Monorepo | TurboRepo |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | Express, Socket.io, Zod, Helmet, rate-limit |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io (WebSockets) |
| State | Zustand |
| Shared types | `@eventstream/config` package |

---

## 🔮 Scalability Roadmap

- **Phase 2:** Add Redis queue between API write and DB write
- **Phase 3:** Replace Redis with Kafka for multi-consumer fanout
- **Phase 4:** Add authentication + multi-project support
- **Phase 5:** Read replicas, MongoDB Atlas Search for complex queries

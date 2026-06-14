# Product Price Aggregator

A **NestJS + Prisma + PostgreSQL** backend service that aggregates pricing and availability data for digital products from multiple simulated third-party providers in real time.

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Setup & Installation](#setup--installation)
   - [Option A — Docker Compose (recommended)](#option-a--docker-compose-recommended)
   - [Option B — Local development](#option-b--local-development)
5. [Environment Variables](#environment-variables)
6. [Running the App](#running-the-app)
7. [Running Tests](#running-tests)
8. [API Endpoints](#api-endpoints)
9. [Swagger Documentation](#swagger-documentation)
10. [SSE Live Dashboard](#sse-live-dashboard)
11. [Design Decisions & Trade-offs](#design-decisions--trade-offs)

---

## Overview

The service collects, normalizes, and stores product data from **three simulated providers** with structurally different API schemas. It exposes a RESTful API for querying products, price history, and real-time change events.

Key capabilities:
- Concurrent provider fetching with **exponential-backoff retry**
- **Data normalization** across heterogeneous provider schemas
- **Upsert-in-transaction** with price & availability history tracking
- **Stale data marking** — products unfetched for >2 hours are flagged `isStale: true`
- **Server-Sent Events (SSE)** for real-time price change streaming
- **API Key authentication** on all endpoints (except SSE + public)
- **Swagger/OpenAPI** at `/api`

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│  NestJS Application (port 3000)                           │
│                                                           │
│  ┌─────────────┐    ┌──────────────────┐                  │
│  │  Providers  │───▶│  AggregationSvc  │                  │
│  │  Service    │    │  (scheduler)     │                  │
│  │             │    │  - normalize     │                  │
│  │  Provider1  │    │  - upsert        │──▶ PostgreSQL    │
│  │  Provider2* │    │  - mark stale    │    (Prisma ORM)  │
│  │  Provider3* │    └──────────────────┘                  │
│  └─────────────┘                                          │
│       *different field names → normalization is real      │
│                                                           │
│  ┌────────────────────┐   ┌─────────────────────────────┐ │
│  │  ProductsController│   │  ApiKeyMiddleware            │ │
│  │  GET /products     │   │  (all routes except SSE)    │ │
│  │  GET /products/:id │   └─────────────────────────────┘ │
│  │  GET /products/... │                                   │
│  │  SSE live-changes  │──▶ RxJS Subject stream            │
│  └────────────────────┘                                   │
└───────────────────────────────────────────────────────────┘
```

### Data Flow

1. `AggregationService.onModuleInit()` triggers an immediate fetch, then schedules periodic fetches.
2. `Promise.allSettled()` fetches from all 3 providers **concurrently**; individual failures don't abort the cycle.
3. Raw data is **normalized** into a canonical schema regardless of provider field naming.
4. An Prisma `$transaction` checks for price/availability deltas → writes `PriceHistory`, then upserts `Product`.
5. After each cycle, products with `lastFetched` older than the stale threshold are flagged `isStale: true`.
6. Price changes from the manual simulate endpoint push events to the **RxJS `Subject`** that SSE clients subscribe to.

### Database Schema

```
Product
  id            Int      PK autoincrement
  name          String
  description   String
  price         Float
  currency      String
  availability  Boolean
  provider      String
  isStale       Boolean  (false = fresh)
  lastUpdated   DateTime @updatedAt
  lastFetched   DateTime (set on every aggregation cycle)

PriceHistory
  id                  Int      PK autoincrement
  productId           Int      FK → Product
  price               Float    (OLD price at time of change)
  availabilityChanged Boolean  (true if availability also changed)
  timestamp           DateTime @default(now())
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS v11 (TypeScript) |
| ORM | Prisma v6 |
| Database | PostgreSQL 16 |
| Scheduling | `@nestjs/schedule` + `SchedulerRegistry` |
| Real-time | Server-Sent Events (SSE) via RxJS `Subject` |
| Validation | `class-validator` + `class-transformer` (global `ValidationPipe`) |
| Auth | Custom API Key middleware (`x-api-key` header) |
| Docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Testing | Jest (unit) + Supertest (e2e) |
| Container | Docker + Docker Compose |

---

## Setup & Installation

### Option A — Docker Compose (recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd product-price-aggregator

# 2. Copy env file (edit values as needed)
cp .env.example .env

# 3. Start Postgres + App
docker compose up --build

# App will be available at http://localhost:3000
# Swagger at http://localhost:3000/api
```

### Option B — Local development

**Prerequisites:** Node.js 20+, PostgreSQL running locally.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit DATABASE_URL to point to your local Postgres instance

# 3. Run migrations
npx prisma migrate dev

# 4. Start dev server (with hot reload)
npm run start:dev
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `API_KEY` | `supersecureapikey123` | Secret key for `x-api-key` header |
| `DATA_FETCH_INTERVAL` | `300000` | Aggregation interval in milliseconds (5 min) |
| `PORT` | `3000` | HTTP server port |

Create a `.env.example` for teammates:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/aggregator_db
API_KEY=supersecureapikey123
DATA_FETCH_INTERVAL=30000
PORT=3000
```

---

## Running the App

```bash
npm run start:dev     # development with hot-reload
npm run start:prod    # production build
npm run build         # compile TypeScript only
```

---

## Running Tests

```bash
npm run test          # unit tests
npm run test:cov      # unit tests with coverage report
npm run test:e2e      # end-to-end tests (requires running DB)
```

> **Note:** E2E tests require a live PostgreSQL instance matching `DATABASE_URL`. The API key from `.env` is used automatically.

---

## API Endpoints

All endpoints require the `x-api-key` header except `GET /products/live-changes` and `GET /public/*`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/products` | List products. Query: `name`, `minPrice`, `maxPrice`, `availability`, `provider`, `page`, `limit` |
| `GET` | `/products/:id` | Product detail with full price history |
| `GET` | `/products/changes` | Price & availability changes. Query: `startDate`, `endDate`, `page`, `limit` |
| `GET` | `/products/live-changes` | **SSE** — streams live price change events |
| `GET` | `/products/simulate-change/:id/:price` | Trigger a manual price change (testing SSE) |
| `GET` | `/mock-providers/provider1` | Raw Provider 1 data (debug) |
| `GET` | `/mock-providers/provider2` | Raw Provider 2 data (debug) |

### Example requests

```bash
# List available products
curl -H "x-api-key: supersecureapikey123" http://localhost:3000/products

# Filter by price range
curl -H "x-api-key: supersecureapikey123" \
  "http://localhost:3000/products?minPrice=10&maxPrice=50&availability=true"

# Get price history for product ID 1
curl -H "x-api-key: supersecureapikey123" http://localhost:3000/products/1

# Get changes in last 24h
curl -H "x-api-key: supersecureapikey123" \
  "http://localhost:3000/products/changes?startDate=2026-06-12T00:00:00Z&endDate=2026-06-13T23:59:59Z"

# Trigger a price change (will appear in SSE stream)
curl -H "x-api-key: supersecureapikey123" \
  http://localhost:3000/products/simulate-change/1/29

# Subscribe to SSE (no API key needed)
curl -N http://localhost:3000/products/live-changes
```

---

## Swagger Documentation

Interactive API docs are available at:

```
http://localhost:3000/api
```

Click **Authorize** → enter your `API_KEY` value → all endpoints become testable in-browser.

---

## Postman Collection

A pre-configured Postman collection is available in the root folder:

- [product-price-aggregator.postman_collection.json](file:///c:/Users/omarz/Desktop/product-price-aggregator/product-price-aggregator.postman_collection.json)

To use it:
1. Import the JSON file into Postman.
2. In the collection settings, configure the environment variables:
   - `base_url`: Target URL of the API (defaults to `http://localhost:3000`).
   - `api_key`: API authentication token (defaults to `supersecureapikey123`).

---

## Premium React + Vite Pricing Dashboard

A beautiful, interactive React + Vite + Chart.js single-page portfolio dashboard is served at:

```
http://localhost:3000/public/index.html
```

Key features:
- **Metrics Overview**: Summary statistics (total items, average price, stale flags, active provider count).
- **Product Catalog**: Live search, provider dropdown, min/max price sliders, pagination, and details inspector.
- **Price History Charts**: Beautiful curved line charts visualizing price aggregation histories using Chart.js.
- **Live Price Stream**: Persistent SSE stream connection with real-time animated notifications and popup alert toasts.
- **Price Change Simulator**: Form to immediately trigger mock price changes on any product.
- **Settings Panel**: Configure and store the backend URL and `x-api-key` credentials in `localStorage`.

### Local Frontend Development
To run or build the frontend independently:
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173 (proxied to backend 3000)
npm run build    # Compiles and outputs production bundle directly to NestJS static public/ folder
```

---

## Design Decisions & Trade-offs

### Provider simulation (in-process vs. separate HTTP servers)
Providers are simulated as injectable services rather than separate HTTP processes. This keeps the project self-contained and runnable with a single `docker compose up`. In production these would be replaced by `HttpModule` (Axios) calls to real external APIs.

### SSE over WebSocket
The assignment specifically requested SSE. SSE is simpler (HTTP/1.1 compatible, no handshake, auto-reconnect in browsers) and sufficient for one-directional server→client price updates.

### `Promise.allSettled` for concurrent fetching
Using `allSettled` instead of `Promise.all` means a failure in one provider never aborts the aggregation cycle — the other providers' data is still saved.

### Stale data strategy
Rather than deleting stale records, an `isStale` boolean flag is set. This preserves historical data while allowing consumers to filter for fresh data via `isStale=false`.

### API key in middleware vs. guards
A NestJS middleware is used (rather than a `@UseGuards` decorator) so the auth logic applies globally without decorating every controller, while still allowing fine-grained bypass rules (SSE endpoint, public assets).

### `@nestjs/event-emitter` vs. RxJS Subject for SSE
Although `@nestjs/event-emitter` is installed, the SSE stream uses a plain RxJS `Subject` in `ProductsService`. This avoids an extra module import and gives direct Observable integration with NestJS's `@Sse()` decorator, which expects an `Observable<MessageEvent>`.
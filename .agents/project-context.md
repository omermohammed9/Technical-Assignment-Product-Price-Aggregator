# Project Context

## 1. Mission Statement
Build a production-quality NestJS API that aggregates pricing and availability data
for digital products (e-books, software licenses, digital courses) from multiple
simulated third-party providers. The system collects data concurrently, normalizes
heterogeneous schemas, tracks price and availability history, and exposes a
real-time SSE stream. Target audience: backend engineering portfolio reviewers.

## 2. Engineering Constraints
  - No production secrets in source. All config from process.env.
  - ValidationPipe with whitelist: true must remain global.
  - ApiKeyMiddleware must stay active on all routes except /products/live-changes and /public/*.
  - SSE must use RxJS Subject merged with snapshot from(). Never revert to one-shot.
  - SchedulerRegistry.addInterval() must always register the aggregation interval.
  - markStaleProducts() must run after every aggregation cycle.
  - Provider schemas must remain structurally different (proves normalization value).
  - All list endpoints return: { page, limit, total, totalPages, data[] }.
  - All numeric path params use ParseIntPipe.
  - No bare any types. No console.log in production code.

## 3. Architecture
  Stateful: PostgreSQL via Prisma (product catalog + price history)
  Stateless: NestJS HTTP layer (controllers, DTOs, middleware)
  Scheduled: AggregationService runs on configurable interval (DATA_FETCH_INTERVAL)
  Event-driven: RxJS Subject bridges price changes to SSE clients

  Module dependency chain:
    AppModule → PrismaModule (shared)
    AppModule → ProvidersModule
    AppModule → AggregationModule → ProvidersModule + PrismaModule
    AppModule → ProductsModule → PrismaModule

## 4. Database Schemas

### Product
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(255)
  description   String
  price         Float
  currency      String
  availability  Boolean
  provider      String
  isStale       Boolean  @default(false)
  lastUpdated   DateTime @updatedAt
  lastFetched   DateTime @default(now())
  history       PriceHistory[]
  Indexes: name, provider, price, isStale, lastFetched

### PriceHistory
  id                  Int      @id @default(autoincrement())
  productId           Int      (FK → Product)
  price               Float    (OLD price at change time)
  availabilityChanged Boolean  @default(false)
  timestamp           DateTime @default(now())
  Indexes: productId, timestamp

## 5. Security Threat Model
  Threat: Unauthorized API access → Mitigation: x-api-key middleware
  Threat: Invalid query injection → Mitigation: class-validator + whitelist DTOs
  Threat: DB injection → Mitigation: Prisma parameterized queries (no raw SQL)
  Threat: Sensitive config exposure → Mitigation: .env git-ignored, .env.example committed

## 6. Phase Status Tracker

| Phase | Description                    | Status      |
|-------|--------------------------------|-------------|
| P1    | Core assignment gaps (MVP)     | COMPLETED   |
| P2    | Portfolio upgrades             | IN_PROGRESS |

### P2 Completed Milestones (Backend)
  ✅ Redis caching layer for GET /products (resilient custom client)
  ✅ Global rate limiting via @nestjs/throttler (100 req/min)
  ✅ Structured logging via Pino and nestjs-pino (JSON in prod, pretty in dev)
  ✅ Database-integrated health check endpoint (/health) without auth
  ✅ GitHub Actions CI/CD Pipeline workflow (.github/workflows/ci.yml)

### P1 Completed Milestones
  ✅ docker-compose.yml + Dockerfile
  ✅ ValidationPipe globally registered
  ✅ ApiKeyMiddleware fixed and active
  ✅ SSE via RxJS Subject (persistent hot stream)
  ✅ SchedulerRegistry interval registration
  ✅ markStaleProducts() after each cycle
  ✅ Provider 2 & 3 structurally different schemas
  ✅ availabilityChanged tracked in PriceHistory
  ✅ isStale field on Product
  ✅ E2E tests covering real endpoints
  ✅ Full README.md

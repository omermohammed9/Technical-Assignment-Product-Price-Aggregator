# System Map

## 1. High-Level Architecture

  [HTTP Clients] → [ApiKeyMiddleware] → [ProductsController]
                                              ↓
  [AggregationService] ← [SchedulerRegistry] [ProductsService]
         ↓                                       ↓
  [ProvidersService]                     [RxJS Subject] → [SSE Clients]
  (3 different schemas)                       ↓
         ↓                              [PrismaService] → [PostgreSQL]
  [normalizeProducts()]
         ↓
  [$transaction: upsert + history]

## 2. Module Dependency Graph

  AppModule
    ├── ScheduleModule (global, from @nestjs/schedule)
    ├── PrismaModule   → exports PrismaService
    ├── ProvidersModule → exports ProvidersService
    ├── AggregationModule
    │     imports: [ProvidersModule, PrismaModule, RedisModule]
    │     providers: [AggregationService]
    ├── ProductsModule
    │     imports: [PrismaModule, RedisModule]
    │     providers: [ProductsService]
    │     controllers: [ProductsController]
    └── HealthModule
          controllers: [HealthController]

## 3. File Inventory

| File Path                                        | Status       | Owner Agent         | Key Deps                       |
|--------------------------------------------------|-------------|---------------------|--------------------------------|
| src/main.ts                                      | implemented | api-agent           | ValidationPipe, SwaggerModule  |
| src/app.module.ts                                | implemented | architect-agent     | all modules                    |
| src/middleware/api-key.middleware.ts              | implemented | api-agent           | NestMiddleware                 |
| src/aggregation/aggregation.module.ts            | implemented | aggregation-agent   | ProvidersModule, PrismaModule  |
| src/aggregation/aggregation.service.ts           | implemented | aggregation-agent   | PrismaService, ProvidersService, SchedulerRegistry, RedisService |
| src/aggregation/aggregation.service.spec.ts      | implemented | test-agent          | jest mocks                     |
| src/products/products.module.ts                  | implemented | api-agent           | PrismaModule                   |
| src/products/products.controller.ts              | implemented | api-agent           | ProductsService, RxJS          |
| src/products/products.service.ts                 | implemented | api-agent           | PrismaService, RxJS Subject, RedisService |
| src/products/dto/get-products.dto.ts             | implemented | api-agent           | class-validator                |
| src/products/dto/get-product-changes.dto.ts      | implemented | api-agent           | class-validator                |
| src/providers/providers.module.ts                | implemented | aggregation-agent   | ProvidersService               |
| src/providers/providers.controller.ts            | implemented | api-agent           | ProvidersService               |
| src/providers/providers.service.ts               | implemented | aggregation-agent   | (none)                         |
| src/providers/providers.service.spec.ts          | implemented | test-agent          | jest                           |
| src/providers/providers.controller.spec.ts       | implemented | test-agent          | jest                           |
| src/modules/prisma/prisma.module.ts              | implemented | db-agent            | PrismaClient                   |
| src/modules/prisma/prisma.service.ts             | implemented | db-agent            | PrismaClient                   |
| src/modules/redis/redis.module.ts                | implemented | db-agent            | ioredis                        |
| src/modules/redis/redis.service.ts               | implemented | db-agent            | ioredis                        |
| src/health/health.module.ts                      | implemented | api-agent           | PrismaService                  |
| src/health/health.controller.ts                  | implemented | api-agent           | PrismaService                  |
| src/health/health.controller.spec.ts             | implemented | test-agent          | jest                           |
| prisma/schema.prisma                             | implemented | db-agent            | PostgreSQL                     |
| prisma/migrations/                               | implemented | db-agent            | prisma migrate                 |
| public/                                          | implemented | docs-agent          | Built React + Vite SPA assets  |
| frontend/                                        | implemented | architect-agent     | React + Vite + Chart.js source |
| test/app.e2e-spec.ts                             | implemented | test-agent          | supertest, AppModule           |
| Dockerfile                                       | implemented | architect-agent     | node:20-alpine                 |
| docker-compose.yml                               | implemented | architect-agent     | postgres:16-alpine, redis:7-alpine |
| .env.example                                     | implemented | docs-agent          | (reference only)               |
| .github/workflows/ci.yml                         | implemented | architect-agent     | GitHub Actions                 |
| README.md                                        | implemented | docs-agent          | (all modules)                  |
| product-price-aggregator.postman_collection.json | implemented | docs-agent          | Postman API collection         |
| GEMINI.md                                        | implemented | docs-agent          | governance files               |
| GSD_PROJECT_RULES.md                             | implemented | docs-agent          | governance files               |
| .agents/rules/AGENTS.md                          | implemented | docs-agent          | (this system)                  |
| .agents/workflow.md                              | implemented | docs-agent          | (this system)                  |
| .agents/project-context.md                       | implemented | docs-agent          | (this system)                  |
| .agents/system-map.md                            | implemented | docs-agent          | (this system)                  |
| .agents/tasks_status_matrix.md                   | implemented | docs-agent          | (this system)                  |
| .agents/gsd-integration.md                       | implemented | docs-agent          | (this system)                  |
| .gsd/SPEC.md                                     | implemented | docs-agent          | (this system)                  |
| .gsd/STATE.md                                    | implemented | docs-agent          | (this system)                  |
| .gsd/JOURNAL.md                                  | implemented | docs-agent          | (this system)                  |
| GSD-STYLE.md                                     | implemented | docs-agent          | (this system)                  |
| .prompt-template.md                              | implemented | docs-agent          | (this system)                  |

## 4. Dependency Manifest

| Package                   | Version  | Purpose                              |
|---------------------------|----------|--------------------------------------|
| @nestjs/common            | ^11.0.7  | Core decorators, exceptions, pipes   |
| @nestjs/core              | ^11.0.7  | NestFactory, bootstrap               |
| @nestjs/platform-express  | ^11.0.7  | Express HTTP adapter                 |
| @nestjs/schedule          | ^5.0.1   | ScheduleModule, SchedulerRegistry    |
| @nestjs/swagger           | ^11.0.3  | OpenAPI/Swagger integration          |
| @nestjs/throttler         | ^6.0.0   | Global Rate Limiting                 |
| @nestjs/axios             | ^4.0.0   | HttpModule (available, unused in P1) |
| @nestjs/event-emitter     | ^3.0.0   | Installed but superseded by Subject  |
| @prisma/client            | ^6.3.0   | Generated DB client                  |
| prisma                    | ^6.3.0   | CLI for migrations                   |
| rxjs                      | ^7.8.1   | Subject, Observable, merge, from     |
| dotenv                    | ^16.4.7  | Env file loading                     |
| class-validator           | ^0.14.1  | DTO validation decorators            |
| class-transformer         | ^0.5.1   | Transform decorators (Type, Transform)|
| swagger-ui-express        | ^5.0.1   | Swagger UI serving                   |
| ioredis                   | ^5.4.1   | Redis client library                 |
| nestjs-pino               | ^4.3.0   | Structured pino logging for NestJS   |
| pino                      | ^9.0.0   | Fast, structured logging library     |
| pino-pretty               | ^11.0.0  | Development pretty logger            |

## 5. Route Contracts

| Method | Route                              | Auth     | Query Params                                     | Response Shape                              |
|--------|------------------------------------|----------|--------------------------------------------------|---------------------------------------------|
| GET    | /products                          | required | name, minPrice, maxPrice, availability, provider, page, limit | { page, limit, total, totalPages, data[] } |
| GET    | /products/:id                      | required | —                                                | Product + history[]                         |
| GET    | /products/changes                  | required | startDate, endDate, page, limit                  | { page, limit, total, totalPages, data[] } |
| GET    | /products/live-changes             | exempt   | — (SSE)                                          | MessageEvent stream                         |
| GET    | /products/simulate-change/:id/:price | required | —                                              | Updated Product                             |
| GET    | /health                            | exempt   | —                                                | Health status check ({ status, database })  |
| GET    | /mock-providers/provider1          | required | —                                                | Raw Provider 1 array                        |
| GET    | /mock-providers/provider2          | required | —                                                | Raw Provider 2 array                        |

## 6. Naming Conventions

  Files:      kebab-case.ts         → aggregation.service.ts
  Classes:    PascalCase            → AggregationService
  Methods:    camelCase             → normalizeProducts()
  Variables:  camelCase             → fetchInterval
  Constants:  UPPER_SNAKE_CASE      → STALE_THRESHOLD_MS
  DTOs:       PascalCase + Dto      → GetProductsDto
  Env vars:   UPPER_SNAKE_CASE      → DATA_FETCH_INTERVAL
  Prisma:     PascalCase models     → Product, PriceHistory
  Git msgs:   Conventional Commits  → feat(scope): description

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

| File Path | Status | Key Dependencies | Description / Explanation |
| :--- | :--- | :--- | :--- |
| **Core & Infrastructure** | | | |
| [src/main.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/main.ts) | implemented | ValidationPipe, SwaggerModule, Logger | Entry point for the NestJS application. Boots NestJS, registers global ValidationPipe, serves built frontend, and enables Pino logger. |
| [src/app.module.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/app.module.ts) | implemented | ThrottlerModule, BullModule, ObservabilityModule | Root application module. Configures global middleware, rate-limiting, queues, and registers sub-modules. |
| [src/middleware/api-key.middleware.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/middleware/api-key.middleware.ts) | implemented | NestMiddleware, JwtService | Middleware enabling hybrid authentication (validating either `x-api-key` header or JWT Bearer token). |
| **Database & Cache Modules** | | | |
| [src/modules/prisma/prisma.module.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/prisma/prisma.module.ts) | implemented | PrismaService | NestJS wrapper module that exports the database ORM service. |
| [src/modules/prisma/prisma.service.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/prisma/prisma.service.ts) | implemented | PrismaClient | Core service managing PostgreSQL connectivity and lifecycle events via Prisma ORM. |
| [src/modules/redis/redis.module.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/redis/redis.module.ts) | implemented | RedisService | NestJS wrapper module that configures and exports the Redis cache service. |
| [src/modules/redis/redis.service.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/redis/redis.service.ts) | implemented | ioredis, Logger | Service wrapping Redis client operations with silent resilience fallbacks and metrics tracking. |
| **Authentication Module** | | | |
| [src/modules/auth/auth.module.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/auth.module.ts) | implemented | PassportModule, JwtModule, PrismaService | Configures passport strategies, JWT generation, and registers authentication controllers. |
| [src/modules/auth/auth.controller.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/auth.controller.ts) | implemented | AuthService, LoginDto, RegisterDto | Controller exposing public POST endpoints for user registration and credential login. |
| [src/modules/auth/auth.service.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/auth.service.ts) | implemented | PrismaService, JwtService | Handles credential validation, bcrypt password hashing, and user payload signing. |
| [src/modules/auth/jwt.strategy.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/jwt.strategy.ts) | implemented | PassportStrategy, ExtractJwt | Strategy extracting and validating JWT Bearer tokens from incoming HTTP request headers. |
| [src/modules/auth/decorators/roles.decorator.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/decorators/roles.decorator.ts) | implemented | SetMetadata | Custom metadata decorator to enforce role-based access control annotations on endpoints. |
| [src/modules/auth/dto/login.dto.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/dto/login.dto.ts) | implemented | class-validator | DTO class enforcing email validation and password checks during login requests. |
| [src/modules/auth/dto/register.dto.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/dto/register.dto.ts) | implemented | class-validator | DTO class verifying register requests containing email, password, and designated roles. |
| [src/modules/auth/enums/role.enum.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/enums/role.enum.ts) | implemented | None | Defines application user roles (`USER`, `ADMIN`) to govern authorization policies. |
| [src/modules/auth/guards/jwt-auth.guard.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/guards/jwt-auth.guard.ts) | implemented | AuthGuard | Custom guard leveraging Passport to check JWT Bearer validation on endpoints. |
| [src/modules/auth/guards/roles.guard.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/auth/guards/roles.guard.ts) | implemented | Reflector | Guard mapping custom roles metadata against user profiles to restrict handler access. |
| **Observability & Health Modules** | | | |
| [src/modules/observability/observability.module.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/observability/observability.module.ts) | implemented | PrometheusModule, MetricsService | Sets up custom metric registries and standard endpoints for scraping. |
| [src/modules/observability/metrics.service.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/modules/observability/metrics.service.ts) | implemented | makeCounterProvider, makeGaugeProvider | Registers and updates Prometheus metrics (caching hits, execution times, fetch health). |
| [src/health/health.module.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/health/health.module.ts) | implemented | HealthController, PrismaService | Configures and sets up health indicators and dependencies. |
| [src/health/health.controller.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/health/health.controller.ts) | implemented | PrismaService | Controller exposing the public GET `/health` endpoint to check PostgreSQL connection status. |
| **Aggregator & Mock Providers** | | | |
| [src/aggregation/aggregation.module.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/aggregation/aggregation.module.ts) | implemented | ProvidersModule, PrismaModule, BullModule | Imports dependencies and exports the AggregationService worker setup. |
| [src/aggregation/aggregation.service.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/aggregation/aggregation.service.ts) | implemented | PrismaService, ProvidersService, BullMQ | Service managing distributed BullMQ repeatable fetching jobs, delta logging, and stale products logic. |
| [src/providers/providers.module.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/providers/providers.module.ts) | implemented | ProvidersService | Configures and registers mock third-party API routes and services. |
| [src/providers/providers.controller.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/providers/providers.controller.ts) | implemented | ProvidersService | Controller providing raw mock data for iTunes, CoinGecko, Binance, and CheapShark feeds. |
| [src/providers/providers.service.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/providers/providers.service.ts) | implemented | Logger | Service simulating dynamic pricing outputs mapping Apple, crypto, and game stores. |
| **Products Module** | | | |
| [src/products/products.module.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/products/products.module.ts) | implemented | PrismaModule, RedisModule, ProductsService | Connects database querying logic and caching to products endpoints. |
| [src/products/products.controller.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/products/products.controller.ts) | implemented | ProductsService, GetProductsDto | Controller routing catalog retrieval, change logs, simulation endpoints, and SSE stream. |
| [src/products/products.service.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/products/products.service.ts) | implemented | PrismaService, RedisService, Subject | Handles catalog query builders, cache reads/invalidations, and live SSE event broadcasts. |
| [src/products/dto/get-products.dto.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/products/dto/get-products.dto.ts) | implemented | class-validator | Defines and validates query parameters for sorting and filtering product catalogs. |
| [src/products/dto/get-product-changes.dto.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/products/dto/get-product-changes.dto.ts) | implemented | class-validator | Validates historical timeframe limits for retrieving price history change logs. |
| **Frontend Dashboard source files** | | | |
| [frontend/src/main.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/main.tsx) | implemented | React, App | Application mount script initializing React rendering inside Vite. |
| [frontend/src/App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx) | implemented | React, Chart.js, Lucide Icons | Main component handling views, state routing, JWT tokens, and SSE event streaming. |
| [frontend/src/index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css) | implemented | Vanilla CSS | Styling system declaring variables, animations, glassmorphism tokens, and layout guidelines. |
| [frontend/src/components/AuthModal.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/AuthModal.tsx) | implemented | React | Glassmorphic modal overlay managing registration and login forms with error feedback. |
| [frontend/src/components/DeveloperConsole.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/DeveloperConsole.tsx) | implemented | React | Inspector tab displaying active tokens and streaming real-time client side SSE events. |
| [frontend/src/components/LiveChangeFeed.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/LiveChangeFeed.tsx) | implemented | React, Lucide Icons | Dashboard component showing recent real-time product price adjustments with delta badges. |
| [frontend/src/components/MetricsOverview.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/MetricsOverview.tsx) | implemented | React, Lucide Icons | Displays dashboard metrics (cache hit rate, total items, stale flags, and active providers). |
| [frontend/src/components/ProductHistoryChart.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductHistoryChart.tsx) | implemented | React, Chart.js | Renders curved historical line charts mapping previous prices of selected products. |
| [frontend/src/components/ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx) | implemented | React, Sparklines | Grid system mapping products with catalog search, filtering, and detail selection indicators. |
| [frontend/src/components/ProviderStatus.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProviderStatus.tsx) | implemented | React | Visual dashboard representing provider fetching status, latency gauges, and queue status. |
| [frontend/src/components/Simulator.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/Simulator.tsx) | implemented | React | Administration form for triggering instant simulated catalog price updates. |
| **Testing Suites** | | | |
| [src/aggregation/aggregation.service.spec.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/aggregation/aggregation.service.spec.ts) | implemented | Jest, PrismaService | Unit testing suite covering concurrent fetching, normalization mapping, and stale flagging. |
| [src/health/health.controller.spec.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/health/health.controller.spec.ts) | implemented | Jest, HealthController | Validates that the health checker returns positive db status. |
| [src/providers/providers.controller.spec.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/providers/providers.controller.spec.ts) | implemented | Jest, ProvidersController | Verifies that mock provider controllers respond with the correct payload shapes. |
| [src/providers/providers.service.spec.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/src/providers/providers.service.spec.ts) | implemented | Jest, ProvidersService | Tests dynamic data generation and schema divergence constraints. |
| [test/app.e2e-spec.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/test/app.e2e-spec.ts) | implemented | Supertest, NestApplication | End-to-end integration tests asserting rate limiting, route guarding, and SSE subscriptions. |
| **Configuration & Governance** | | | |
| [prisma/schema.prisma](file:///c:/Users/omarz/Desktop/product-price-aggregator/prisma/schema.prisma) | implemented | PostgreSQL | Database schema modeling User and Product records. |
| [Dockerfile](file:///c:/Users/omarz/Desktop/product-price-aggregator/Dockerfile) | implemented | node:20-alpine | Multi-stage Docker instructions compiling frontend assets and running NestJS production environment. |
| [docker-compose.yml](file:///c:/Users/omarz/Desktop/product-price-aggregator/docker-compose.yml) | implemented | Docker | Environment orchestrator linking postgres, redis, backend, frontend HMR volume, prometheus, and grafana. |
| [.env.example](file:///c:/Users/omarz/Desktop/product-price-aggregator/.env.example) | implemented | Env Reference | Template declaring configuration variables needed for setup. |
| [.github/workflows/ci.yml](file:///c:/Users/omarz/Desktop/product-price-aggregator/.github/workflows/ci.yml) | implemented | GitHub Actions | Integration pipeline verifying linting, compilation, and test suite execution. |
| [product-price-aggregator.postman_collection.json](file:///c:/Users/omarz/Desktop/product-price-aggregator/product-price-aggregator.postman_collection.json) | implemented | Postman API | Shared API queries mapping catalog search, authentication register/login, and health/SSE routes. |
| [README.md](file:///c:/Users/omarz/Desktop/product-price-aggregator/README.md) | implemented | Docs | Complete deployment, setup, architectural descriptions, and API routes documentation. |
| [PROJECT_CONTEXT.md](file:///c:/Users/omarz/Desktop/product-price-aggregator/PROJECT_CONTEXT.md) | implemented | Docs | Documents system architecture, phase goals, threat model, and milestones. |
| [SYSTEM_MAP.md](file:///c:/Users/omarz/Desktop/product-price-aggregator/SYSTEM_MAP.md) | implemented | Docs | Root-level map tracking the file inventory and route contracts. |
| [audit_report.md](file:///c:/Users/omarz/Desktop/product-price-aggregator/audit_report.md) | implemented | Docs | Technical audit report measuring codebase completion, architecture, and threat gaps. |
| [GEMINI.md](file:///c:/Users/omarz/Desktop/product-price-aggregator/GEMINI.md) | implemented | Docs | Main AI agent bootsrap and workflow rules file. |
| [GSD_PROJECT_RULES.md](file:///c:/Users/omarz/Desktop/product-price-aggregator/GSD_PROJECT_RULES.md) | implemented | Docs | Defines strict constraints on database execution and API modifications. |
| [GSD-STYLE.md](file:///c:/Users/omarz/Desktop/product-price-aggregator/GSD-STYLE.md) | implemented | Docs | Governs design systems, typography standards, and responsive frontend patterns. |
| [.prompt-template.md](file:///c:/Users/omarz/Desktop/product-price-aggregator/.prompt-template.md) | implemented | Docs | Prompt template structure used for sprint plans. |

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

# 📖 Project Context (PROJECT_CONTEXT.md)

## 📌 Overview
The **Product Price Aggregator** is a NestJS backend API that collects, normalizes, and serves pricing and availability data for digital products from multiple simulated third-party providers. It supports real-time change streaming via SSE, full price history tracking, and filtering/pagination across all endpoints.

## 🛠️ Architecture & Tech Stack
*   **Framework**: NestJS v11 (TypeScript, strict mode)
*   **ORM**: Prisma v6
*   **Database**: PostgreSQL 16 (Docker-ready via `docker-compose.yml`)
*   **Scheduling**: `@nestjs/schedule` with `SchedulerRegistry`-managed interval
*   **Real-time**: Server-Sent Events (SSE) via RxJS `Subject` in `ProductsService`
*   **Auth**: Custom `ApiKeyMiddleware` — `x-api-key` header required on all routes except SSE + `/public`
*   **Validation**: Global `ValidationPipe` with `class-validator` + `class-transformer`
*   **API Docs**: Swagger/OpenAPI at `GET /api`
*   **Testing**: Jest (unit) + Supertest (e2e)
*   **Container**: Dockerfile (multi-stage) + docker-compose.yml

## 🗄️ Database Models
*   **Product** — id, name, description, price, currency, availability, provider, isStale, lastUpdated, lastFetched
*   **PriceHistory** — id, productId (FK), price (old), availabilityChanged, timestamp

## 🎯 Current Status
*   **Phase 1 (MVP Gaps)**: ✅ Complete — all original assignment requirements implemented
*   **Phase 2 (Portfolio Upgrades)**: 🔲 Backlog — React dashboard, Redis cache, CI/CD

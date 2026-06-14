# SPEC.md — Requirements Specification

Status: COMPLETED
Last Updated: 2026-06-14
Source of Truth: .agents/project-context.md

---

## Active Goal
Implement E2E test coverage for health checks and rate limiting infrastructure, and create a comprehensive Postman API collection for all endpoints.

## Requirements (In-Scope)

  REQ-01: Implement Redis caching for `GET /products` with a 60s TTL, invalidated when aggregation completes or when prices are manually simulated. (COMPLETED)
  REQ-02: Integrate rate limiting globally using `@nestjs/throttler`. (COMPLETED)
  REQ-03: Integrate structured logging using `pino` (JSON in production, pretty-printed in development). (COMPLETED)
  REQ-04: Add a health check endpoint `/health` verifying Database availability (exempt from API key middleware). (COMPLETED)
  REQ-05: Configure a CI/CD pipeline workflow using GitHub Actions. (COMPLETED)
  REQ-06: Create a Postman API collection JSON file (`product-price-aggregator.postman_collection.json`) in the root directory documenting all API endpoints, parameters, and headers (using variables for configurable keys like `{{api_key}}`).
  REQ-07: Implement E2E test block in `test/app.e2e-spec.ts` verifying `GET /health` behaves correctly and returns the expected health/database connection schema.
  REQ-08: Implement E2E test block in `test/app.e2e-spec.ts` validating global rate limiting configuration by making successive rapid requests to trigger a `429 Too Many Requests` status code.

## Non-Goals (Out-of-Scope)

  ❌ React + Vite frontend dashboard (this will be done in the next phase after backend is stable)
  ❌ Breaking existing API contracts or routes
  ❌ Exposing secrets or keys in the git repo

## Reference

  Architecture: .agents/system-map.md
  Phase Status: .agents/tasks_status_matrix.md
  Code Standards: .agents/rules/code-standards.md



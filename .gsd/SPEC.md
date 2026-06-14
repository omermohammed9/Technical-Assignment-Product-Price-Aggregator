# SPEC.md — Requirements Specification

Status: FINALIZED
Last Updated: 2026-06-14
Source of Truth: .agents/project-context.md

---

## Active Goal
Implement Phase 2 backend upgrades for the product-price-aggregator repository to enhance performance, health monitoring, rate limiting, structured logging, and build pipelines.

## Requirements (In-Scope)

  REQ-01: Implement Redis caching for `GET /products` with a 60s TTL, invalidated when aggregation completes or when prices are manually simulated.
  REQ-02: Integrate rate limiting globally using `@nestjs/throttler`.
  REQ-03: Integrate structured logging using `pino` (JSON in production, pretty-printed in development).
  REQ-04: Add a health check endpoint `/health` verifying Database availability (exempt from API key middleware).
  REQ-05: Configure a CI/CD pipeline workflow using GitHub Actions.

## Non-Goals (Out-of-Scope)

  ❌ React + Vite frontend dashboard (this will be done in the next phase after backend is stable)
  ❌ Breaking existing API contracts or routes
  ❌ Exposing secrets or keys in the git repo

## Reference

  Architecture: .agents/system-map.md
  Phase Status: .agents/tasks_status_matrix.md
  Code Standards: .agents/rules/code-standards.md


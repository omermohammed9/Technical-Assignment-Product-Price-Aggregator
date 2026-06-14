# SPEC.md — Requirements Specification

Status: FINALIZED
Last Updated: 2026-06-14
Source of Truth: .agents/project-context.md

---

## Active Goal
Make the product price aggregator enterprise-ready by introducing JWT-based local authentication and Role-Based Access Control (RBAC), migrating scheduling from in-process intervals to BullMQ distributed concurrent background queues, and integrating system-wide metrics via Prometheus and Grafana.

## Requirements (In-Scope)

  REQ-16: Implement AuthModule with registration (POST /auth/register) and login (POST /auth/login) using bcrypt, JWT token signing, and a PostgreSQL User table with ADMIN and USER roles.
  REQ-17: Implement JwtAuthGuard and RolesGuard. Standard routes (e.g. GET /products) require USER/ADMIN, while simulator routes (GET /products/simulate-change/*) require ADMIN role.
  REQ-18: Exclude authentication paths (/auth/*), health checks (/health), and metrics (/metrics) from API key/JWT requirements, while allowing either a valid x-api-key or a valid Bearer JWT for all other endpoints.
  REQ-19: Migrate scheduled aggregation logic to a BullMQ repeatable job. Establish a flow where a parent job complete-cycle runs markStaleProducts() and Redis cache invalidation after 3 sibling workers fetch provider-1, provider-2, and provider-3 concurrently.
  REQ-20: Integrate @willsoto/nestjs-prometheus to expose a /metrics endpoint reporting cache hit/miss rates, total aggregation cycle durations/statuses, and individual provider fetch durations/statuses.
  REQ-21: Configure Prometheus and Grafana containers in docker-compose.yml with dynamic configuration and pre-built operational dashboard mapping.

## Non-Goals (Out-of-Scope)

  ❌ Deleting existing database migration history
  ❌ Disabling rate limiting or structured logging
  ❌ Exposing raw database credentials publicly

## Reference

  Architecture: .agents/system-map.md
  Phase Status: .agents/tasks_status_matrix.md
  Code Standards: .agents/rules/code-standards.md

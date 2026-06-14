# Security Engineering Rules

## 1. Scope Boundary

Allowed agent operations:
  ✅ Reading and modifying TypeScript source files in src/
  ✅ Reading and modifying Prisma schema in prisma/
  ✅ Reading and modifying markdown governance files
  ✅ Running read-only commands: ls, grep, cat, npm run test, npm run lint
  ✅ Running non-destructive builds: npm run build, nest build

Forbidden without user approval:
  ❌ Any database migration or reset
  ❌ Any docker volume deletion
  ❌ Any git operation that rewrites history
  ❌ Any package installation or removal

## 2. Safety Controls

### 2.1 Input Validation
  - All HTTP query/body inputs MUST go through class-validator DTOs.
  - ValidationPipe with { whitelist: true } must remain registered globally.
  - ParseIntPipe on all numeric path params (:id, :price).
  - No raw req.body access in controllers — always typed DTO.

### 2.2 Command Injection Prevention
  - Provider simulation is in-process only — no shell exec, no child_process.
  - No dynamic SQL — Prisma parameterized queries only.
  - No template-literal SQL strings.

### 2.3 Rate Limiting (Phase 2)
  - @nestjs/throttler to be applied in Phase 2.
  - SSE endpoint exempt from rate limiting (persistent connection).

### 2.4 Credential Management
  - All secrets loaded from process.env only.
  - No hardcoded credentials anywhere in source.
  - .env is git-ignored. .env.example is committed.
  - API_KEY minimum length: 16 characters.
  - DATABASE_URL must never be logged — only log DB connection status.

## 3. Verification Proofs

Agents must NOT use speculative language:
  ❌ "This should work"
  ❌ "This looks correct"
  ❌ "It probably handles this case"

Instead, provide empirical proof:
  ✅ npm run test output showing passing tests
  ✅ curl command + actual response demonstrating behavior
  ✅ npm run build output showing 0 errors
  ✅ npm run lint output showing 0 warnings

## 4. Claim Restrictions

Before stating any behavioral claim about the code, the agent must:
  1. Have read the relevant source file in the current session.
  2. Be able to cite the exact line(s) that support the claim.
  3. OR explicitly flag: "Unverified — requires test run to confirm."

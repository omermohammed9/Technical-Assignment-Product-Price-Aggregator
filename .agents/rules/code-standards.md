# Code Standards — product-price-aggregator

## 1. Mandatory File Header
Every new `.ts` module file MUST begin with this block:

/**
 * @module    <ModuleName>
 * @purpose   <One sentence description>
 * @design    <Key architectural decision, e.g. "Uses RxJS Subject for SSE hot stream">
 * @public    <List of exported classes / functions>
 * @depends   <Direct NestJS module imports>
 */

## 2. Clean Code Principles

### 2.1 Single Responsibility
- One class = one reason to change.
- Controllers: route and delegate only. No business logic.
- Services: business logic only. No HTTP concepts.
- Modules: wire providers and imports only.

### 2.2 Function Design Limits
- Max function length: 40 lines (excluding comments/blanks).
- Max parameters: 4. Use an options object if more are needed.
- Max nesting depth: 3 levels. Extract inner blocks to named helpers.
- No nested callbacks. Use async/await exclusively.

### 2.3 DRY
- Extract repeated WHERE clauses to a shared helper.
- Extract pagination skip/take to a `buildPagination(page, limit)` utility.
- Never duplicate the provider-normalization mapping logic.

## 3. Type Safety

- All public method signatures must declare full TypeScript types.
- Return type must be explicit — never inferred on public APIs.
- Use `unknown` instead of `any` for untyped external data.
- The only allowed `any` is inside `normalizeProducts()` for raw provider payloads,
  and it MUST carry: // eslint-disable-next-line @typescript-eslint/no-explicit-any

### Examples

// ✅ Correct
async getAllProducts(filters: GetProductsDto): Promise<PaginatedResponse<Product>>

// ❌ Forbidden
async getAllProducts(filters: any)

## 4. Exception Handling

- Throw typed NestJS exceptions: NotFoundException, UnauthorizedException,
  BadRequestException, InternalServerErrorException.
- Never swallow errors silently (no empty catch blocks).
- All provider fetches: wrapped in fetchWithRetries() with exponential backoff.
- Logger.error() on every caught exception before re-throw or recovery.

## 5. Logging Standards

- Use NestJS Logger: private readonly logger = new Logger(ClassName.name);
- Levels:
    logger.log()   → normal lifecycle events (aggregation started, completed)
    logger.warn()  → recoverable anomalies (provider failure, stale data marked)
    logger.error() → unrecoverable errors (transaction failure, migration error)
    logger.debug() → verbose diagnostic data (normalized product dump)
- Never use console.log() in production code.

## 6. Separation of I/O from Logic

// ✅ Correct — pure normalization logic, no DB calls
private normalizeProducts(raw: unknown[]): NormalizedProduct[] { ... }

// ✅ Correct — I/O separated from logic
async aggregateData() {
  const raw = await this.fetchAllProviders();   // I/O
  const data = this.normalizeProducts(raw);      // Pure logic
  await this.upsertProducts(data);               // I/O
}

// ❌ Forbidden — mixed logic and I/O
async aggregateData() {
  const products = await this.fetchProvider1();
  for (const p of products) {
    p.price = p.cost ?? p.listPrice;             // logic buried in I/O flow
    await this.prisma.product.upsert(...);        // I/O inside normalization
  }
}

## 7. Naming Conventions

| Token             | Convention    | Example                        |
|-------------------|---------------|--------------------------------|
| Variables/methods | camelCase     | fetchWithRetries, normalizeProducts |
| Classes           | PascalCase    | AggregationService             |
| Files             | kebab-case    | aggregation.service.ts         |
| Constants         | UPPER_SNAKE   | STALE_THRESHOLD_MS             |
| DTOs              | PascalCase+Dto| GetProductsDto                 |
| Prisma models     | PascalCase    | Product, PriceHistory          |
| Env vars          | UPPER_SNAKE   | DATA_FETCH_INTERVAL            |

## 8. Code Quality Self-Check (before declaring done)

[ ] File header present on new modules
[ ] All public methods have explicit return types
[ ] No `any` without eslint-disable comment
[ ] No console.log — only Logger.*
[ ] All catch blocks call logger.error()
[ ] Functions ≤ 40 lines
[ ] Nesting depth ≤ 3
[ ] DTOs used for all query/body params
[ ] ParseIntPipe on all numeric path params
[ ] Pagination returns { page, limit, total, totalPages, data[] }

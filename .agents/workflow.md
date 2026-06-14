# Agent Workflow — Operations Manual

## 1. Session Start Protocol (read-only, every session)

Read these files in order before any action:
  1. GEMINI.md                          (auto-loaded, confirms governance is active)
  2. .agents/rules/AGENTS.md            (quota governor + agent registry)
  3. .agents/rules/strict-resource-management.md
  4. .agents/project-context.md         (current phase, schema, status)
  5. .agents/system-map.md              (file inventory + routes)
  6. .agents/tasks_status_matrix.md     (what is pending)
  7. .gsd/SPEC.md                       (confirm FINALIZED before executing)

## 2. Pre-Flight Gate

  [ ] Is .gsd/SPEC.md Status: FINALIZED? (If DRAFT → stop, update SPEC, get approval)
  [ ] Is the target task status [BACKLOG] or [IN_PROGRESS]? (Never redo [COMPLETED] tasks)
  [ ] Have all session-start files been read?
  [ ] Has scope been declared? (FILES TO TOUCH / FILES OFF-LIMITS)

## 3. Implementation Steps

  1. Read target file(s) with view_file or grep_search (never edit blindly).
  2. Select the correct model per .agents/rules/AGENTS.md quota matrix.
  3. Write targeted diff via multi_replace_file_content (or write_to_file for new files).
  4. If Prisma schema changed: propose migration command, DO NOT run it.
  5. If new env var added: update .env.example.

## 4. Verification Suite (run after every EXECUTE step)

  npm run build          → 0 TypeScript compilation errors
  npm run lint           → 0 ESLint errors
  npm run test           → all unit tests pass
  npm run test:e2e       → all e2e tests pass (requires running DB)
  npm run test:cov       → coverage report generated

## 5. Post-Task Documentation Gate

Before marking [COMPLETED]:
  [ ] .agents/tasks_status_matrix.md updated (status + date)
  [ ] .agents/system-map.md updated (if file structure changed)
  [ ] .agents/project-context.md updated (if schema/stack changed)
  [ ] .gsd/JOURNAL.md entry appended
  [ ] README.md updated (if API or setup changed)
  [ ] Drift checklist in documentation-drift-guard.md evaluated

## 6. Cross-Module Contract Freeze

These cannot change without architect-agent review and user approval:

| Contract Item                    | Location                          | Freeze Reason                         |
|----------------------------------|-----------------------------------|---------------------------------------|
| Product model fields             | prisma/schema.prisma              | Breaking change to all consumers      |
| PriceHistory model fields        | prisma/schema.prisma              | Breaks history queries + e2e tests    |
| GET /products response shape     | products.service.ts               | Frontend / API consumers depend on it |
| GET /products/changes shape      | products.service.ts               | Breaks client change tracking         |
| SSE event shape                  | products.service.ts (Subject emit)| Breaks SSE visualization page         |
| ApiKeyMiddleware bypass paths    | api-key.middleware.ts             | Security boundary                     |
| Provider ID offsets (1–2, 3–4, 5–6) | providers.service.ts          | DB primary keys depend on ranges      |
| fetchWithRetries() signature     | aggregation.service.ts            | Used in all provider fetch calls      |
| DATA_FETCH_INTERVAL env var      | .env / aggregation.service.ts     | Operational tuning lever              |

## 7. Commit Protocol

  git add <changed files only>
  git commit -m "type(scope): imperative description"

  Types: feat · fix · docs · refactor · test · chore
  Scopes: aggregation · products · providers · prisma · middleware · docs · config

  Examples:
    feat(products): add isStale filter to GET /products
    fix(aggregation): register interval with SchedulerRegistry
    docs(readme): add curl examples for all endpoints
    chore(deps): upgrade @nestjs/schedule to v5.0.1

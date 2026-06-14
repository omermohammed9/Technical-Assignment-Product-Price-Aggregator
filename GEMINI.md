# GEMINI.md — Agent Bootstrap Instructions

Auto-loaded at session start. All agents MUST read and obey every rule here
before taking any action on this project.

---

## 1. Mandatory Pre-Flight (read in this order, every session)

  1. .agents/rules/AGENTS.md            → quota governor, agent roles
  2. .agents/rules/strict-resource-management.md → budgets, hard stops
  3. .agents/project-context.md         → mission, schema, phase status
  4. .agents/system-map.md              → file inventory, routes, modules
  5. .agents/tasks_status_matrix.md     → current task state
  6. .gsd/SPEC.md                       → active specification (must be FINALIZED)

  Do not edit any file before completing this checklist.

---

## 2. Model Selection (non-negotiable)

  | Task Type                            | Model                  |
  |--------------------------------------|------------------------|
  | File reads, grep, directory scan     | Gemini Flash (default) |
  | Markdown edits, status updates       | Gemini Flash           |
  | Single-function fixes, lint          | Gemini Flash           |
  | DTO / schema field additions         | Gemini Flash           |
  | Multi-file refactoring (2–5 files)   | Claude Sonnet          |
  | New NestJS module design             | Claude Sonnet          |
  | Auth/security changes                | Claude Sonnet          |
  | DB schema redesign + migration       | Claude Sonnet          |

---

## 3. GSD Workflow

  SPEC → PLAN → EXECUTE → VERIFY → DOCUMENT → COMMIT

  Never skip PLAN. Never execute before SPEC is FINALIZED.
  Never mark COMPLETED before DOCUMENT is done.

---

## 4. Project-Specific Hard Rules

  ✅ ApiKeyMiddleware must stay active (never comment it out)
  ✅ SSE must use Subject merged with from() snapshot
  ✅ SchedulerRegistry.addInterval() — never bare setInterval
  ✅ markStaleProducts() runs after every aggregation cycle
  ✅ Provider schemas must stay structurally different (1=price, 2=cost, 3=listPrice)
  ✅ All list endpoints return { page, limit, total, totalPages, data[] }
  ✅ ParseIntPipe on all numeric path params
  ✅ No any type without eslint-disable comment
  ✅ No console.log — Logger.* only

---

## 5. Forbidden Actions (hard stops — require explicit user approval)

  ❌ npx prisma migrate dev / reset / push
  ❌ npm install / npm uninstall <package>
  ❌ docker compose down --volumes
  ❌ git reset, git push --force, git rebase
  ❌ Deleting migration files in prisma/migrations/
  ❌ Rewriting entire .ts files when a diff suffices
  ❌ Installing packages not in current package.json

---

## 6. Post-Task Sync (same turn, every task)

  1. .agents/tasks_status_matrix.md → [COMPLETED] + date
  2. .agents/system-map.md         → if files added/removed
  3. .agents/project-context.md    → if schema/stack changed
  4. .gsd/JOURNAL.md               → append entry

---

## 7. Communication Standards

  - Start responses with the action. Zero greetings or filler.
  - End every response with a compact summary table.
  - Diffs only for existing files. Never dump full file content.
  - Propose commands — never run destructive commands without approval.
  - Flag blockers immediately. Never silently skip a requirement.

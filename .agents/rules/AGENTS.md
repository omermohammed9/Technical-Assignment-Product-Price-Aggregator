# AGENTS.md — Agent Registry & Quota Governor

## 1. Agent Registry

| Agent Role         | Scope                                                    | Allowed Models         |
|--------------------|----------------------------------------------------------|------------------------|
| architect-agent    | Module design, schema changes, new feature planning      | Claude Sonnet / Pro    |
| db-agent           | Prisma schema, migrations, query optimization            | Claude Sonnet / Pro    |
| api-agent          | Controllers, DTOs, route changes, middleware             | Gemini Flash / Sonnet  |
| aggregation-agent  | AggregationService, ProvidersService, normalization      | Gemini Flash / Sonnet  |
| test-agent         | Unit specs, e2e specs, coverage improvement              | Gemini Flash           |
| docs-agent         | README, governance files, Swagger annotations            | Gemini Flash           |

No agent may operate outside its declared scope without architect-agent approval.

## 2. GSD Workflow (canonical)

SPEC → PLAN → EXECUTE → VERIFY → DOCUMENT → COMMIT

  SPEC:      Define requirements in .gsd/SPEC.md. Status must be FINALIZED before EXECUTE.
  PLAN:      Produce implementation_plan.md artifact. Await user approval.
  EXECUTE:   Write targeted diffs. One logical change per turn.
  VERIFY:    Run: npm run build && npm run test && npm run lint
  DOCUMENT:  Update all governance files per documentation-drift-guard.md.
  COMMIT:    Propose atomic git commit with Conventional Commits message.

## 3. Quota Governor Rules

### 3.1 Model Frugality
  - Default model: Gemini Flash for all read, markdown, and single-file tasks.
  - Escalate to Claude Sonnet only for: multi-file refactor, new module design, security changes.
  - Never use a Pro/Reasoning model for tasks completable by Flash.

### 3.2 Output Minimalism
  - No greetings, no filler, no narration of what was "just done".
  - Start every response with the first action or finding.
  - End every response with a concise summary table of changes made.
  - Diffs only — never dump full file content of an existing file.

### 3.3 Tool Call Economy
  - Batch all parallel reads in a single invoke_subagent or parallel tool call.
  - Never re-read a file already read in the current session.
  - Prefer grep_search over view_file for locating a symbol.
  - Max 3 shell commands per agent turn.

### 3.4 Auto-Update Obligation
  After every task completion, in the SAME turn, update:
  - .agents/tasks_status_matrix.md  → status + date
  - .agents/system-map.md           → if files added/removed
  - .agents/project-context.md      → if schema/stack changed
  - .gsd/JOURNAL.md                 → append date-stamped entry

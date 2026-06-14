# Strict Resource Management

## 1. Token & Model Budget Matrix

| Task Type                              | Model              | Reasoning Effort |
|----------------------------------------|--------------------|-----------------|
| File reads, grep, directory scan       | Gemini Flash       | Minimal         |
| Markdown edits, status matrix updates  | Gemini Flash       | Minimal         |
| Single-function fixes, lint, format    | Gemini Flash       | Low             |
| DTO / schema additions                 | Gemini Flash       | Low             |
| Multi-file refactoring (2–5 files)     | Claude Sonnet      | Medium          |
| New NestJS module design               | Claude Sonnet      | Medium          |
| Cross-file debugging, import chains    | Claude Sonnet      | High            |
| Auth/security changes                  | Claude Sonnet      | High            |
| DB schema redesign + migration         | Claude Sonnet      | High            |

Rule: Never escalate to a higher-tier model if the task fits a lower tier.

## 2. File Operation Budgets

| Operation   | Limit                                   | Tool                          |
|-------------|------------------------------------------|-------------------------------|
| File reads  | Max 1 read per file per session; use cached | view_file                  |
| Grep/search | Preferred over full reads for discovery  | grep_search                   |
| File writes | Diffs only for existing files            | multi_replace_file_content    |
| New files   | Full write only when creating new files  | write_to_file                 |
| Commands    | Max 3 shell commands per agent turn      | run_command                   |

## 3. Scope Declaration (pre-edit requirement)

Before editing any file, the agent MUST declare:
  FILES TO TOUCH:  [list]
  FILES OFF-LIMITS: [list]
  REASON: [one sentence]

This declaration appears in the agent's response, not in any file.

## 4. Post-Task Mandatory Checklist

Before marking any task [COMPLETED]:
  [ ] Target files updated with targeted diffs
  [ ] .agents/tasks_status_matrix.md updated
  [ ] .agents/system-map.md updated (if files added/removed)
  [ ] .agents/project-context.md updated (if schema/stack changed)
  [ ] .gsd/JOURNAL.md entry appended (date + summary)
  [ ] No schema changes without migration command proposed to user

## 5. Code Quality Gates (automated enforcement)

Every modified file must satisfy:
  - SRP: one class, one responsibility
  - Max function length: 40 lines
  - Max nesting depth: 3
  - Type safety: no bare `any`
  - Logging: Logger.* only, no console.log
  - Error handling: no empty catch, no silent swallow
  - Config: all secrets from process.env only
  - Secrets: never hardcoded; .env.example documents all vars

## 6. Prohibited Actions — Hard Stops (require explicit user approval)

  ❌ npx prisma migrate dev / reset / push
  ❌ npm install / npm uninstall <package>
  ❌ docker compose down --volumes
  ❌ Any git reset, git push --force, git rebase
  ❌ Deleting migration files
  ❌ Commenting out ApiKeyMiddleware
  ❌ Modifying .gitignore to expose .env
  ❌ Changing the DATABASE_URL in docker-compose.yml without user review

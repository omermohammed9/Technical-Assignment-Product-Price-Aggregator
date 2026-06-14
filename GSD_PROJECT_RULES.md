# GSD_PROJECT_RULES.md — Canonical GSD Rules

These rules are the highest-authority document for all agents on this project.
They supersede any default model behavior.

---

## 1. Core Protocol: SPEC → PLAN → EXECUTE → VERIFY → DOCUMENT → COMMIT

  SPEC:      Requirements defined in .gsd/SPEC.md. Must be Status: FINALIZED.
  PLAN:      Present implementation_plan.md artifact. Await explicit user approval.
  EXECUTE:   One logical change per turn. Targeted diffs only.
  VERIFY:    Run: npm run build && npm run test && npm run lint. Show output.
  DOCUMENT:  Update all governance files per documentation-drift-guard.md.
  COMMIT:    Propose atomic git commit. Use Conventional Commits format.

## 2. Proof Requirements

  | Task Category           | Required Empirical Proof                     |
  |-------------------------|----------------------------------------------|
  | Bug fix                 | npm run test output showing fix passes       |
  | New endpoint            | curl command + actual JSON response          |
  | Prisma schema change    | Proposed migration name + schema diff        |
  | SSE behavior            | curl -N /products/live-changes output        |
  | Auth behavior           | curl without key → 401; with key → 200       |
  | Build change            | npm run build: 0 errors                      |

## 3. Search-First Discipline

  Before reading any file with view_file, first search with grep_search.
  Only read the full file if grep_search is insufficient.
  Never speculatively read files unrelated to the current task.

## 4. Wave Execution

  Group tasks by dependency layer:
    Wave 1: Files with no dependencies (new standalone files)
    Wave 2: Files that depend on Wave 1 outputs
    Wave 3: Files that depend on Wave 2 outputs

  Complete each wave fully before starting the next.
  Never interleave edits across dependency boundaries.

## 5. Context Window Management

  | Usage  | State    | Action Required                                    |
  |--------|----------|----------------------------------------------------|
  | 0–30%  | Peak     | Normal operation                                   |
  | 30–50% | Good     | Avoid speculative reads                            |
  | 50–70% | Degrading| Stop reading new files; use grep only              |
  | 70%+   | Poor     | Commit current work; start fresh session           |

## 6. Token Efficiency Rules

  - Batch all independent file reads in a single parallel tool call.
  - Prefer multi_replace_file_content over write_to_file for existing files.
  - No preamble, no narration, no greetings in responses.
  - Suppress restatement of what was "just done."
  - Every response ends with a compact change summary table.

## 7. Git Discipline

  - Commits are atomic: one logical change per commit.
  - Never commit: .env, node_modules, dist, coverage.
  - Always commit: .env.example, governance files, migration files.
  - Format: type(scope): imperative description
  - Types: feat · fix · docs · refactor · test · chore · perf

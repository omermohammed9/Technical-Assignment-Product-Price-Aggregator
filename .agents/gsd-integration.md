# GSD Integration Bridge

## 1. Authority Order

  .agents/ is the canonical source of truth for:
    - Governance, architecture, code standards, security rules
    - Long-term system map, schemas, route contracts
    - Role definitions and model quota rules

  .gsd/ is the execution scaffolding for:
    - Active task specification (SPEC.md)
    - Current session state (STATE.md)
    - Historical task ledger (JOURNAL.md)

  In any conflict between .agents/ and .gsd/, .agents/ wins.

## 2. File Mapping

  | .gsd/ File        | .agents/ Equivalent            | Relationship                    |
  |-------------------|--------------------------------|---------------------------------|
  | .gsd/SPEC.md      | .agents/project-context.md     | SPEC is the task-level view;    |
  |                   |                                | project-context is the system   |
  |                   |                                | view. Both must stay aligned.   |
  | .gsd/STATE.md     | .agents/workflow.md            | STATE tracks current position;  |
  |                   |                                | workflow defines the protocol.  |
  | .gsd/JOURNAL.md   | .agents/tasks_status_matrix.md | JOURNAL is narrative history;   |
  |                   |                                | matrix is structured status.    |

## 3. Rule of No Direct Implementation

  An agent may NOT begin writing code unless:
    1. .gsd/SPEC.md has Status: FINALIZED
    2. An implementation_plan.md artifact has been presented to the user
    3. The user has explicitly approved the plan

  "I think this is right" is not approval.
  "Looks good, proceed" is approval.

## 4. Sync Protocol

  When .gsd/SPEC.md changes:
    → Review .agents/project-context.md for alignment

  When .agents/system-map.md changes:
    → Update .gsd/STATE.md Current Position if scope changes

  When a phase completes:
    → Update .agents/tasks_status_matrix.md
    → Append to .gsd/JOURNAL.md
    → Update .gsd/STATE.md Next Steps

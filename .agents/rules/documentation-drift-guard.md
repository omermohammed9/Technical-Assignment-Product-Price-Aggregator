# Documentation Drift Guard

## 1. Drift Checklist

After ANY code change, evaluate each item:

[ ] Did project behavior change?
    → Update .agents/project-context.md Phase Status
[ ] Did a config variable change or get added?
    → Update .agents/project-context.md + .env.example + README.md
[ ] Did an npm dependency change?
    → Update .agents/system-map.md Dependency Manifest
[ ] Did the directory structure change (file added/removed)?
    → Update .agents/system-map.md File Inventory
[ ] Did the Prisma schema change?
    → Update .agents/system-map.md Route Contracts & Schemas
    → Update .agents/project-context.md Database Schemas
    → Update README.md database schema section
[ ] Did an API route change (added/removed/renamed/param changed)?
    → Update .agents/system-map.md Route Contracts
    → Update README.md API Endpoints table
    → Update Swagger decorators on controller
[ ] Did a NestJS module get added or removed?
    → Update .agents/system-map.md Module Dependency Graph
    → Update SYSTEM_MAP.md (root-level mirror)

## 2. Obligation

No task may be marked [COMPLETED] in tasks_status_matrix.md
until all applicable drift checklist items above are resolved.

## 3. Auto-Update Trigger Table

| Code Change Type          | Files That MUST Be Updated                                        |
|---------------------------|-------------------------------------------------------------------|
| New Prisma model/field    | project-context.md, system-map.md, README.md                     |
| New NestJS module         | system-map.md (module graph + file inventory)                     |
| New API endpoint          | system-map.md (routes), README.md, Swagger decorators            |
| New env variable          | .env.example, project-context.md, README.md                      |
| New npm dependency        | system-map.md (dependency manifest)                               |
| New file created          | system-map.md (file inventory)                                    |
| File deleted              | system-map.md (file inventory)                                    |
| Phase task completed      | tasks_status_matrix.md, gsd/JOURNAL.md                           |

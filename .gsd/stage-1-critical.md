# GSD Task Stage 1: Critical Frontend Fixes

## Task Type
Type: bug-fix

## Task Title
Title: Resolve CSS transition, grid overflow, theme flash, and SSE state cascading issues

## Goal
Resolve the 5 most critical frontend rendering and performance issues (A1, B1, B2, C1, E1) that cause visual jank, clipped layout content, theme-load flicker, and excessive SSE re-render cascades.

## Current Behavior / Problem
- **A1**: Wildcard selector `* { transition: background-color 0.3s ease, border-color 0.3s ease }` forces transitions on every element, creating initial load flash-of-unstyled-content (FOUC).
- **B1 & B2**: `.dashboard-grid`, `.main-content`, and `.side-panel` use `overflow: hidden`, causing Chart.js tooltips, simulators, and dropdowns to clip at grid boundaries.
- **C1**: Theme initialization in `useEffect` causes a visible flash of default dark theme before local storage settings are applied.
- **E1**: SSE `onmessage` calls 4-6 separate state updates simultaneously (setting changes, toast, and re-fetching), leading to severe re-render jank.

## Expected Behavior
- No wildcard CSS transitions (transitions are selectively scoped to interactive elements).
- Layout grids and content wrappers allow tooltips and dropdown overflows without clipping.
- Dark/Light theme is resolved and applied before first paint, eliminating theme flash.
- SSE state changes and fetch requests are batched or debounced to minimize re-render count.

## Files to Inspect (read-only)
- [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx)
- [index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css)
- [index.html](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/index.html)

## Files Off-Limits (do not touch)
- All NestJS backend files under `src/` (except static routes if required)
- `prisma/` database schema and migrations

## Files to Modify / Create
- [index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css)
- [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx)
- [index.html](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/index.html)

## Risks
- Incorrect CSS specificity could break styling layout.
- If theme class/attribute injection fails, theme loading could break completely.
- Bad state batching could delay live updates in the feed.

## Documentation Impact
- [x] .agents/tasks_status_matrix.md
- [ ] .agents/system-map.md
- [ ] .agents/project-context.md
- [x] .gsd/JOURNAL.md
- [ ] README.md
- [ ] .env.example

## Test Plan
```bash
# Verify frontend compiles with zero errors
npm run build --prefix frontend
# Run tests to check backend-frontend integration
npm run test
```

## Model / Runtime Selection
Model: Gemini Flash

## Implementation Steps
1. **Remove Wildcard Transition (A1)**: Remove transition from `*` in [index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css). Scope transitions to `button`, `input`, `.card`, `.product-card`, `.badge`, etc.
2. **Fix Layout Clipping (B1 & B2)**: Change `overflow: hidden` to `overflow: visible` or remove the overflow rule on `.dashboard-grid`, `.main-content`, and `.side-panel`.
3. **Prevent Theme FOUC (C1)**: Add an inline `<script>` in [index.html](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/index.html) head that reads `localStorage.getItem('aggregator_theme')` and immediately sets `document.documentElement.setAttribute('data-theme', theme)` to run before first paint.
4. **Batch SSE Updates (E1)**: Refactor [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx) SSE `onmessage` handling to batch multiple state triggers, or use `React.startTransition` to prioritize UI updates.

## Completion Criteria
- [x] A1: Wildcard transition removed; selective transitions applied.
- [x] B1 & B2: Overflow clipping resolved on dashboard grids and panels.
- [x] C1: Theme set before React hydration to prevent theme flash.
- [x] E1: SSE state updates batched to avoid rendering cascades.
- [x] npm run build: 0 errors
- [x] npm run test: all passing
- [x] All governance files updated

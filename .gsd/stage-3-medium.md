# GSD Task Stage 3: Medium Priority Improvements

## Task Type
Type: refactor

## Task Title
Title: Resolve App.css dead code, scroll limits, loading shimmer, Vite base config, and simulator render states

## Goal
Resolve 10 medium-priority issues (A2, B3, B4, B7, C3, C4, F1, F4, G2, G3) related to cleaning up dead stylesheets, establishing panel height constraints, introducing catalog loading shimmers, resolving Vite base configuration/build overrides, and cleaning up state anti-patterns in the Simulator.

## Current Behavior / Problem
- **A2**: Dead scaffold code exists in `App.css` but is never imported.
- **B3**: ProductList cards have no maximum height, which pushes panels off the screen when limit=50.
- **B4**: LiveChangeFeed has conflicting nested scroll styles which clips element shadows.
- **B7**: MetricsOverview uses inline `marginBottom: 1.5rem` alongside parent `gap: 1.5rem`, creating double-spacing.
- **C3**: Loading states show raw text or dot literals (`'...'`), resulting in font shifts and layout jumps when data hydrates.
- **C4**: Chart.js canvas fully re-renders/flashes on product selection change.
- **F1**: Hardcoded `base: '/public/'` in development causes standalone Vite assets path resolution issues.
- **F4**: `emptyOutDir: true` in Vite build deletes hand-placed public resources (like icons and favicon) not in src build output.
- **G2**: ProductList filters button obtains both `btn-secondary` and `btn-primary` classes.
- **G3**: Simulator updates state inside render, triggering unnecessary parent-re-render cascades.

## Expected Behavior
- Dead CSS stylesheet `App.css` is removed.
- ProductList panel uses a proper max-height with scroll configuration.
- LiveChangeFeed container allows shadow overflow without scrollbar clipping.
- Spacing in dashboard layout is uniform (single 1.5rem gap).
- Professional shimmer loading skeletons represent products during data fetch.
- Chart.js canvas uses a key based on product ID to smooth out component re-renders.
- Vite base path checks environment (`command === 'serve' ? '/' : '/public/'`).
- Vite build leaves custom static files untouched or safely manages output folders.
- Clean style classes on filter toggle button.
- Simulator state updates are moved to `useEffect`.

## Files to Inspect (read-only)
- [App.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.css)
- [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx)
- [vite.config.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/vite.config.ts)
- [ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx)
- [LiveChangeFeed.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/LiveChangeFeed.tsx)
- [MetricsOverview.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/MetricsOverview.tsx)
- [ProductHistoryChart.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductHistoryChart.tsx)
- [Simulator.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/Simulator.tsx)

## Files Off-Limits (do not touch)
- All NestJS backend files under `src/` and prisma schemas.

## Files to Modify / Create
- [DELETE] [App.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.css)
- [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx)
- [vite.config.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/vite.config.ts)
- [ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx)
- [LiveChangeFeed.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/LiveChangeFeed.tsx)
- [MetricsOverview.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/MetricsOverview.tsx)
- [ProductHistoryChart.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductHistoryChart.tsx)
- [Simulator.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/Simulator.tsx)

## Risks
- Deleting `App.css` might break styles if it was silently imported elsewhere (need to verify it is dead).
- Custom build scripts may need adjustment if Vite asset folders change.

## Documentation Impact
- [x] .agents/tasks_status_matrix.md
- [x] .gsd/JOURNAL.md

## Test Plan
```bash
# Verify build
npm run build --prefix frontend
# Run tests
npm run test
```

## Model / Runtime Selection
Model: Gemini Flash

## Implementation Steps
1. **Remove App.css (A2)**: Delete [App.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.css) from the workspace.
2. **Apply Heights & Scroll (B3, B4, B7)**:
   - Configure height constraints and scrollbars in [ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx).
   - Resolve nested overflow conflict in [LiveChangeFeed.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/LiveChangeFeed.tsx).
   - Strip inline `marginBottom` in [MetricsOverview.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/MetricsOverview.tsx).
3. **Add Shimmer skeletons & Fix Chart Flash (C3, C4)**:
   - Create loading card skeletons for the catalog list and metrics.
   - Attach stable key identifiers to the `<Line>` component in [ProductHistoryChart.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductHistoryChart.tsx).
4. **Tune Vite configuration (F1, F4)**:
   - Use callback in [vite.config.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/vite.config.ts) to conditionally apply `/` vs `/public/` based on dev vs build.
   - Disable `emptyOutDir` or move static icons inside `frontend/public/` so they are compiled natively by Vite instead of nuked.
5. **Clean Button classes & Simulator State (G2, G3)**:
   - Fix conditional class application on the toggle button in [ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx).
   - Refactor state updates in [Simulator.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/Simulator.tsx) to run inside `useEffect`.

## Completion Criteria
- [x] A2: Orphaned `App.css` file deleted.
- [x] B3 & B4 & B7: Spacing and heights constraints adjusted; scrollbar shadow clipping fixed.
- [x] C3 & C4: Skeletons implemented; Chart.js canvas selection flashes resolved.
- [x] F1 & F4: Vite base path and emptyOutDir assets issue fixed.
- [x] G2 & G3: Duplicate button classes removed; Simulator render-phase state update fixed.
- [x] npm run build: 0 errors
- [x] npm run test: all passing
- [x] All governance files updated

# GSD Task Stage 4: Low Priority, Accessibility & Performance

## Task Type
Type: refactor

## Task Title
Title: Implement CSS Reset, Chart theme fixes, console cleanup, accessibility compliance, and code splitting

## Goal
Resolve remaining 10 low-priority, accessibility, and performance issues (A3, G4, G5, G6, G7, H1-H6, I1-I3) related to browser resets, dark/light chart theme colors, console logs, keyboard navigation, modal focus traps, container scrolling, lazy loading, and web font optimizations.

## Current Behavior / Problem
- **A3**: No proper CSS reset exists beyond basic wildcard overrides.
- **G4 & G5**: Chart.js grid and tooltips use hardcoded dark colors that don't match the light theme dashboard.
- **G6 & G7**: Multiple debug `console.log` and `console.error` logs clutter development and ship to production.
- **H1**: Header user badge overflows on tablet screens (769-1024px) when email address is long.
- **H2**: `.side-panel` has no scrollbar, clipping Simulator/DevConsole elements on shorter viewports.
- **H3 & H4**: Product catalog list items and live feed rows use `onClick` without keyboard key handler, tabIndex, or ARIA accessibility roles.
- **H5**: AuthModal does not trap keyboard focus, allowing users to tab behind the backdrop.
- **H6**: Toast notification containers lack ARIA live region declarations.
- **I1**: CONDITIONAL UI components (AuthModal, Simulator, DeveloperConsole) are loaded eagerly, increasing initial bundle size.
- **I2**: ChartJS registers globally on import, preventing tree-shaking.
- **I3**: Google Web Fonts load blocking-style, causing render delays.

## Expected Behavior
- Centralized CSS reset is applied.
- Chart.js gridlines, labels, and tooltips dynamically match the current theme palette.
- Debug console logs are removed or replaced with structured logger flags.
- Email address in header badge truncates gracefully (`text-overflow: ellipsis`) when size exceeds bounds.
- `.side-panel` scrolls vertically when content height exceeds window viewport.
- Interactive list elements include `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers.
- `AuthModal` traps focus, supports Escape key exit, and declares `aria-modal="true"`.
- Toast container utilizes `role="alert"` or `aria-live="polite"`.
- Code splitting via `React.lazy` on heavy dashboard cards.
- Non-blocking font loading optimizations in `index.html`.

## Files to Inspect (read-only)
- [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx)
- [index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css)
- [index.html](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/index.html)
- [ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx)
- [LiveChangeFeed.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/LiveChangeFeed.tsx)
- [AuthModal.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/AuthModal.tsx)
- [ProductHistoryChart.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductHistoryChart.tsx)

## Files Off-Limits (do not touch)
- Backend code.

## Files to Modify / Create
- [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx)
- [index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css)
- [index.html](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/index.html)
- [ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx)
- [LiveChangeFeed.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/LiveChangeFeed.tsx)
- [AuthModal.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/AuthModal.tsx)
- [ProductHistoryChart.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductHistoryChart.tsx)

## Risks
- Focus traps can lock the tab key if implemented with bugs.
- Lazy components might trigger flickering during load (wrap in `<Suspense>`).

## Documentation Impact
- [x] .agents/tasks_status_matrix.md
- [x] .gsd/JOURNAL.md

## Test Plan
```bash
# Verify build compiles cleanly
npm run build --prefix frontend
# Run tests
npm run test
```

## Model / Runtime Selection
Model: Gemini Flash

## Implementation Steps
1. **Apply Resets & Spacing adjustments (A3, H1, H2)**:
   - Add simple HTML5 reset blocks at the beginning of [index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css).
   - Constrain email width and add ellipsis class.
   - Change `.side-panel` layout rules to support `overflow-y: auto`.
2. **Chart Theme Dynamic Sync (G4, G5)**:
   - Configure grid, tick, and tooltip colors dynamically using React state based on active theme variable.
3. **Clean Logs (G6, G7)**:
   - Strip out debug console logs or replace with conditional debug statements.
4. **Implement Accessibility Requirements (H3-H6)**:
   - Add keyboard event handlers, tabIndex, and role properties to product lists and change feeds.
   - Build focus-trap container logic in [AuthModal.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/AuthModal.tsx).
   - Inject `role="alert"` or `aria-live` tags to toasts.
5. **Optimize Performance (I1-I3)**:
   - Refactor `App.tsx` imports to use `React.lazy` and `<Suspense>` wrapper for `AuthModal`, `Simulator`, and `DeveloperConsole`.
   - Adapt `index.html` link tags to load Google fonts asynchronously.

## Completion Criteria
- [x] A3: Basic CSS reset added.
- [x] G4 & G5: Chart grids and tooltips fully dynamic based on active light/dark theme.
- [x] G6 & G7: Diagnostic console logs cleaned up.
- [x] H1 & H2: Email truncation and side panel scrollbar layout fixes applied.
- [x] H3 - H6: ARIA roles, focus traps, keyboard navigation, and alert regions implemented.
- [x] I1 - I3: Lazy loading, dynamic ChartJS imports, and font load optimizations complete.
- [x] npm run build: 0 errors
- [x] npm run test: all passing
- [x] All governance files updated

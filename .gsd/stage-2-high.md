# GSD Task Stage 2: High Priority Layout, State & Config Fixes

## Task Type
Type: bug-fix

## Task Title
Title: Resolve Z-Index, Layout Shifts, SSE Loops, Proxy config, and baseUrl fragility

## Goal
Resolve 8 high-priority issues (B5, B6, C2, D1, E2, F2, F3, G1) affecting z-index stacking order, selected card layout shifts, development SSE double-mounts, Vite proxy routes, baseUrl fragility, and AuthModal styling.

## Current Behavior / Problem
- **B5 & D1**: Toasts and AuthModal both use `z-index: 1000`, causing toasts to overlay or interleave under the modal. No global z-index system exists.
- **B6**: ProductList selected card border width is 2px, while unselected is 1px, causing layout shift/content jump on selection due to changing content area dimensions.
- **C2**: React `<StrictMode>` in development triggers double SSE mount/unmount which flashes connection status.
- **E2**: `fetchProducts` dependency list triggers re-fetching when `selectedProductId` updates.
- **F2**: Proxy rules in `vite.config.ts` lack `/auth` route mapping, meaning registration/login requests depend on hardcoded API URLs.
- **F3**: `baseUrl` port detection in [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx) is hardcoded to `http://localhost:5173`.
- **G1**: `AuthModal` uses undefined `var(--surface)` CSS variable on the role dropdown select.

## Expected Behavior
- Centralized CSS z-index system (e.g. Header=100, Toasts=1050, Modal=1100).
- Selected product card uses `box-shadow` or standard border with custom outline to avoid resizing content area.
- SSE connection cleanup safely cancels active `EventSource` and timers to prevent state flashes.
- `fetchProducts` dependency list is isolated from auto-selection state to avoid fetch loops.
- Vite dev proxy supports `/auth/*` endpoints and frontend uses relative URLs, eliminating hardcoded hostnames.
- `AuthModal` select dropdown uses `--bg-input` or `--bg-surface-opaque`.

## Files to Inspect (read-only)
- [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx)
- [index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css)
- [vite.config.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/vite.config.ts)
- [AuthModal.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/AuthModal.tsx)
- [ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx)

## Files Off-Limits (do not touch)
- Backend controllers, services, database schemas.

## Files to Modify / Create
- [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx)
- [index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css)
- [vite.config.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/vite.config.ts)
- [AuthModal.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/AuthModal.tsx)
- [ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx)

## Risks
- Misconfiguring Vite proxy could break login/registration functionality in local dev.
- Disabling absolute baseUrl may cause API URL resolving issues if relative path rules are misapplied.

## Documentation Impact
- [x] .agents/tasks_status_matrix.md
- [x] .gsd/JOURNAL.md

## Test Plan
```bash
# Verify frontend compiles with zero errors
npm run build --prefix frontend
# Run tests
npm run test
```

## Model / Runtime Selection
Model: Gemini Flash

## Implementation Steps
1. **Establish Z-Index Layers (B5 & D1)**: Add CSS variables for z-index (`--z-header: 100; --z-toasts: 1050; --z-modal: 1100;`) in [index.css](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/index.css) and update header, toast-container, and AuthModal styles to use them.
2. **Fix Selected Border Layout Shift (B6)**: In [ProductList.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/ProductList.tsx), use `box-shadow` inset or keep border at 1px (or apply a `2px` border with `transparent` color to unselected cards) to prevent layout shift.
3. **Resolve SSE StrictMode Double-Mount (C2)**: Ensure EventSource connection and timeouts are fully closed and cancelled in the SSE cleanup function.
4. **Decouple Fetch Loops (E2)**: Separate auto-selection logic from initial fetch lifecycle or use a ref for selected products to prevent triggering re-fetches.
5. **Vite Proxy & baseUrl Cleanup (F2 & F3)**:
   - Add `/auth` configuration mapping to Vite dev proxy in [vite.config.ts](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/vite.config.ts).
   - Standardize all API fetches in [App.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/App.tsx) and components to use relative endpoints.
6. **Fix Dropdown styling (G1)**: Replace `var(--surface)` with `var(--bg-input)` in [AuthModal.tsx](file:///c:/Users/omarz/Desktop/product-price-aggregator/frontend/src/components/AuthModal.tsx).

## Completion Criteria
- [x] B5 & D1: Global z-index system defined and modal/toast overlap fixed.
- [x] B6: Selected product card border shift eliminated.
- [x] C2: SSE cleanup handles StrictMode double-mount gracefully.
- [x] E2: fetchProducts dependency loop resolved.
- [x] F2 & F3: Proxy added for auth routes; absolute baseUrl removed in favor of relative paths.
- [x] G1: AuthModal dropdown uses correct defined CSS background variable.
- [x] npm run build: 0 errors
- [x] npm run test: all passing
- [x] All governance files updated

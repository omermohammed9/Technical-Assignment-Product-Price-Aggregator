# Product Price Aggregator Dashboard

A professional, interactive, glassmorphic Single-Page Application (SPA) built using **React, TypeScript, and Vite** that visualizes aggregated pricing metrics, lists product catalogs, plots price historical data, streams real-time updates via Server-Sent Events (SSE), and simulates price changes.

## Tech Stack
- **Framework:** React 19 (TypeScript, strict mode)
- **Build Tool:** Vite (with Dev HMR and proxy routing support)
- **Charts:** Chart.js + `react-chartjs-2` (custom themes)
- **Icons:** SVG-based vector layouts
- **Styling:** Custom Vanilla CSS (Dark & Light theme toggles, fluid grids, scroll optimization, modal slide-in animations)

## Features & Modules

### 📊 1. Metrics Overview
- Visualizes real-time summary statistics cards:
  - **Total Products** in database
  - **Average Price** of all catalog items
  - **Stale Products** (not fetched in last 2 hours)
  - **Active Providers** count

### 🔍 2. Product Catalog
- Powerful search input matching product titles.
- Multi-dimensional filters (by provider source, availability status, and min/max price sliders).
- Collapsible responsive filter drawer optimized for mobile viewports.
- Interactive detailed drawer inspecting individual product's properties.

### 📈 3. Price History Chart
- Custom curved line charts rendered via Chart.js with responsive gradients.
- Automatically adjusts colors, grid lines, tooltips, and labels based on Light/Dark active themes.
- Clean memoized component keys to prevent unnecessary rendering flashes.

### ⚡ 4. Live Change Feed
- Connects directly to the backend's `/products/live-changes` Server-Sent Events (SSE) stream.
- Feeds real-time alerts into a list with slide-in notifications and toast banners.
- Includes reconnection timeouts, React 19 callback safety hooks, and useCallback memoizations to prevent memory leaks and infinite rendering cascades.

### ⚙️ 5. Simulator Panel
- Direct admin controls allowing users to inject mock price changes on any product.
- State-synced selectors enforcing standard number limits and error handling.
- Requires ADMIN user role.

### 🔐 6. Authentication UI & JWT Developer Console
- Fully interactive `AuthModal` providing Sign Up and Login screens.
- Persists user sessions securely and automatically injects JWT Bearer tokens into API headers.
- **Developer Console:** Built-in JWT inspector tool parsing decoded claims (Subject ID, Role, Expiry duration) directly in-browser.
- **Provider Status:** Visual Normalization Mapper layout mapping raw API inputs (Binance, CoinGecko, iTunes, CheapShark) to unified catalog rows.

## Local Development Setup

To run or build the frontend independently:
```bash
# 1. Install dependencies
npm install

# 2. Run local dev server (proxies HTTP requests to port 3000)
npm run dev

# 3. Compile and build production assets directly to NestJS static public/ folder
npm run build
```

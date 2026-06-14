import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Moon, Sun, Bell } from 'lucide-react';
import { ConfigPanel } from './components/ConfigPanel';
import { MetricsOverview } from './components/MetricsOverview';
import { ProductList } from './components/ProductList';
import { ProductHistoryChart } from './components/ProductHistoryChart';
import { LiveChangeFeed } from './components/LiveChangeFeed';
import { Simulator } from './components/Simulator';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  availability: boolean;
  provider: string;
  isStale: boolean;
  lastUpdated: string;
  lastFetched: string;
}

interface ChangeEvent {
  id: number;
  name: string;
  oldPrice: number;
  newPrice: number;
  timestamp: string;
}

interface Toast {
  id: string;
  name: string;
  oldPrice: number;
  newPrice: number;
}

export default function App() {
  // Config & Auth
  const [config, setConfig] = useState({ apiKey: 'supersecureapikey123', baseUrl: '' });

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('aggregator_theme') as 'dark' | 'light') || 'dark';
  });

  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Live SSE stream state
  const [changes, setChanges] = useState<ChangeEvent[]>([]);
  const [connected, setConnected] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Filter settings
  const [filters, setFilters] = useState<{
    name?: string;
    provider?: string;
    availability?: boolean;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 5
  });

  // Ref to always have the latest selected product ID in the SSE closure
  const selectedProductIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedProductIdRef.current = selectedProductId;
  }, [selectedProductId]);

  // Handle theme application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aggregator_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const buildUrl = (path: string) => {
    const base = config.baseUrl.replace(/\/$/, '');
    return `${base}${path}`;
  };

  // Toast adder
  const addToast = (event: ChangeEvent) => {
    const id = `${event.id}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, name: event.name, oldPrice: event.oldPrice, newPrice: event.newPrice }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Fetch product list
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.name) queryParams.append('name', filters.name);
      if (filters.provider) queryParams.append('provider', filters.provider);
      if (filters.availability !== undefined) queryParams.append('availability', String(filters.availability));
      if (filters.minPrice !== undefined) queryParams.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice !== undefined) queryParams.append('maxPrice', String(filters.maxPrice));
      queryParams.append('page', String(filters.page));
      queryParams.append('limit', String(filters.limit));

      const url = buildUrl(`/products?${queryParams.toString()}`);
      const res = await fetch(url, {
        headers: {
          'x-api-key': config.apiKey
        }
      });

      if (!res.ok) throw new Error('Failed to fetch products');
      const result = await res.json();
      setProducts(result.data);
      setTotal(result.total);
      setPage(result.page);
      setTotalPages(result.totalPages);
      
      // Auto-select first product if none is selected
      if (result.data.length > 0 && selectedProductId === null) {
        setSelectedProductId(result.data[0].id);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single product details with history
  const fetchProductDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const url = buildUrl(`/products/${id}`);
      const res = await fetch(url, {
        headers: {
          'x-api-key': config.apiKey
        }
      });
      if (!res.ok) throw new Error('Failed to fetch product details');
      const result = await res.json();
      setSelectedProductDetails(result);
    } catch (err) {
      console.error('Fetch details error:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Triggered when filters change
  useEffect(() => {
    if (config.apiKey) {
      fetchProducts();
    }
  }, [filters, config]);

  // Triggered when product selection changes
  useEffect(() => {
    if (selectedProductId !== null && config.apiKey) {
      fetchProductDetails(selectedProductId);
    }
  }, [selectedProductId, config]);

  // SSE Stream handler
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      const url = buildUrl('/products/live-changes');
      console.log('🔗 Connecting to SSE stream at:', url);
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setConnected(true);
        console.log('✅ Connected to SSE stream.');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            // Initial snapshot
            setChanges(data);
          } else {
            // Live single update
            setChanges((prev) => {
              const updated = [data, ...prev];
              return updated.slice(0, 20); // cap at 20 items
            });
            
            // Add visual notification
            addToast(data);

            // Refresh catalog and detailed view
            fetchProducts();
            if (selectedProductIdRef.current === data.id) {
              fetchProductDetails(data.id);
            }
          }
        } catch (err) {
          console.error('Error parsing SSE event payload:', err);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        console.log('❌ Connection lost. Re-establishing in 5s...');
        eventSource?.close();
        reconnectTimer = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [config]);

  // Simulator triggering handler
  const handleSimulate = async (productId: number, price: number) => {
    try {
      const url = buildUrl(`/products/simulate-change/${productId}/${price}`);
      const res = await fetch(url, {
        headers: {
          'x-api-key': config.apiKey
        }
      });
      if (!res.ok) return false;
      
      // SSE will handle refreshing components, but trigger quick updates in case
      fetchProducts();
      if (selectedProductId === productId) {
        fetchProductDetails(productId);
      }
      return true;
    } catch (err) {
      console.error('Simulator error:', err);
      return false;
    }
  };

  // Stats calculation
  const totalProductsCount = total;
  const avgPrice = products.length > 0 
    ? products.reduce((acc, curr) => acc + curr.price, 0) / products.length 
    : 0;
  const staleCount = products.filter(p => p.isStale).length;
  const uniqueProviders = Array.from(new Set(products.map(p => p.provider))).length;

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header className="header">
        <div className="logo-section">
          <LayoutDashboard size={28} className="logo-text" style={{ strokeWidth: 2.5 }} />
          <h1 className="logo-text">Aggregator Pricing Studio</h1>
        </div>

        <div className="header-actions">
          {/* SSE Stream status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '50px', border: '1px solid var(--border-color)' }}>
            <div className={`pulse-dot ${connected ? '' : 'disconnected'}`} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {connected ? 'SSE Connected' : 'SSE Reconnecting'}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button id="btn-toggle-theme" onClick={toggleTheme} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="dashboard-grid">
        {/* Left Side: Analytics & Catalog */}
        <div className="main-content">
          <MetricsOverview
            totalProducts={totalProductsCount}
            averagePrice={avgPrice}
            staleCount={staleCount}
            providerCount={uniqueProviders || 3}
            loading={loading}
          />

          {/* Product and Chart Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', flex: 1 }}>
            <ProductList
              products={products}
              total={total}
              page={page}
              totalPages={totalPages}
              limit={filters.limit}
              loading={loading}
              selectedProductId={selectedProductId}
              onSelectProduct={setSelectedProductId}
              onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
              onRefresh={fetchProducts}
            />

            <ProductHistoryChart
              product={selectedProductDetails}
              loading={detailsLoading}
            />
          </div>
        </div>

        {/* Right Side: Settings & Controls */}
        <div className="side-panel">
          <ConfigPanel
            onConfigChange={(newConfig) => {
              setConfig(newConfig);
              setFilters(prev => ({ ...prev, page: 1 })); // Reset pagination on config update
            }}
          />

          <Simulator
            products={products.map(p => ({ id: p.id, name: p.name, price: p.price }))}
            selectedProduct={products.find(p => p.id === selectedProductId) || null}
            onSimulate={handleSimulate}
          />

          <LiveChangeFeed
            changes={changes}
            connected={connected}
            onSelectProduct={setSelectedProductId}
          />
        </div>
      </main>

      {/* Notification Toast Stream */}
      <div className="toast-container">
        {toasts.map((t) => {
          const up = t.newPrice >= t.oldPrice;
          return (
            <div key={t.id} className="toast" style={{ borderLeftColor: up ? 'var(--success)' : 'var(--danger)' }}>
              <Bell size={18} color="var(--primary)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Price Alert</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <strong>{t.name}</strong> shifted to ${t.newPrice.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

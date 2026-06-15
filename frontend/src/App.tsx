import { useState, useEffect, useRef, useCallback, startTransition, lazy, Suspense } from 'react';
import { LayoutDashboard, Moon, Sun, Bell, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { MetricsOverview } from './components/MetricsOverview';
import { ProductList } from './components/ProductList';
import { ProductHistoryChart } from './components/ProductHistoryChart';
import { LiveChangeFeed } from './components/LiveChangeFeed';
import { ProviderStatus } from './components/ProviderStatus';

const Simulator = lazy(() => import('./components/Simulator').then(module => ({ default: module.Simulator })));
const AuthModal = lazy(() => import('./components/AuthModal').then(module => ({ default: module.AuthModal })));
const DeveloperConsole = lazy(() => import('./components/DeveloperConsole').then(module => ({ default: module.DeveloperConsole })));

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

const baseUrl = '';

const buildUrl = (path: string) => {
  return path;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debugLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('aggregator_api_key') || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // JWT parsing
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    if (apiKey && apiKey.startsWith('eyJ')) {
      try {
        const payload = JSON.parse(atob(apiKey.split('.')[1]));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(payload);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [apiKey]);

  const handleLogout = () => {
    setApiKey('');
    localStorage.removeItem('aggregator_api_key');
    setUser(null);
  };

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Toast adder
  const addToast = useCallback((event: ChangeEvent) => {
    const id = `${event.id}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, name: event.name, oldPrice: event.oldPrice, newPrice: event.newPrice }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Fetch product list
  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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
          'x-api-key': apiKey || 'supersecureapikey123'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch products');
      const result = await res.json();
      setProducts(result.data);
      setTotal(result.total);
      setPage(result.page);
      setTotalPages(result.totalPages);
      
      // Auto-select first product if none is selected
      if (result.data.length > 0 && selectedProductIdRef.current === null) {
        setSelectedProductId(result.data[0].id);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiKey, filters]);

  // Fetch single product details with history
  const fetchProductDetails = useCallback(async (id: number, silent = false) => {
    if (!silent) setDetailsLoading(true);
    try {
      const url = buildUrl(`/products/${id}`);
      const res = await fetch(url, {
        headers: {
          'x-api-key': apiKey || 'supersecureapikey123'
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
  }, [apiKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [filters, apiKey, fetchProducts]);

  useEffect(() => {
    if (selectedProductId !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProductDetails(selectedProductId);
    }
  }, [selectedProductId, apiKey, fetchProductDetails]);

  const fetchProductsRef = useRef(fetchProducts);
  const fetchProductDetailsRef = useRef(fetchProductDetails);
  const addToastRef = useRef(addToast);

  useEffect(() => {
    fetchProductsRef.current = fetchProducts;
    fetchProductDetailsRef.current = fetchProductDetails;
    addToastRef.current = addToast;
  });

  // SSE Stream handler
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      const url = buildUrl('/products/live-changes');
      debugLog('🔗 [DEBUG] Connecting to SSE stream at:', url, 'with apiKey:', apiKey);
      eventSource = new EventSource(url);
 
      eventSource.onopen = () => {
        setConnected(true);
        debugLog('✅ [DEBUG] Connected to SSE stream.');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            debugLog('📦 [DEBUG] SSE received initial snapshot array of length:', data.length);
            setChanges(data);
          } else {
            debugLog('🔔 [DEBUG] SSE received live update event:', data);
            startTransition(() => {
              setChanges((prev) => {
                const updated = [data, ...prev];
                return updated.slice(0, 20); // cap at 20 items
              });
              
              // Add visual notification
              addToastRef.current(data);
            });
            
            // Refresh catalog and detailed view silently
            fetchProductsRef.current(true);
            if (selectedProductIdRef.current === data.id) {
              fetchProductDetailsRef.current(data.id, true);
            }
          }
        } catch (err) {
          console.error('Error parsing SSE event payload:', err);
        }
      };

      eventSource.onerror = (err) => {
        setConnected(false);
        debugLog('❌ [DEBUG] Connection lost or error occurred:', err);
        eventSource?.close();
        reconnectTimer = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      debugLog('🧹 [DEBUG] SSE cleanup called! Closing EventSource...');
      if (eventSource) {
        eventSource.onopen = null;
        eventSource.onmessage = null;
        eventSource.onerror = null;
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [apiKey]);

  // Simulator triggering handler
  const handleSimulate = async (productId: number, price: number) => {
    try {
      const url = buildUrl(`/products/simulate-change/${productId}/${price}`);
      const headers: Record<string, string> = {
        'x-api-key': apiKey || 'supersecureapikey123'
      };
      
      if (apiKey.startsWith('eyJ')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await fetch(url, { headers });
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
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid var(--border-color)' }}>
              {user.role === 'ADMIN' ? <Shield size={16} color="var(--primary)" /> : <UserIcon size={16} color="var(--text-secondary)" />}
              <div className="user-badge-text" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{user.role}</span>
              </div>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.2rem', marginLeft: '0.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setIsAuthModalOpen(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Log In / Register
            </button>
          )}

          {/* SSE Stream status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '50px', border: '1px solid var(--border-color)' }}>
            <div className={`pulse-dot ${connected ? '' : 'disconnected'}`} />
            <span className="user-badge-text" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {connected ? 'Connected' : 'Offline'}
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
          <div className="catalog-grid">
            <ProductList
              products={products}
              total={total}
              page={page}
              totalPages={totalPages}
              limit={filters.limit}
              loading={loading}
              selectedProductId={selectedProductId}
              onSelectProduct={setSelectedProductId}
              onFilterChange={handleFilterChange}
              onRefresh={fetchProducts}
            />

            <ProductHistoryChart
              product={selectedProductDetails}
              loading={detailsLoading}
              theme={theme}
            />
          </div>
        </div>

        {/* Right Side: Settings & Controls */}
        <div className="side-panel">
          {user && user.role === 'ADMIN' && (
            <Suspense fallback={null}>
              <Simulator
                key={selectedProductId ?? 'none'}
                products={products.map(p => ({ id: p.id, name: p.name, price: p.price }))}
                selectedProduct={products.find(p => p.id === selectedProductId) || null}
                onSimulate={handleSimulate}
              />
            </Suspense>
          )}

          <Suspense fallback={null}>
            <DeveloperConsole apiKey={apiKey} user={user} />
          </Suspense>

          <LiveChangeFeed
            changes={changes}
            connected={connected}
            onSelectProduct={setSelectedProductId}
          />

          <ProviderStatus />
        </div>
      </main>

      {/* Notification Toast Stream */}
      <div className="toast-container" role="log" aria-live="polite">
        {toasts.map((t) => {
          const up = t.newPrice >= t.oldPrice;
          return (
            <div key={t.id} className="toast" role="status" style={{ borderLeftColor: up ? 'var(--success)' : 'var(--danger)' }}>
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

      <Suspense fallback={null}>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          baseUrl={baseUrl}
          onSuccess={(token) => {
            setApiKey(token);
            localStorage.setItem('aggregator_api_key', token);
          }}
        />
      </Suspense>
    </div>
  );
}

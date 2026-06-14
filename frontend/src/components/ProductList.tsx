import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, Store, Calendar } from 'lucide-react';

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

interface ProductListProps {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  loading: boolean;
  selectedProductId: number | null;
  onSelectProduct: (productId: number) => void;
  onFilterChange: (filters: {
    name?: string;
    provider?: string;
    availability?: boolean;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
  }) => void;
  onRefresh: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  total,
  page,
  totalPages,
  limit,
  loading,
  selectedProductId,
  onSelectProduct,
  onFilterChange,
  onRefresh
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [provider, setProvider] = useState('');
  const [availability, setAvailability] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [localLimit, setLocalLimit] = useState(limit);

  // Debounce search term to prevent rapid queries
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerFilterChange({ page: 1 });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const triggerFilterChange = (overrides: { page?: number; limit?: number } = {}) => {
    let avail: boolean | undefined = undefined;
    if (availability === 'true') avail = true;
    if (availability === 'false') avail = false;

    onFilterChange({
      name: searchTerm || undefined,
      provider: provider || undefined,
      availability: avail,
      minPrice: minPrice !== '' ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
      page: overrides.page !== undefined ? overrides.page : page,
      limit: overrides.limit !== undefined ? overrides.limit : localLimit
    });
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerFilterChange({ page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setProvider('');
    setAvailability('all');
    setMinPrice('');
    setMaxPrice('');
    onFilterChange({ page: 1, limit: localLimit });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      triggerFilterChange({ page: newPage });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLocalLimit(newLimit);
    triggerFilterChange({ page: 1, limit: newLimit });
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛒 Product Catalog 
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              ({total} items total)
            </span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button id="btn-refresh-catalog" onClick={onRefresh} className="btn-secondary" style={{ padding: '0.5rem', height: '36px' }} title="Refresh Catalog">
            <RefreshCw size={16} className={loading ? 'pulse' : ''} style={{ animation: loading ? 'pulse 1.5s infinite linear' : 'none' }} />
          </button>
          <button id="btn-clear-filters" onClick={clearFilters} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', height: '36px', fontSize: '0.8rem' }}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleFilterSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <input
            id="filter-search"
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          />
        </div>
        <div>
          <select
            id="filter-provider"
            value={provider}
            onChange={(e) => { setProvider(e.target.value); setTimeout(() => triggerFilterChange({ page: 1 }), 0); }}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="">All Providers</option>
            <option value="provider1">Provider 1 (Price)</option>
            <option value="provider2">Provider 2 (Cost)</option>
            <option value="provider3">Provider 3 (ListPrice)</option>
          </select>
        </div>
        <div>
          <select
            id="filter-availability"
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setTimeout(() => triggerFilterChange({ page: 1 }), 0); }}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="all">Availability: All</option>
            <option value="true">In Stock</option>
            <option value="false">Out of Stock</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <input
            id="filter-min-price"
            type="number"
            placeholder="Min $"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{ padding: '0.5rem 0.5rem', fontSize: '0.85rem' }}
          />
          <input
            id="filter-max-price"
            type="number"
            placeholder="Max $"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{ padding: '0.5rem 0.5rem', fontSize: '0.85rem' }}
          />
          <button type="submit" className="btn-secondary" style={{ display: 'none' }}>Go</button>
        </div>
      </form>

      {/* Product List Grid */}
      <div style={{ flex: 1, minHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading && products.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1.5s infinite linear', marginRight: '0.5rem' }} /> Loading catalog...
          </div>
        ) : products.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No products match the selected filters.
          </div>
        ) : (
          products.map((p) => {
            const isSelected = selectedProductId === p.id;
            return (
              <div
                key={p.id}
                id={`product-card-${p.id}`}
                onClick={() => onSelectProduct(p.id)}
                style={{
                  padding: '1rem',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--primary-glow)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                }}
                className="product-card"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '75%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</h4>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', textTransform: 'capitalize', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      <Store size={10} /> {p.provider}
                    </span>
                    {p.isStale && (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                        Stale
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={10} /> Updated {new Date(p.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {formatPrice(p.price)}
                  </span>
                  <span className={`badge ${p.availability ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                    {p.availability ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Show:</span>
            <select
              id="pagination-limit"
              value={localLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              style={{ padding: '0.25rem', width: '60px', fontSize: '0.8rem' }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>per page</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              id="btn-page-prev"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="btn-secondary"
              style={{ padding: '0.3rem', width: '30px', height: '30px', borderRadius: '4px', opacity: page === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Page <strong>{page}</strong> of {totalPages}
            </span>
            <button
              id="btn-page-next"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="btn-secondary"
              style={{ padding: '0.3rem', width: '30px', height: '30px', borderRadius: '4px', opacity: page === totalPages ? 0.4 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

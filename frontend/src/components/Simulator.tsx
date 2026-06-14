import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface SimulatorProps {
  products: Product[];
  selectedProduct: Product | null;
  onSimulate: (productId: number, price: number) => Promise<boolean>;
}

export const Simulator: React.FC<SimulatorProps> = ({
  products,
  selectedProduct,
  onSimulate
}) => {
  const [targetProductId, setTargetProductId] = useState<number | ''>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sync with selected product from catalog
  useEffect(() => {
    if (selectedProduct) {
      setTargetProductId(selectedProduct.id);
      // Auto-suggest a price fluctuation (e.g. +/- 10%)
      const fluctuation = (Math.random() > 0.5 ? 1.1 : 0.9);
      const suggestedPrice = Math.round(selectedProduct.price * fluctuation);
      setNewPrice(suggestedPrice.toString());
    }
  }, [selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductId || !newPrice) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const priceVal = Number(newPrice);
      if (isNaN(priceVal) || priceVal <= 0) {
        setError('Price must be a positive number');
        setLoading(false);
        return;
      }

      const res = await onSimulate(Number(targetProductId), priceVal);
      if (res) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Simulation failed. Check API Key or server status.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to simulate price change');
    } finally {
      setLoading(false);
    }
  };

  const activeProduct = products.find(p => p.id === Number(targetProductId));

  return (
    <div className="card" id="simulator-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Sparkles size={20} className="logo-text" />
        <h3 style={{ fontSize: '1.15rem' }}>Price Change Simulator</h3>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Select Product
          </label>
          <select
            id="sim-product-select"
            value={targetProductId}
            onChange={(e) => {
              const id = e.target.value;
              setTargetProductId(id ? Number(id) : '');
              const prod = products.find(p => p.id === Number(id));
              if (prod) {
                setNewPrice(Math.round(prod.price * 1.1).toString());
              }
            }}
            required
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">-- Choose a Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Current: ${p.price.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            New Target Price (USD)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              id="sim-price-input"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="e.g. 49"
              required
              min="1"
              step="any"
              style={{ fontSize: '0.85rem' }}
            />
            {activeProduct && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                onClick={() => {
                  // Fluctuate price randomly
                  const current = activeProduct.price;
                  const randomPrice = Math.round(current * (0.85 + Math.random() * 0.3));
                  setNewPrice(randomPrice.toString());
                }}
              >
                Randomize
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--danger)', backgroundColor: 'var(--danger-glow)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--success)', backgroundColor: 'var(--success-glow)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <Check size={14} />
            <span>Price updated! Check the live feed.</span>
          </div>
        )}

        <button
          id="btn-trigger-simulation"
          type="submit"
          disabled={loading || !targetProductId}
          className="btn-primary"
          style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', height: '38px', opacity: !targetProductId ? 0.5 : 1 }}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="spin" style={{ animation: 'spin 1.5s infinite linear' }} /> Simulating...
            </>
          ) : (
            <>
              <Play size={16} /> Run Simulator
            </>
          )}
        </button>
      </form>
    </div>
  );
};

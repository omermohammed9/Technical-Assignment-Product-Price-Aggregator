import React from 'react';
import { Database, Link2, CheckCircle, Info } from 'lucide-react';

export const ProviderStatus: React.FC = () => {
  const providers = [
    {
      name: 'Apple App Store',
      api: 'iTunes API',
      format: '{ price, availability }',
      mapping: 'Canonical standard mapping',
      status: 'Active'
    },
    {
      name: 'CoinGecko',
      api: 'Crypto Markets',
      format: '{ cost, inStock, vendor }',
      mapping: 'cost ➔ price, inStock ➔ availability',
      status: 'Active'
    },
    {
      name: 'Binance',
      api: 'Crypto Tickers',
      format: '{ listPrice, isAvailable, source }',
      mapping: 'listPrice ➔ price, isAvailable ➔ availability',
      status: 'Active'
    },
    {
      name: 'CheapShark',
      api: 'PC Game Deals',
      format: '{ salePrice, isAvailable, source }',
      mapping: 'salePrice ➔ price, isAvailable ➔ availability',
      status: 'Active'
    }
  ];

  return (
    <div className="card" id="provider-status-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <Database size={18} className="logo-text" />
        <h3 style={{ fontSize: '1.1rem' }}>Provider Normalization Map</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {providers.map((p) => (
          <div 
            key={p.name} 
            style={{ 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'rgba(255, 255, 255, 0.01)', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Link2 size={12} color="var(--primary)" /> {p.name}
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                <CheckCircle size={8} /> {p.status}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <div><strong style={{ color: 'var(--text-muted)' }}>Source API:</strong> {p.api}</div>
              <div><strong style={{ color: 'var(--text-muted)' }}>Incoming:</strong> <code style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{p.format}</code></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                <Info size={10} color="var(--text-muted)" />
                <span style={{ fontStyle: 'italic', fontSize: '0.65rem' }}>{p.mapping}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

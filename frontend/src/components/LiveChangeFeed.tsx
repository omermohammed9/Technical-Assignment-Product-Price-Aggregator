/**
 * @file LiveChangeFeed.tsx
 * @description Renders a real-time list of product price/availability changes streamed via SSE.
 * Allows clicking on entries to select products and focus on their respective details.
 */

import React from 'react';
import { Activity, TrendingUp, TrendingDown, ArrowRight, Zap } from 'lucide-react';

interface ChangeEvent {
  id: number;
  name: string;
  oldPrice: number;
  newPrice: number;
  timestamp: string;
}

interface LiveChangeFeedProps {
  changes: ChangeEvent[];
  connected: boolean;
  onSelectProduct: (productId: number) => void;
}

export const LiveChangeFeed: React.FC<LiveChangeFeedProps> = ({
  changes,
  connected,
  onSelectProduct
}) => {
  /** Formats a numeric price into a standard USD currency format */
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };


  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflow: 'visible' }}>
      {/* Feed title and status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} className="logo-text" /> Live Price Stream
        </h3>
        
        {/* SSE status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div className={`pulse-dot ${connected ? '' : 'disconnected'}`} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: connected ? 'var(--success)' : 'var(--danger)' }}>
            {connected ? 'Streaming' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Change list */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
        {changes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Zap size={32} style={{ strokeWidth: 1.5, marginBottom: '0.5rem', color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.85rem' }}>Waiting for updates...</span>
            <span style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>Aggregator cycles or simulation will post events here.</span>
          </div>
        ) : (
          changes.map((c, index) => {
            const diff = c.newPrice - c.oldPrice;
            const diffPercent = c.oldPrice > 0 ? (diff / c.oldPrice) * 100 : 0;
            const isUp = diff >= 0;

            return (
              <div
                key={`${c.id}-${c.timestamp}-${index}`}
                id={`live-change-card-${c.id}-${index}`}
                onClick={() => onSelectProduct(c.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectProduct(c.id);
                  }
                }}
                className="card"
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.015)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>{formatPrice(c.oldPrice)}</span>
                    <ArrowRight size={12} color="var(--text-muted)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(c.newPrice)}</span>
                  </div>

                  <span
                    className={`badge ${isUp ? 'badge-success' : 'badge-danger'}`}
                    style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
                  >
                    {isUp ? <TrendingUp size={10} style={{ marginRight: '0.15rem' }} /> : <TrendingDown size={10} style={{ marginRight: '0.15rem' }} />}
                    {isUp ? '+' : ''}{diffPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

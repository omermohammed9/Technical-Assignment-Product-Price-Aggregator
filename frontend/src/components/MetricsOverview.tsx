import React from 'react';
import { Package, ShieldAlert, BadgeDollarSign, Database } from 'lucide-react';

interface MetricsOverviewProps {
  totalProducts: number;
  averagePrice: number;
  staleCount: number;
  providerCount: number;
  loading: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  totalProducts,
  averagePrice,
  staleCount,
  providerCount,
  loading
}) => {
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const metrics = [
    {
      id: "metric-total-products",
      title: 'Total Catalog',
      value: loading ? (
        <span className="skeleton-shimmer" style={{ display: 'inline-block', height: '1.75rem', width: '60px', borderRadius: '4px', verticalAlign: 'middle' }} />
      ) : totalProducts,
      icon: <Package size={22} color="var(--primary)" />,
      description: 'Indexed items',
      glowClass: 'var(--primary-glow)'
    },
    {
      id: "metric-avg-price",
      title: 'Average Price',
      value: loading ? (
        <span className="skeleton-shimmer" style={{ display: 'inline-block', height: '1.75rem', width: '90px', borderRadius: '4px', verticalAlign: 'middle' }} />
      ) : formatPrice(averagePrice),
      icon: <BadgeDollarSign size={22} color="var(--accent)" />,
      description: 'Across all items',
      glowClass: 'rgba(6, 182, 212, 0.15)'
    },
    {
      id: "metric-stale-products",
      title: 'Stale Products',
      value: loading ? (
        <span className="skeleton-shimmer" style={{ display: 'inline-block', height: '1.75rem', width: '45px', borderRadius: '4px', verticalAlign: 'middle' }} />
      ) : staleCount,
      icon: <ShieldAlert size={22} color={staleCount > 0 ? "var(--warning)" : "var(--success)"} />,
      description: 'Requires aggregation',
      badge: staleCount > 0 ? (
        <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
          Stale
        </span>
      ) : (
        <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
          Fresh
        </span>
      ),
      glowClass: staleCount > 0 ? 'var(--warning-glow)' : 'var(--success-glow)'
    },
    {
      id: "metric-providers",
      title: 'Data Sources',
      value: loading ? (
        <span className="skeleton-shimmer" style={{ display: 'inline-block', height: '1.75rem', width: '45px', borderRadius: '4px', verticalAlign: 'middle' }} />
      ) : providerCount,
      icon: <Database size={22} color="var(--success)" />,
      description: 'Active simulators',
      glowClass: 'var(--success-glow)'
    }
  ];

  return (
    <div className="metrics-row">
      {metrics.map((m) => (
        <div
          key={m.id}
          id={m.id}
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            padding: '1.25rem',
            minHeight: '120px'
          }}
        >
          {/* Subtle background glow */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: m.glowClass,
              filter: 'blur(20px)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {m.title}
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)'
              }}
            >
              {m.icon}
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {m.value}
            </h2>
            {m.badge}
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
            {m.description}
          </span>
        </div>
      ))}
    </div>
  );
};

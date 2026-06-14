import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, ShoppingCart } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

interface PriceHistoryEntry {
  id: number;
  price: number;
  availabilityChanged: boolean;
  timestamp: string;
}

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
  history?: PriceHistoryEntry[];
}

interface ProductHistoryChartProps {
  product: Product | null;
  loading: boolean;
}

export const ProductHistoryChart: React.FC<ProductHistoryChartProps> = ({ product, loading }) => {
  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px', color: 'var(--text-secondary)' }}>
        <Clock size={20} className="spin" style={{ marginRight: '0.5rem', animation: 'spin 2s infinite linear' }} /> Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '350px', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
        <ShoppingCart size={48} style={{ strokeWidth: 1.5, marginBottom: '1rem', color: 'var(--text-muted)' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No Product Selected</h3>
        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Select a product from the list to view its price details and aggregation history.</p>
      </div>
    );
  }

  // Compile full price history list chronologically
  // history in DB contains old prices. The current price is product.price.
  // Reconstruct timeline:
  const historyPoints = [...(product.history || [])];
  
  // Sort oldest first for the chart
  historyPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Data points:
  const chartLabels: string[] = [];
  const chartPrices: number[] = [];

  historyPoints.forEach((hp) => {
    chartLabels.push(new Date(hp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    chartPrices.push(hp.price);
  });

  // Finally add the current price
  chartLabels.push(new Date(product.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  chartPrices.push(product.price);

  // Stats calculation
  const priceChanges = chartPrices.length;
  const initialPrice = chartPrices[0] || 0;
  const currentPrice = product.price;
  const priceDiff = currentPrice - initialPrice;
  const priceDiffPercent = initialPrice > 0 ? (priceDiff / initialPrice) * 100 : 0;
  const isUp = priceDiff >= 0;

  // Chart configuration
  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Price (USD)',
        data: chartPrices,
        borderColor: '#6366f1',
        borderWidth: 3,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: chartPrices.length > 15 ? 2 : 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0.01)');
          return gradient;
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' as const },
        bodyFont: { family: 'Plus Jakarta Sans' },
        padding: 10,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        callbacks: {
          label: (item: any) => ` Price: $${Number(item.raw).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
        },
        ticks: {
          color: '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 10 },
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
        },
        ticks: {
          color: '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 10 },
          callback: (value: any) => `$${value}`,
        },
      },
    },
  };

  return (
    <div className="card" id="history-chart-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Product Details Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
            Active Product
          </span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {product.name}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {product.description}
          </p>
        </div>
        
        {/* Quick price card */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '0.75rem 1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Current Price</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ${product.price.toFixed(2)}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Net Shift</span>
            {priceChanges <= 1 ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                No changes yet
              </span>
            ) : (
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isUp ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isUp ? '+' : ''}
                {priceDiffPercent.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Line Chart Visualizer */}
      <div style={{ height: '280px', position: 'relative', width: '100%' }}>
        <Line data={data} options={options} />
      </div>

      {/* Meta Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={12} />
          <span>Last aggregations: {priceChanges} data point{priceChanges !== 1 ? 's' : ''} tracked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={12} color="var(--success)" />
          <span style={{ color: 'var(--text-secondary)' }}>Source: NestJS Aggregator ({product.provider})</span>
        </div>
      </div>
    </div>
  );
};

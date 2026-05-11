import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { HoldingsTable } from '../components/portfolio/HoldingsTable';
import { AllocationChart } from '../components/charts/AllocationChart';
import { TransactionModal } from '../components/portfolio/TransactionModal';
import { formatCurrency, formatPercent } from '../lib/utils';

export function Portfolio() {
  const { holdings, stats, fetchTransactions, quotesLoading, txLoading } = usePortfolioStore();
  const [txOpen, setTxOpen] = useState(false);

  useEffect(() => { fetchTransactions(); }, []);

  const isLoading = txLoading || quotesLoading;

  const sectors = Array.from(
    holdings.reduce((m, h) => {
      m.set(h.sector, (m.get(h.sector) || 0) + h.currentValue);
      return m;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono-num text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(stats.totalValue)}
          </div>
          <div
            className="font-mono-num text-sm mt-0.5"
            style={{ color: stats.totalGain >= 0 ? 'var(--success)' : 'var(--danger)' }}
          >
            {stats.totalGain >= 0 ? '+' : ''}{formatCurrency(stats.totalGain)} ({formatPercent(stats.totalGainPercent)}) all time
          </div>
        </div>
        <button onClick={() => setTxOpen(true)} className="btn btn-primary text-sm">
          <Plus size={15} /> Add Transaction
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Holdings', value: String(stats.holdingsCount) },
          { label: 'Cost Basis', value: formatCurrency(stats.totalCost) },
          { label: 'Day P&L', value: formatCurrency(stats.dayGain), colored: true, positive: stats.dayGain >= 0 },
          { label: 'Total Return', value: formatPercent(stats.totalGainPercent), colored: true, positive: stats.totalGain >= 0 },
        ].map(({ label, value, colored, positive }) => (
          <div key={label} className="card p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div
              className="font-mono-num font-semibold text-lg"
              style={{ color: colored ? (positive ? 'var(--success)' : 'var(--danger)') : 'var(--text-primary)' }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Holdings table */}
      <div className="card p-5">
        <div className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
          All Positions
        </div>
        <HoldingsTable holdings={holdings} loading={isLoading} />
      </div>

      {/* Allocation + sector breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Sector Allocation
          </div>
          <AllocationChart holdings={holdings} />
        </div>

        <div className="card p-5">
          <div className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Sector Breakdown
          </div>
          <div className="space-y-3">
            {sectors.map(([sector, value]) => {
              const pct = stats.totalValue > 0 ? (value / stats.totalValue) * 100 : 0;
              return (
                <div key={sector}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{sector}</span>
                    <span className="font-mono-num" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(value)} · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-overlay)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-cyan), #818cf8)' }}
                    />
                  </div>
                </div>
              );
            })}
            {sectors.length === 0 && (
              <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No sector data available
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionModal open={txOpen} onClose={() => setTxOpen(false)} />
    </div>
  );
}

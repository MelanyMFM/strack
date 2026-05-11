import { useEffect, useState } from 'react';
import { Plus, RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, Wallet } from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { HoldingsTable } from '../components/portfolio/HoldingsTable';
import { AllocationChart, HoldingsAllocation } from '../components/charts/AllocationChart';
import { PortfolioChart } from '../components/charts/PortfolioChart';
import { TransactionModal } from '../components/portfolio/TransactionModal';
import { getHistoricalData } from '../services/stockApi';
import { formatCurrency, formatPercent } from '../lib/utils';
import type { CandleData } from '../types';

function StatCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <Icon size={15} style={{ color: 'var(--accent-cyan)' }} />
        </div>
      </div>
      <div className="font-mono-num font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      {sub && (
        <div
          className="font-mono-num text-xs mt-1"
          style={{
            color:
              positive === undefined ? 'var(--text-muted)' : positive ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { stats, holdings, transactions, fetchTransactions, quotesLoading, txLoading, refreshQuotes } =
    usePortfolioStore();
  const [txOpen, setTxOpen] = useState(false);
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Load chart data from the largest holding
  useEffect(() => {
    const top = holdings[0];
    if (!top) { setChartData([]); return; }
    setChartLoading(true);
    getHistoricalData(top.ticker, '1day', 365)
      .then(setChartData)
      .catch(console.error)
      .finally(() => setChartLoading(false));
  }, [holdings[0]?.ticker]);

  const isLoading = txLoading || quotesLoading;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {holdings.length} position{holdings.length !== 1 ? 's' : ''} · {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshQuotes}
            disabled={isLoading}
            className="btn btn-ghost text-xs py-1.5 px-3"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setTxOpen(true)}
            className="btn btn-primary text-xs py-1.5 px-4"
          >
            <Plus size={13} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Portfolio Value"
          value={formatCurrency(stats.totalValue)}
          sub={`${stats.holdingsCount} holdings`}
          icon={Wallet}
        />
        <StatCard
          label="Total P&L"
          value={formatCurrency(stats.totalGain)}
          sub={formatPercent(stats.totalGainPercent)}
          positive={stats.totalGain >= 0}
          icon={stats.totalGain >= 0 ? TrendingUp : TrendingDown}
        />
        <StatCard
          label="Day Change"
          value={formatCurrency(stats.dayGain)}
          sub={formatPercent(stats.dayGainPercent)}
          positive={stats.dayGain >= 0}
          icon={Activity}
        />
        <StatCard
          label="Cost Basis"
          value={formatCurrency(stats.totalCost)}
          sub="Total invested"
          icon={DollarSign}
        />
      </div>

      {/* Chart + Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Performance chart */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Performance
              </div>
              {holdings[0] && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Showing {holdings[0].ticker} as benchmark
                </div>
              )}
            </div>
          </div>
          <PortfolioChart data={chartData} loading={chartLoading} />
        </div>

        {/* Allocation */}
        <div className="card p-5">
          <div className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Sector Allocation
          </div>
          <AllocationChart holdings={holdings} />
        </div>
      </div>

      {/* Holdings */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Holdings
          </div>
          <div className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>
            {holdings.length} positions
          </div>
        </div>
        <HoldingsTable holdings={holdings} loading={isLoading} compact />
      </div>

      {/* Holdings allocation bars */}
      {holdings.length > 0 && (
        <div className="card p-5">
          <div className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Position Sizing
          </div>
          <HoldingsAllocation holdings={holdings} />
        </div>
      )}

      <TransactionModal open={txOpen} onClose={() => setTxOpen(false)} />
    </div>
  );
}

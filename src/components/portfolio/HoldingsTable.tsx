import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { formatCurrency, formatPercent, getChangeBg } from '../../lib/utils';
import type { Holding } from '../../types';

interface HoldingsTableProps {
  holdings: Holding[];
  loading?: boolean;
  compact?: boolean;
}

type SortKey = 'ticker' | 'currentValue' | 'gainPercent' | 'dayChangePercent' | 'quantity';
type SortDir = 'asc' | 'desc';

export function HoldingsTable({ holdings, loading, compact = false }: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('currentValue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const navigate = useNavigate();

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...holdings].sort((a, b) => {
    const va = a[sortKey] as number | string;
    const vb = b[sortKey] as number | string;
    const cmp = typeof va === 'string' ? (va as string).localeCompare(vb as string) : (va as number) - (vb as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <Minus size={10} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  };

  const Th = ({ col, label, className = '' }: { col: SortKey; label: string; className?: string }) => (
    <th className={`text-left cursor-pointer select-none ${className}`} onClick={() => toggleSort(col)}>
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 skeleton rounded-lg" />
        ))}
      </div>
    );
  }

  if (!holdings.length) {
    return (
      <div
        className="rounded-xl flex flex-col items-center justify-center py-16 text-center"
        style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border)' }}
      >
        <div className="text-3xl mb-3">📈</div>
        <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          No holdings yet
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Record your first buy transaction to get started
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full data-table">
        <thead>
          <tr>
            <Th col="ticker" label="Asset" />
            <Th col="quantity" label="Qty" className="text-right" />
            <Th col="currentValue" label="Value" className="text-right" />
            <Th col="gainPercent" label="Total P&L" className="text-right" />
            {!compact && <Th col="dayChangePercent" label="Day" className="text-right" />}
            {!compact && <th className="text-right">Avg Cost</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((h) => (
            <tr
              key={h.ticker}
              className="cursor-pointer"
              onClick={() => navigate(`/stock/${h.ticker}`)}
            >
              {/* Asset */}
              <td>
                <div className="flex items-center gap-2.5">
                  {h.logo ? (
                    <img
                      src={h.logo}
                      alt={h.ticker}
                      className="w-7 h-7 rounded-md object-contain"
                      style={{ background: 'white', padding: 2 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold font-mono-num"
                      style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}
                    >
                      {h.ticker.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-mono-num font-medium" style={{ color: 'var(--text-primary)' }}>
                      {h.ticker}
                    </div>
                    {!compact && (
                      <div className="text-xs truncate max-w-36" style={{ color: 'var(--text-muted)' }}>
                        {h.companyName}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Quantity */}
              <td className="text-right font-mono-num text-xs" style={{ color: 'var(--text-secondary)' }}>
                {h.quantity.toFixed(h.quantity < 1 ? 4 : 2)}
              </td>

              {/* Value */}
              <td className="text-right">
                <div className="font-mono-num text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(h.currentValue)}
                </div>
                {!compact && (
                  <div className="font-mono-num text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(h.currentPrice)} / share
                  </div>
                )}
              </td>

              {/* Total P&L */}
              <td className="text-right">
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono-num"
                  style={h.gain >= 0
                    ? { background: 'var(--success-dim)', color: 'var(--success)' }
                    : { background: 'var(--danger-dim)', color: 'var(--danger)' }
                  }
                >
                  {h.gain >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {formatPercent(h.gainPercent)}
                </div>
                {!compact && (
                  <div
                    className="font-mono-num text-xs mt-0.5"
                    style={{ color: h.gain >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {h.gain >= 0 ? '+' : ''}{formatCurrency(h.gain)}
                  </div>
                )}
              </td>

              {/* Day change */}
              {!compact && (
                <td className="text-right">
                  <span
                    className="font-mono-num text-xs px-2 py-0.5 rounded-md"
                    style={h.dayChange >= 0
                      ? { background: 'var(--success-dim)', color: 'var(--success)' }
                      : { background: 'var(--danger-dim)', color: 'var(--danger)' }
                    }
                  >
                    {formatPercent(h.dayChangePercent)}
                  </span>
                </td>
              )}

              {/* Avg Cost */}
              {!compact && (
                <td className="text-right font-mono-num text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatCurrency(h.avgCost)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

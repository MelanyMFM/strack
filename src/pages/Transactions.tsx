import { useEffect, useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { TransactionModal } from '../components/portfolio/TransactionModal';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Transaction } from '../types';

export function Transactions() {
  const { transactions, fetchTransactions, deleteTx, txLoading } = usePortfolioStore();
  const [txOpen, setTxOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchTransactions(); }, []);

  const filtered = transactions
    .filter((t) =>
      !search ||
      t.ticker.toLowerCase().includes(search.toLowerCase()) ||
      t.notes?.toLowerCase().includes(search.toLowerCase())
    )
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await deleteTx(id);
    } finally {
      setDeleteId(null);
    }
  };

  const totalBuys = transactions.filter((t) => t.type === 'buy').reduce((s, t) => s + t.quantity * t.price + t.commission, 0);
  const totalSells = transactions.filter((t) => t.type === 'sell').reduce((s, t) => s + t.quantity * t.price - t.commission, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Transactions</div>
          <div className="font-mono-num font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>
            {transactions.length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Invested</div>
          <div className="font-mono-num font-semibold text-xl" style={{ color: 'var(--success)' }}>
            {formatCurrency(totalBuys)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Sold</div>
          <div className="font-mono-num font-semibold text-xl" style={{ color: 'var(--danger)' }}>
            {formatCurrency(totalSells)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by ticker or notes…"
            className="input pl-8 text-xs h-8"
          />
        </div>
        <button onClick={() => setTxOpen(true)} className="btn btn-primary text-xs py-1.5 px-4">
          <Plus size={13} />
          New Transaction
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {txLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 skeleton rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-3xl mb-3">📋</div>
            <div className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>
              {search ? 'No matching transactions' : 'No transactions yet'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {search ? 'Try a different search' : 'Record your first buy or sell to get started'}
            </div>
          </div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-left">Type</th>
                <th className="text-left">Ticker</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Commission</th>
                <th className="text-right">Total</th>
                <th className="text-left">Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx: Transaction) => {
                const total = tx.type === 'buy'
                  ? tx.quantity * tx.price + tx.commission
                  : tx.quantity * tx.price - tx.commission;
                return (
                  <tr key={tx.id}>
                    <td>
                      <span className="font-mono-num text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(tx.date)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                        style={
                          tx.type === 'buy'
                            ? { background: 'var(--success-dim)', color: 'var(--success)' }
                            : { background: 'var(--danger-dim)', color: 'var(--danger)' }
                        }
                      >
                        {tx.type === 'buy' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono-num font-medium text-xs" style={{ color: 'var(--accent-cyan)' }}>
                        {tx.ticker}
                      </span>
                    </td>
                    <td className="text-right font-mono-num text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {tx.quantity.toFixed(4)}
                    </td>
                    <td className="text-right font-mono-num text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrency(tx.price)}
                    </td>
                    <td className="text-right font-mono-num text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(tx.commission)}
                    </td>
                    <td className="text-right font-mono-num text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(total)}
                    </td>
                    <td>
                      <span className="text-xs truncate max-w-32 block" style={{ color: 'var(--text-muted)' }}>
                        {tx.notes || '—'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => tx.id && handleDelete(tx.id)}
                        disabled={deleteId === tx.id}
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <TransactionModal open={txOpen} onClose={() => setTxOpen(false)} />
    </div>
  );
}

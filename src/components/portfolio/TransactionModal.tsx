import { useState, useRef, useEffect } from 'react';
import { X, Search, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { searchStocks, getQuote } from '../../services/stockApi';
import { formatCurrency, debounce } from '../../lib/utils';
import type { StockSearchResult, StockQuote } from '../../types';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: 'buy' | 'sell';
  defaultTicker?: string;
}

export function TransactionModal({
  open,
  onClose,
  defaultType = 'buy',
  defaultTicker = '',
}: TransactionModalProps) {
  const { addTx, holdings } = usePortfolioStore();

  const [type, setType] = useState<'buy' | 'sell'>(defaultType);
  const [ticker, setTicker] = useState(defaultTicker);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [commission, setCommission] = useState('0');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState(defaultTicker);
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const doSearch = debounce(async (q: string) => {
    if (!q) { setSearchResults([]); return; }
    const r = await searchStocks(q);
    setSearchResults(r);
    setSearchOpen(true);
  }, 350);

  useEffect(() => { doSearch(searchQuery); }, [searchQuery]);

  useEffect(() => {
    if (!ticker) { setQuote(null); return; }
    setQuoteLoading(true);
    getQuote(ticker)
      .then((q) => {
        setQuote(q);
        setPrice(q.price.toFixed(2));
      })
      .catch(console.error)
      .finally(() => setQuoteLoading(false));
  }, [ticker]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setType(defaultType);
      setTicker(defaultTicker);
      setSearchQuery(defaultTicker);
      setQuantity('');
      setPrice('');
      setDate(new Date().toISOString().split('T')[0]);
      setCommission('0');
      setNotes('');
      setError('');
      if (defaultTicker) {
        setQuoteLoading(true);
        getQuote(defaultTicker).then((q) => {
          setQuote(q);
          setPrice(q.price.toFixed(2));
        }).finally(() => setQuoteLoading(false));
      }
    }
  }, [open, defaultType, defaultTicker]);

  const total = (parseFloat(quantity) || 0) * (parseFloat(price) || 0) + (parseFloat(commission) || 0);

  // Current holding for sell validation
  const holding = holdings.find((h) => h.ticker === ticker);
  const maxSell = holding?.quantity ?? 0;

  const handleSubmit = async () => {
    setError('');
    if (!ticker) return setError('Select a stock ticker');
    if (!quantity || parseFloat(quantity) <= 0) return setError('Enter a valid quantity');
    if (!price || parseFloat(price) <= 0) return setError('Enter a valid price');
    if (type === 'sell' && parseFloat(quantity) > maxSell)
      return setError(`You only have ${maxSell.toFixed(4)} shares of ${ticker}`);

    setSubmitting(true);
    try {
      await addTx({
        ticker,
        companyName: quote ? ticker : ticker,
        type,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        date,
        commission: parseFloat(commission) || 0,
        notes,
      });
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,9,15,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Record Transaction
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Buy / Sell toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            {(['buy', 'sell'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-150"
                style={
                  type === t
                    ? {
                        background: t === 'buy' ? 'var(--success-dim)' : 'var(--danger-dim)',
                        color: t === 'buy' ? 'var(--success)' : 'var(--danger)',
                      }
                    : { color: 'var(--text-muted)' }
                }
              >
                {t === 'buy' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Ticker search */}
          <div className="relative">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Stock Ticker
            </label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setTicker(''); }}
                onFocus={() => searchResults.length && setSearchOpen(true)}
                placeholder="Search or enter ticker (e.g. AAPL)"
                className="input pl-8 text-sm"
              />
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              >
                {searchResults.map((r) => (
                  <button
                    key={r.ticker}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => { setTicker(r.ticker); setSearchQuery(r.ticker); setSearchOpen(false); }}
                  >
                    <span className="text-xs font-mono-num font-medium w-14" style={{ color: 'var(--accent-cyan)' }}>{r.ticker}</span>
                    <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live price indicator */}
          {ticker && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              {quoteLoading ? (
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
              ) : quote ? (
                <>
                  <span className="text-xs font-mono-num font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(quote.price)}
                  </span>
                  <span
                    className="text-xs font-mono-num"
                    style={{ color: quote.change >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {quote.change >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                  </span>
                  <button
                    className="ml-auto text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}
                    onClick={() => quote && setPrice(quote.price.toFixed(2))}
                  >
                    Use market price
                  </button>
                </>
              ) : null}
              {type === 'sell' && holding && (
                <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                  You hold: <span style={{ color: 'var(--text-secondary)' }}>{holding.quantity.toFixed(4)}</span>
                </span>
              )}
            </div>
          )}

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="0.001"
                placeholder="0"
                className="input font-mono-num text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Price per share
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input font-mono-num text-sm"
              />
            </div>
          </div>

          {/* Date & Commission */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input text-sm"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Commission ($)
              </label>
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                min="0"
                step="0.01"
                className="input font-mono-num text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why did you make this trade?"
              className="input text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total {type === 'buy' ? 'cost' : 'proceeds'}</span>
            <span className="font-mono-num font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(total)}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <AlertCircle size={13} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn flex-1"
            style={{
              background: type === 'buy' ? 'var(--success)' : 'var(--danger)',
              color: '#05090f',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {submitting ? 'Saving…' : `Record ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

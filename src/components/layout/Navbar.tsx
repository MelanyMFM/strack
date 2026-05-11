import { useState, useEffect, useRef } from 'react';
import { Search, Bell, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchStocks } from '../../services/stockApi';
import { debounce } from '../../lib/utils';
import type { StockSearchResult } from '../../types';

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const doSearch = debounce(async (q: string) => {
    if (!q) { setResults([]); return; }
    setSearching(true);
    try {
      const r = await searchStocks(q);
      setResults(r);
      setOpen(true);
    } finally {
      setSearching(false);
    }
  }, 400);

  useEffect(() => {
    doSearch(query);
  }, [query]);

  const handleSelect = (ticker: string) => {
    setQuery('');
    setOpen(false);
    navigate(`/stock/${ticker}`);
  };

  // Close on outside click
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 left-60 h-14 flex items-center px-6 gap-4 z-30 glass"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Page title */}
      <h1 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)', minWidth: 120 }}>
        {title}
      </h1>

      {/* Search */}
      <div ref={wrapperRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks… (AAPL, TSLA)"
            className="input pl-8 pr-8 text-xs h-8"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div
            className="absolute top-full mt-1 w-full rounded-xl overflow-hidden z-50"
            style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            {results.map((r) => (
              <button
                key={r.ticker}
                onClick={() => handleSelect(r.ticker)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold font-mono-num shrink-0"
                  style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}
                >
                  {r.ticker.slice(0, 3)}
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {r.ticker}
                  </div>
                  <div className="text-xs truncate max-w-64" style={{ color: 'var(--text-muted)' }}>
                    {r.name}
                  </div>
                </div>
                <div
                  className="ml-auto text-xs px-2 py-0.5 rounded"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                >
                  {r.type}
                </div>
              </button>
            ))}
          </div>
        )}
        {open && searching && (
          <div
            className="absolute top-full mt-1 w-full rounded-xl px-4 py-3 text-xs"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Searching…
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Market status */}
        <MarketStatus />

        {/* Notifications */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          <Bell size={14} />
        </button>
      </div>
    </header>
  );
}

function MarketStatus() {
  const hour = new Date().getUTCHours();
  const day = new Date().getUTCDay();
  // US market open: 14:30–21:00 UTC Mon-Fri
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && hour >= 14 && hour < 21;

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{
        background: isOpen ? 'var(--success-dim)' : 'var(--bg-elevated)',
        color: isOpen ? 'var(--success)' : 'var(--text-muted)',
        border: `1px solid ${isOpen ? 'rgba(52,211,153,0.2)' : 'var(--border)'}`,
      }}
    >
      {isOpen ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {isOpen ? 'Market Open' : 'Market Closed'}
    </div>
  );
}

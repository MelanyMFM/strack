import { useEffect, useState } from 'react';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { getMarketNews, getQuotes } from '../services/stockApi';
import { formatCurrency, formatPercent, formatRelativeTime } from '../lib/utils';
import type { NewsItem, StockQuote } from '../types';

const INDICES = ['SPY', 'QQQ', 'DIA', 'IWM'];
const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK-B'];

export function Markets() {
  const { watchlist } = usePortfolioStore();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [indexQuotes, setIndexQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [watchQuotes, setWatchQuotes] = useState<Map<string, StockQuote>>(new Map());

  const displayWatchlist = watchlist.length > 0 ? watchlist : DEFAULT_WATCHLIST;

  useEffect(() => {
    getMarketNews(10)
      .then(setNews)
      .catch(console.error)
      .finally(() => setNewsLoading(false));

    getQuotes(INDICES).then(setIndexQuotes).catch(console.error);
  }, []);

  useEffect(() => {
    if (displayWatchlist.length) {
      getQuotes(displayWatchlist).then(setWatchQuotes).catch(console.error);
    }
  }, [displayWatchlist.join(',')]);

  return (
    <div className="space-y-6">
      {/* Market indices */}
      <div>
        <div className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
          Major Indices
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INDICES.map((idx) => {
            const q = indexQuotes.get(idx);
            const pos = (q?.change ?? 0) >= 0;
            return (
              <div key={idx} className="card p-4">
                <div className="text-xs font-mono-num font-medium mb-2" style={{ color: 'var(--accent-cyan)' }}>{idx}</div>
                {q ? (
                  <>
                    <div className="font-mono-num font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(q.price)}
                    </div>
                    <div
                      className="font-mono-num text-xs mt-0.5"
                      style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}
                    >
                      {pos ? '+' : ''}{formatPercent(q.changePercent)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-6 w-24 skeleton rounded mb-1" />
                    <div className="h-3 w-16 skeleton rounded" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Watchlist */}
        <div className="xl:col-span-1">
          <div className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            {watchlist.length > 0 ? 'Your Watchlist' : 'Popular Stocks'}
          </div>
          <div className="card overflow-hidden">
            {displayWatchlist.map((ticker, i) => {
              const q = watchQuotes.get(ticker);
              const pos = (q?.change ?? 0) >= 0;
              return (
                <div
                  key={ticker}
                  className="flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer"
                  style={{ borderBottom: i < displayWatchlist.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold font-mono-num shrink-0"
                    style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}
                  >
                    {ticker.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono-num font-medium" style={{ color: 'var(--text-primary)' }}>{ticker}</div>
                  </div>
                  {q ? (
                    <div className="text-right">
                      <div className="font-mono-num text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(q.price)}
                      </div>
                      <div
                        className="font-mono-num text-xs"
                        style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {pos ? <TrendingUp size={10} className="inline mr-0.5" /> : <TrendingDown size={10} className="inline mr-0.5" />}
                        {formatPercent(q.changePercent)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-right space-y-1">
                      <div className="h-3 w-16 skeleton rounded" />
                      <div className="h-2 w-12 skeleton rounded" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Market news */}
        <div className="xl:col-span-2">
          <div className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            Market News
          </div>
          <div className="card overflow-hidden">
            {newsLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-14 w-20 skeleton rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 skeleton rounded w-full" />
                      <div className="h-3 skeleton rounded w-3/4" />
                      <div className="h-2 skeleton rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {news.map((item, i) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 px-4 py-3 group transition-colors"
                    style={{ borderBottom: i < news.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="w-16 h-12 rounded-lg object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium leading-snug line-clamp-2 group-hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.headline}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.source}</span>
                        <span style={{ color: 'var(--border)' }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatRelativeTime(item.datetime)}
                        </span>
                      </div>
                    </div>
                    <ExternalLink size={11} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

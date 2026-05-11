import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, StarOff, ExternalLink, Globe, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { useStockQuote, useStockHistory, useStockNews, useCompanyProfile } from '../hooks/useStockData';
import { PortfolioChart } from '../components/charts/PortfolioChart';
import { TransactionModal } from '../components/portfolio/TransactionModal';
import { addToWatchlist, removeFromWatchlist } from '../services/dbService';
import { formatCurrency, formatPercent, formatCompactCurrency, formatRelativeTime } from '../lib/utils';

export function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const { user, holdings, watchlist, addToWatchlist: addWL, removeFromWatchlist: removeWL } = usePortfolioStore();
  const [txOpen, setTxOpen] = useState(false);
  const [txType, setTxType] = useState<'buy' | 'sell'>('buy');

  const { quote, loading: qLoading } = useStockQuote(ticker ?? null);
  const { data: history, loading: hLoading } = useStockHistory(ticker ?? null, '1day', 365);
  const { news } = useStockNews(ticker ?? null, 6);
  const { profile } = useCompanyProfile(ticker ?? null);

  const holding = holdings.find((h) => h.ticker === ticker);
  const inWatchlist = watchlist.includes(ticker ?? '');

  const toggleWatchlist = async () => {
    if (!user || !ticker) return;
    if (inWatchlist) {
      removeWL(ticker);
      await removeFromWatchlist(user.uid, ticker);
    } else {
      addWL(ticker);
      await addToWatchlist(user.uid, ticker);
    }
  };

  if (!ticker) return null;

  const isPositive = (quote?.change ?? 0) >= 0;

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} />
          </button>

          <div className="flex items-center gap-3">
            {profile?.logo && (
              <img
                src={profile.logo}
                alt={ticker}
                className="w-10 h-10 rounded-xl object-contain"
                style={{ background: 'white', padding: 4 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{ticker}</h1>
                {profile?.exchange && (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {profile.exchange}
                  </span>
                )}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{profile?.name || ticker}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleWatchlist}
            className="btn btn-ghost text-xs py-1.5 px-3"
          >
            {inWatchlist ? <StarOff size={13} style={{ color: 'var(--warning)' }} /> : <Star size={13} />}
            {inWatchlist ? 'Unwatch' : 'Watchlist'}
          </button>
          <button onClick={() => { setTxType('sell'); setTxOpen(true); }} className="btn btn-ghost text-xs py-1.5 px-3" style={{ color: 'var(--danger)' }}>
            <TrendingDown size={13} /> Sell
          </button>
          <button onClick={() => { setTxType('buy'); setTxOpen(true); }} className="btn btn-primary text-xs py-1.5 px-3">
            <TrendingUp size={13} /> Buy
          </button>
        </div>
      </div>

      {/* Price banner */}
      <div className="card p-6">
        <div className="flex items-end justify-between">
          <div>
            {qLoading ? (
              <div className="h-10 w-36 skeleton rounded" />
            ) : (
              <>
                <div className="font-mono-num font-bold text-4xl" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(quote?.price ?? 0)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="font-mono-num text-sm font-medium"
                    style={{ color: isPositive ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {isPositive ? '+' : ''}{formatCurrency(quote?.change ?? 0)}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md text-sm font-mono-num font-medium"
                    style={isPositive
                      ? { background: 'var(--success-dim)', color: 'var(--success)' }
                      : { background: 'var(--danger-dim)', color: 'var(--danger)' }
                    }
                  >
                    {formatPercent(quote?.changePercent ?? 0)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>today</span>
                </div>
              </>
            )}
          </div>

          {/* Day range */}
          {quote && (
            <div className="text-right">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Day Range</div>
              <div className="font-mono-num text-sm" style={{ color: 'var(--text-secondary)' }}>
                {formatCurrency(quote.low)} — {formatCurrency(quote.high)}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Open {formatCurrency(quote.open)} · Prev {formatCurrency(quote.prevClose)}
              </div>
            </div>
          )}
        </div>

        {/* Your position */}
        {holding && (
          <div
            className="mt-5 pt-5 flex items-center gap-6"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Your position</div>
              <div className="font-mono-num font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(holding.currentValue)}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Shares</div>
              <div className="font-mono-num font-medium" style={{ color: 'var(--text-secondary)' }}>
                {holding.quantity.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg cost</div>
              <div className="font-mono-num font-medium" style={{ color: 'var(--text-secondary)' }}>
                {formatCurrency(holding.avgCost)}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total P&L</div>
              <div
                className="font-mono-num font-medium"
                style={{ color: holding.gain >= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {formatCurrency(holding.gain)} ({formatPercent(holding.gainPercent)})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="card p-5">
        <div className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
          Price History
        </div>
        <PortfolioChart data={history} loading={hLoading} />
      </div>

      {/* Company info + stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* About */}
        {profile && (
          <div className="xl:col-span-2 card p-5">
            <div className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>About</div>
            <p className="text-sm leading-relaxed line-clamp-4" style={{ color: 'var(--text-secondary)' }}>
              {profile.description || 'No company description available.'}
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              {profile.sector && (
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Sector</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{profile.sector}</div>
                </div>
              )}
              {profile.industry && (
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Industry</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{profile.industry}</div>
                </div>
              )}
              {profile.country && (
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Country</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{profile.country}</div>
                </div>
              )}
              {profile.marketCap > 0 && (
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Market Cap</div>
                  <div className="text-xs font-mono-num font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {formatCompactCurrency(profile.marketCap)}
                  </div>
                </div>
              )}
              {profile.employees > 0 && (
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Employees</div>
                  <div className="text-xs font-mono-num font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Intl.NumberFormat().format(profile.employees)}
                  </div>
                </div>
              )}
            </div>
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-xs transition-colors"
                style={{ color: 'var(--accent-cyan)' }}
              >
                <Globe size={12} />
                {profile.website.replace(/^https?:\/\//, '')}
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}

        {/* Key stats */}
        <div className="card p-5">
          <div className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Key Stats</div>
          <div className="space-y-3">
            {[
              { label: 'Open', value: quote ? formatCurrency(quote.open) : '—' },
              { label: 'Prev Close', value: quote ? formatCurrency(quote.prevClose) : '—' },
              { label: 'Day High', value: quote ? formatCurrency(quote.high) : '—' },
              { label: 'Day Low', value: quote ? formatCurrency(quote.low) : '—' },
              { label: 'Volume', value: quote ? new Intl.NumberFormat().format(quote.volume) : '—' },
              { label: 'Market Cap', value: profile?.marketCap ? formatCompactCurrency(profile.marketCap) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-xs font-mono-num font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* News */}
      {news.length > 0 && (
        <div className="card p-5">
          <div className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Latest News
          </div>
          <div className="space-y-0">
            {news.map((item, i) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 py-3 group transition-colors"
                style={{
                  borderBottom: i < news.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
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
                    className="text-sm font-medium leading-snug line-clamp-2 transition-colors group-hover:opacity-80"
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
                <ExternalLink size={12} className="shrink-0 mt-1 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--text-muted)' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      <TransactionModal
        open={txOpen}
        onClose={() => setTxOpen(false)}
        defaultType={txType}
        defaultTicker={ticker}
      />
    </div>
  );
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return formatCurrency(value);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
}

export function getChangeBg(value: number): string {
  if (value > 0) return 'bg-emerald-400/10 text-emerald-400';
  if (value < 0) return 'bg-red-400/10 text-red-400';
  return 'bg-slate-400/10 text-slate-400';
}

export function getSectorColor(sector: string): string {
  const colors: Record<string, string> = {
    Technology: '#22d3ee',
    Healthcare: '#34d399',
    Finance: '#818cf8',
    'Consumer Cyclical': '#f472b6',
    Energy: '#fbbf24',
    Industrials: '#fb923c',
    'Communication Services': '#60a5fa',
    Utilities: '#a78bfa',
    Materials: '#4ade80',
    'Real Estate': '#f87171',
    'Consumer Defensive': '#e879f9',
  };
  return colors[sector] || '#94a3b8';
}

// Calculate holdings from transactions
export function computeHoldings(
  transactions: Array<{
    ticker: string;
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    commission: number;
  }>
): Map<string, { quantity: number; totalCost: number; avgCost: number }> {
  const holdings = new Map<string, { quantity: number; totalCost: number }>();

  for (const tx of transactions) {
    const existing = holdings.get(tx.ticker) || { quantity: 0, totalCost: 0 };
    if (tx.type === 'buy') {
      existing.quantity += tx.quantity;
      existing.totalCost += tx.quantity * tx.price + tx.commission;
    } else {
      const avgCost = existing.quantity > 0 ? existing.totalCost / existing.quantity : 0;
      existing.quantity -= tx.quantity;
      existing.totalCost -= avgCost * tx.quantity;
    }
    if (existing.quantity > 0.0001) {
      holdings.set(tx.ticker, existing);
    } else {
      holdings.delete(tx.ticker);
    }
  }

  return new Map(
    Array.from(holdings.entries()).map(([ticker, h]) => [
      ticker,
      { ...h, avgCost: h.quantity > 0 ? h.totalCost / h.quantity : 0 },
    ])
  );
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

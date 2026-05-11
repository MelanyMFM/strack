/**
 * ─── STOCK API SERVICE ───────────────────────────────────────────────────────
 *
 * APIs used:
 *  1. Finnhub (https://finnhub.io)
 *     - Free: 60 calls/minute
 *     - Used for: real-time quotes, company profiles, news
 *
 *  2. Twelve Data (https://twelvedata.com)
 *     - Free: 800 calls/day, 8 calls/minute
 *     - Used for: historical OHLCV, symbol search
 *
 * ─── HOW TO GET API KEYS ─────────────────────────────────────────────────────
 *
 * FINNHUB:
 *  1. Go to https://finnhub.io
 *  2. Click "Get free API key"
 *  3. Create account and verify email
 *  4. Go to Dashboard → API Keys
 *  5. Copy your key
 *  6. Add to .env: VITE_FINNHUB_API_KEY=your_key_here
 *
 * TWELVE DATA:
 *  1. Go to https://twelvedata.com
 *  2. Click "Sign up for free"
 *  3. Create account and verify email
 *  4. Go to Dashboard → API Keys
 *  5. Copy your key
 *  6. Add to .env: VITE_TWELVE_DATA_API_KEY=your_key_here
 *
 * ─── .env file ────────────────────────────────────────────────────────────────
 * VITE_FINNHUB_API_KEY=xxxxxxxxxxxxxxxxxxxx
 * VITE_TWELVE_DATA_API_KEY=xxxxxxxxxxxxxxxxxxxx
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type {
  StockQuote,
  CompanyProfile,
  CandleData,
  NewsItem,
  StockSearchResult,
} from '../types';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const TWELVE_BASE = 'https://api.twelvedata.com';
const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY || '';
const TWELVE_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY || '';

// ─── Simple in-memory cache to respect rate limits ────────────────────────────
const cache = new Map<string, { data: unknown; expiry: number }>();

function cached<T>(key: string, fn: () => Promise<T>, ttlMs = 60_000): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiry > Date.now()) return Promise.resolve(hit.data as T);
  return fn().then((data) => {
    cache.set(key, { data, expiry: Date.now() + ttlMs });
    return data;
  });
}

async function finnhub<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${FINNHUB_BASE}${endpoint}`);
  url.searchParams.set('token', FINNHUB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Finnhub error ${res.status}: ${res.statusText}`);
  return res.json();
}

async function twelveData<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TWELVE_BASE}${endpoint}`);
  url.searchParams.set('apikey', TWELVE_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Twelve Data error ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── QUOTES ──────────────────────────────────────────────────────────────────
export async function getQuote(ticker: string): Promise<StockQuote> {
  return cached(`quote:${ticker}`, async () => {
    const data = await finnhub<{
      c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; v: number;
    }>('/quote', { symbol: ticker });
    return {
      ticker,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      prevClose: data.pc,
      volume: data.v ?? 0,
      timestamp: Date.now(),
    } satisfies StockQuote;
  }, 30_000); // cache 30 sec
}

export async function getQuotes(tickers: string[]): Promise<Map<string, StockQuote>> {
  const results = await Promise.allSettled(tickers.map((t) => getQuote(t)));
  const map = new Map<string, StockQuote>();
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') map.set(tickers[i], r.value);
  });
  return map;
}

// ─── COMPANY PROFILE ─────────────────────────────────────────────────────────
export async function getCompanyProfile(ticker: string): Promise<CompanyProfile> {
  return cached(`profile:${ticker}`, async () => {
    const data = await finnhub<{
      name: string; exchange: string; finnhubIndustry: string; country: string;
      weburl: string; logo: string; marketCapitalization: number; employeeTotal: number;
      description?: string; shareOutstanding?: number;
    }>('/stock/profile2', { symbol: ticker });
    return {
      ticker,
      name: data.name || ticker,
      exchange: data.exchange || '',
      industry: data.finnhubIndustry || '',
      sector: data.finnhubIndustry || '',
      description: data.description || '',
      marketCap: (data.marketCapitalization || 0) * 1_000_000,
      website: data.weburl || '',
      logo: data.logo || '',
      country: data.country || '',
      employees: data.employeeTotal || 0,
    } satisfies CompanyProfile;
  }, 3_600_000); // cache 1 hour
}

// ─── HISTORICAL DATA ─────────────────────────────────────────────────────────
export async function getHistoricalData(
  ticker: string,
  interval: '1day' | '1week' | '1month' = '1day',
  outputSize = 252
): Promise<CandleData[]> {
  return cached(`hist:${ticker}:${interval}:${outputSize}`, async () => {
    interface TwelveResponse {
      values?: Array<{ datetime: string; open: string; high: string; low: string; close: string; volume: string }>;
      status?: string;
      message?: string;
    }
    const data = await twelveData<TwelveResponse>('/time_series', {
      symbol: ticker,
      interval,
      outputsize: String(outputSize),
      format: 'JSON',
    });
    if (!data.values || data.status === 'error') {
      console.warn(`Historical data unavailable for ${ticker}:`, data.message);
      return [];
    }
    return data.values
      .map((v) => ({
        date: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume || '0', 10),
      }))
      .reverse(); // oldest first
  }, 600_000); // cache 10 min
}

// ─── STOCK NEWS ──────────────────────────────────────────────────────────────
export async function getStockNews(ticker: string, count = 10): Promise<NewsItem[]> {
  return cached(`news:${ticker}`, async () => {
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];
    const data = await finnhub<Array<{
      id: string; headline: string; summary: string; source: string;
      url: string; datetime: number; image: string; related: string;
    }>>('/company-news', { symbol: ticker, from: monthAgo, to: today });
    return data.slice(0, count).map((n) => ({
      id: String(n.id || n.datetime),
      headline: n.headline,
      summary: n.summary,
      source: n.source,
      url: n.url,
      datetime: n.datetime * 1000, // convert to ms
      image: n.image,
      related: n.related,
    }));
  }, 300_000); // cache 5 min
}

// ─── MARKET NEWS ─────────────────────────────────────────────────────────────
export async function getMarketNews(count = 8): Promise<NewsItem[]> {
  return cached('market-news', async () => {
    const data = await finnhub<Array<{
      id: string; headline: string; summary: string; source: string;
      url: string; datetime: number; image: string; related: string;
    }>>('/news', { category: 'general' });
    return data.slice(0, count).map((n) => ({
      id: String(n.id),
      headline: n.headline,
      summary: n.summary,
      source: n.source,
      url: n.url,
      datetime: n.datetime * 1000,
      image: n.image,
      related: n.related,
    }));
  }, 300_000);
}

// ─── SYMBOL SEARCH ───────────────────────────────────────────────────────────
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query || query.length < 1) return [];
  return cached(`search:${query.toLowerCase()}`, async () => {
    const data = await finnhub<{
      result?: Array<{ symbol: string; description: string; type: string; displaySymbol: string }>;
    }>('/search', { q: query });
    return (data.result || [])
      .filter((r) => r.type === 'Common Stock' || r.type === 'ETP')
      .slice(0, 8)
      .map((r) => ({
        ticker: r.symbol,
        name: r.description,
        type: r.type,
        region: 'US',
        currency: 'USD',
      }));
  }, 60_000);
}

// ─── MARKET STATUS ────────────────────────────────────────────────────────────
export async function getMarketStatus(): Promise<{ isOpen: boolean; session: string }> {
  return cached('market-status', async () => {
    const data = await finnhub<{ isOpen: boolean; session: string }>('/stock/market-status', {
      exchange: 'US',
    });
    return { isOpen: data.isOpen, session: data.session };
  }, 60_000);
}

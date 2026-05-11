import { useState, useEffect, useCallback } from 'react';
import { getHistoricalData, getStockNews, getCompanyProfile, getQuote } from '../services/stockApi';
import type { CandleData, NewsItem, CompanyProfile, StockQuote } from '../types';

export function useStockQuote(ticker: string | null) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const q = await getQuote(ticker);
      setQuote(q);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    refresh();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { quote, loading, error, refresh };
}

export function useStockHistory(ticker: string | null, interval: '1day' | '1week' | '1month' = '1day', size = 252) {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    getHistoricalData(ticker, interval, size)
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [ticker, interval, size]);

  return { data, loading, error };
}

export function useStockNews(ticker: string | null, count = 8) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    getStockNews(ticker, count)
      .then(setNews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ticker, count]);

  return { news, loading };
}

export function useCompanyProfile(ticker: string | null) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    getCompanyProfile(ticker)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ticker]);

  return { profile, loading };
}

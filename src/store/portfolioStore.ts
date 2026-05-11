import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AppUser, Transaction, Holding, PortfolioStats, StockQuote } from '../types';
import { getTransactions, addTransaction, deleteTransaction } from '../services/dbService';
import { getQuotes, getCompanyProfile } from '../services/stockApi';
import { computeHoldings } from '../lib/utils';

interface PortfolioState {
  // Auth
  user: AppUser | null;
  authLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setAuthLoading: (loading: boolean) => void;

  // Transactions
  transactions: Transaction[];
  txLoading: boolean;
  txError: string | null;
  fetchTransactions: () => Promise<void>;
  addTx: (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteTx: (id: string) => Promise<void>;

  // Holdings & quotes
  holdings: Holding[];
  quotes: Map<string, StockQuote>;
  quotesLoading: boolean;
  refreshQuotes: () => Promise<void>;

  // Portfolio stats
  stats: PortfolioStats;

  // Watchlist
  watchlist: string[];
  setWatchlist: (tickers: string[]) => void;
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
}

function computeStats(holdings: Holding[]): PortfolioStats {
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const dayGain = holdings.reduce((s, h) => s + h.dayChange * h.quantity, 0);
  const dayGainPercent = totalValue > 0 ? (dayGain / (totalValue - dayGain)) * 100 : 0;
  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
    dayGain,
    dayGainPercent,
    holdingsCount: holdings.length,
  };
}

export const usePortfolioStore = create<PortfolioState>()(
  subscribeWithSelector((set, get) => ({
    // ─── Auth ────────────────────────────────────────────────────────────────
    user: null,
    authLoading: true,
    setUser: (user) => set({ user }),
    setAuthLoading: (authLoading) => set({ authLoading }),

    // ─── Transactions ────────────────────────────────────────────────────────
    transactions: [],
    txLoading: false,
    txError: null,

    fetchTransactions: async () => {
      const { user } = get();
      if (!user) return;
      set({ txLoading: true, txError: null });
      try {
        const transactions = await getTransactions(user.uid);
        set({ transactions, txLoading: false });
        await get().refreshQuotes();
      } catch (err) {
        set({ txError: String(err), txLoading: false });
      }
    },

    addTx: async (tx) => {
      const { user } = get();
      if (!user) throw new Error('Not authenticated');
      const id = await addTransaction(user.uid, tx);
      const newTx: Transaction = {
        ...tx,
        id,
        userId: user.uid,
        createdAt: Date.now(),
      };
      set((s) => ({ transactions: [...s.transactions, newTx].sort((a, b) => a.date.localeCompare(b.date)) }));
      await get().refreshQuotes();
    },

    deleteTx: async (id) => {
      const { user } = get();
      if (!user) throw new Error('Not authenticated');
      await deleteTransaction(user.uid, id);
      set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
      await get().refreshQuotes();
    },

    // ─── Holdings & Quotes ────────────────────────────────────────────────────
    holdings: [],
    quotes: new Map(),
    quotesLoading: false,

    refreshQuotes: async () => {
      const { transactions } = get();
      if (!transactions.length) {
        set({ holdings: [], stats: computeStats([]) });
        return;
      }

      set({ quotesLoading: true });

      // Compute raw holdings from transactions
      const rawHoldings = computeHoldings(transactions);
      const tickers = Array.from(rawHoldings.keys());

      // Fetch quotes and profiles in parallel
      const [quotesMap, profileResults] = await Promise.all([
        getQuotes(tickers),
        Promise.allSettled(tickers.map((t) => getCompanyProfile(t))),
      ]);

      const profileMap = new Map<string, { name: string; sector: string; logo: string }>();
      profileResults.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          profileMap.set(tickers[i], {
            name: r.value.name,
            sector: r.value.sector,
            logo: r.value.logo,
          });
        }
      });

      const holdings: Holding[] = [];
      for (const [ticker, raw] of rawHoldings.entries()) {
        const quote = quotesMap.get(ticker);
        const profile = profileMap.get(ticker);
        const currentPrice = quote?.price ?? raw.avgCost;
        const currentValue = currentPrice * raw.quantity;
        const gain = currentValue - raw.totalCost;
        const gainPercent = raw.totalCost > 0 ? (gain / raw.totalCost) * 100 : 0;
        holdings.push({
          ticker,
          companyName: profile?.name ?? ticker,
          sector: profile?.sector ?? 'Unknown',
          quantity: raw.quantity,
          avgCost: raw.avgCost,
          totalCost: raw.totalCost,
          currentPrice,
          currentValue,
          gain,
          gainPercent,
          dayChange: quote?.change ?? 0,
          dayChangePercent: quote?.changePercent ?? 0,
          logo: profile?.logo,
        });
      }

      holdings.sort((a, b) => b.currentValue - a.currentValue);

      set({
        holdings,
        quotes: quotesMap,
        quotesLoading: false,
        stats: computeStats(holdings),
      });
    },

    // ─── Portfolio Stats ──────────────────────────────────────────────────────
    stats: {
      totalValue: 0,
      totalCost: 0,
      totalGain: 0,
      totalGainPercent: 0,
      dayGain: 0,
      dayGainPercent: 0,
      holdingsCount: 0,
    },

    // ─── Watchlist ────────────────────────────────────────────────────────────
    watchlist: [],
    setWatchlist: (watchlist) => set({ watchlist }),
    addToWatchlist: (ticker) =>
      set((s) => ({ watchlist: s.watchlist.includes(ticker) ? s.watchlist : [...s.watchlist, ticker] })),
    removeFromWatchlist: (ticker) =>
      set((s) => ({ watchlist: s.watchlist.filter((t) => t !== ticker) })),
  }))
);

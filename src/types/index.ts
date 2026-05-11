// ─── User ────────────────────────────────────────────────────────────────────
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export type TransactionType = 'buy' | 'sell';

export interface Transaction {
  id?: string;
  ticker: string;
  companyName?: string;
  type: TransactionType;
  quantity: number;
  price: number;
  date: string;        // ISO date string YYYY-MM-DD
  commission: number;
  notes: string;
  userId: string;
  createdAt: number;   // timestamp ms
}

// ─── Holdings ────────────────────────────────────────────────────────────────
export interface Holding {
  ticker: string;
  companyName: string;
  sector: string;
  quantity: number;
  avgCost: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  gain: number;
  gainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  logo?: string;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayGain: number;
  dayGainPercent: number;
  holdingsCount: number;
}

export interface PortfolioSnapshot {
  date: string;
  value: number;
}

// ─── Market Data ─────────────────────────────────────────────────────────────
export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number;
  marketCap?: number;
  timestamp: number;
}

export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyProfile {
  ticker: string;
  name: string;
  exchange: string;
  industry: string;
  sector: string;
  description: string;
  marketCap: number;
  website: string;
  logo: string;
  country: string;
  employees: number;
  pe?: number;
  eps?: number;
  beta?: number;
  '52wHigh'?: number;
  '52wLow'?: number;
}

// ─── News ────────────────────────────────────────────────────────────────────
export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image?: string;
  related: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// ─── AI ──────────────────────────────────────────────────────────────────────
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIAnalysis {
  riskScore: number;       // 1-10
  diversification: string; // 'Poor' | 'Fair' | 'Good' | 'Excellent'
  topRisk: string;
  topOpportunity: string;
  summary: string;
  lastUpdated: number;
}

// ─── Search ───────────────────────────────────────────────────────────────────
export interface StockSearchResult {
  ticker: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

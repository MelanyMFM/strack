import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { usePortfolioStore } from './store/portfolioStore';
import { upsertUser } from './services/dbService';
import { getWatchlist } from './services/dbService';

// Pages
import { AuthPage } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Portfolio } from './pages/Portfolio';
import { Transactions } from './pages/Transactions';
import { Markets } from './pages/Markets';
import { AIAnalyst } from './pages/AIAnalyst';
import { StockDetail } from './pages/StockDetail';

// Layout
import { Layout } from './components/layout/Layout';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = usePortfolioStore();

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(34,211,238,0.3)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--accent-cyan)' }}
              className="animate-pulse"
            >
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading EquityLens…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const { setUser, setAuthLoading, setWatchlist } = usePortfolioStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUser(appUser);
        // Create user doc if new
        await upsertUser(appUser).catch(console.error);
        // Load watchlist
        const wl = await getWatchlist(firebaseUser.uid).catch(() => []);
        setWatchlist(wl);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/ai-analyst" element={<AIAnalyst />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
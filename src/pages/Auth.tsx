import { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../lib/firebase';
import { usePortfolioStore } from '../store/portfolioStore';
import { Zap, TrendingUp, Shield, BrainCircuit, Loader2 } from 'lucide-react';

const FEATURES = [
  { icon: TrendingUp, title: 'Real-time tracking', desc: 'Live prices, P&L, and portfolio performance' },
  { icon: Shield, title: 'Cloud sync', desc: 'Your data securely stored in Firebase, accessible anywhere' },
  { icon: BrainCircuit, title: 'AI Analysis', desc: 'Powered by Gemini — get intelligent portfolio insights' },
];

export function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = usePortfolioStore();

  // When onAuthStateChanged fires (even after COOP interrupts the popup),
  // detect the user and redirect immediately.
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const msg  = err instanceof Error ? err.message : String(err);
      if (!code.includes('popup-closed') && !code.includes('cancelled') && !msg.includes('window.close')) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22d3ee, #818cf8)', transform: 'translate(30%, -30%)' }} />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(34,211,238,0.3)' }}>
            <Zap size={20} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>EquityLens</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Investment Portfolio Tracker</div>
          </div>
        </div>
        <div>
          <h1 className="font-display font-bold text-4xl leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Track your wealth<br /><span className="gradient-text">with precision.</span>
          </h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)', maxWidth: 380 }}>
            A professional-grade portfolio tracker with real-time market data, performance analytics, and AI-powered insights.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <Icon size={16} style={{ color: 'var(--accent-cyan)' }} />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2025 EquityLens. Not financial advice.</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(34,211,238,0.3)' }}>
              <Zap size={16} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <span className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>EquityLens</span>
          </div>

          <h2 className="font-display font-semibold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Sign in to access your portfolio dashboard</p>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
              : <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            }
            {loading ? 'Abriendo Google…' : 'Continue with Google'}
          </button>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </div>
          )}

          <p className="mt-6 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            By signing in you agree to our Terms of Service.<br />
            Your data is stored in Firebase and encrypted in transit.
          </p>
        </div>
      </div>
    </div>
  );
}
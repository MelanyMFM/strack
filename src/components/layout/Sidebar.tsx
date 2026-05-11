import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  TrendingUp,
  BrainCircuit,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { usePortfolioStore } from '../../store/portfolioStore';
import { formatCurrency } from '../../lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/markets', icon: TrendingUp, label: 'Markets' },
  { to: '/ai-analyst', icon: BrainCircuit, label: 'AI Analyst' },
];

export function Sidebar() {
  const { user, stats } = usePortfolioStore();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-40"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(34,211,238,0.3)' }}
        >
          <Zap size={16} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <div>
          <div className="font-display font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>
            EquityLens
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Portfolio Tracker
          </div>
        </div>
      </div>

      {/* Portfolio value summary */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Total Value
        </div>
        <div className="font-mono-num font-medium text-xl" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(stats.totalValue)}
        </div>
        <div
          className="font-mono-num text-xs mt-0.5"
          style={{ color: stats.dayGain >= 0 ? 'var(--success)' : 'var(--danger)' }}
        >
          {stats.dayGain >= 0 ? '+' : ''}
          {formatCurrency(stats.dayGain)} today
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? 'nav-active' : 'text-secondary hover:bg-elevated hover:text-primary'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {}
                : {
                    color: 'var(--text-secondary)',
                  }
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} style={{ color: isActive ? 'var(--accent-cyan)' : 'inherit' }} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Settings size={16} />
          Settings
        </NavLink>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}
            >
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.displayName || 'User'}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1 rounded-md transition-colors hover:bg-elevated"
            style={{ color: 'var(--text-muted)' }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

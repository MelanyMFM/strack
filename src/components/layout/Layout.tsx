import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/portfolio': 'Portfolio',
  '/transactions': 'Transactions',
  '/markets': 'Markets',
  '/ai-analyst': 'AI Analyst',
  '/settings': 'Settings',
};

export function Layout() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k)) || ''] || 'EquityLens';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60 overflow-hidden">
        <Navbar title={title} />
        <main
          className="flex-1 overflow-y-auto mt-14 p-6"
          style={{ background: 'var(--bg-base)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

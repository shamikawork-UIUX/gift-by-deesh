import { useEffect, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2, SearchX, ShieldOff } from 'lucide-react';
import type { Permission } from './lib/api';
import { useCan, useSession } from './lib/session';
import { Shell } from './Shell';
import { ForcePassword, Login, Setup } from './pages/Auth';
import { Overview } from './pages/Overview';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { OrderNew } from './pages/OrderNew';
import { Products } from './pages/Products';
import { ProductEdit } from './pages/ProductEdit';
import { Customers } from './pages/Customers';
import { Reminders } from './pages/Reminders';
import { Team } from './pages/Team';
import { Settings } from './pages/Settings';
import { Activity } from './pages/Activity';
import { Account } from './pages/Account';
import { Button, EmptyState, btn } from './ui/ui';
import './admin.css';

/** Route guard: explains (instead of a blank page) when someone opens a link their role can't use. */
function Need({ perm, children }: { perm: Permission; children: ReactNode }) {
  const can = useCan();
  if (can(perm)) return <>{children}</>;
  return (
    <EmptyState
      icon={ShieldOff}
      title="This page isn't part of your role"
      text="Ask the shop owner if you need access. Everything you can use is in the menu."
      action={<Link to="/admin" className={btn('primary')}>Go to overview</Link>}
    />
  );
}

export default function AdminApp() {
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const check = useSession((s) => s.check);

  useEffect(() => { void check(); }, [check]);

  // Keep the dashboard out of search engines and give it its own theme colour.
  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    document.body.classList.add('admin-body');
    return () => { robots.remove(); document.body.classList.remove('admin-body'); };
  }, []);

  if (status === 'loading') {
    return <div className="a-boot" role="status"><Loader2 className="a-spin" size={28} aria-hidden="true" /><span>Loading dashboard…</span></div>;
  }
  if (status === 'error') {
    return (
      <div className="a-boot" role="alert">
        <strong>Can't reach the server</strong>
        <span>Check your connection. If you run the shop locally, make sure <code>npm run api</code> is running.</span>
        <Button variant="primary" onClick={() => void check()}>Try again</Button>
      </div>
    );
  }
  if (status === 'setup') return <Setup />;
  if (status === 'signed-out' || !user) return <Login />;
  if (user.mustChangePassword) return <ForcePassword />;

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Need perm="orders.view"><Overview /></Need>} />
        <Route path="orders" element={<Need perm="orders.view"><Orders /></Need>} />
        <Route path="orders/new" element={<Need perm="orders.edit"><OrderNew /></Need>} />
        <Route path="orders/:ref" element={<Need perm="orders.view"><OrderDetail /></Need>} />
        <Route path="products" element={<Need perm="products.view"><Products /></Need>} />
        <Route path="products/new" element={<Need perm="products.edit"><ProductEdit /></Need>} />
        <Route path="products/:id" element={<Need perm="products.view"><ProductEdit /></Need>} />
        <Route path="customers" element={<Need perm="customers.view"><Customers /></Need>} />
        <Route path="reminders" element={<Need perm="reminders.view"><Reminders /></Need>} />
        <Route path="team" element={<Need perm="team.manage"><Team /></Need>} />
        <Route path="settings" element={<Need perm="settings.edit"><Settings /></Need>} />
        <Route path="activity" element={<Need perm="activity.view"><Activity /></Need>} />
        <Route path="account" element={<Account />} />
        <Route path="login" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<EmptyState icon={SearchX} title="Page not found" text="That link doesn't go anywhere in the dashboard." action={<Link to="/admin" className={btn('primary')}>Go to overview</Link>} />} />
      </Route>
    </Routes>
  );
}

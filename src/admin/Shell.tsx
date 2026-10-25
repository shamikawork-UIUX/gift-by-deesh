import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BellRing, ClipboardList, ExternalLink, History, LayoutDashboard, LogOut, Menu, Package, Settings, UserCog, UserRound, Users, X, type LucideIcon,
} from 'lucide-react';
import type { Permission } from './lib/api';
import { roleInfo, useCan, useSession } from './lib/session';
import { useApi } from './lib/useApi';
import { Toaster } from './ui/toast';
import { useExit, useFocusTrap } from '../hooks/useDialog';
import { LogoMark } from '../components/Logo';

interface NavItem { to: string; label: string; icon: LucideIcon; perm: Permission; end?: boolean; badge?: boolean }

/** Grouped the way the shop works: selling first, then the catalogue, then running the business. */
const groups: { label: string; items: NavItem[] }[] = [
  { label: '', items: [{ to: '/admin', label: 'Overview', icon: LayoutDashboard, perm: 'orders.view', end: true }] },
  { label: 'Sales', items: [
    { to: '/admin/orders', label: 'Orders', icon: ClipboardList, perm: 'orders.view', badge: true },
    { to: '/admin/customers', label: 'Customers', icon: Users, perm: 'customers.view' },
  ] },
  { label: 'Catalogue', items: [{ to: '/admin/products', label: 'Products', icon: Package, perm: 'products.view' }] },
  { label: 'Marketing', items: [{ to: '/admin/reminders', label: 'Reminders', icon: BellRing, perm: 'reminders.view' }] },
  { label: 'Admin', items: [
    { to: '/admin/team', label: 'Team & roles', icon: UserCog, perm: 'team.manage' },
    { to: '/admin/settings', label: 'Shop settings', icon: Settings, perm: 'settings.edit' },
    { to: '/admin/activity', label: 'Activity log', icon: History, perm: 'activity.view' },
  ] },
];
const all = groups.flatMap((g) => g.items);
const TAB_PATHS = ['/admin', '/admin/orders', '/admin/products', '/admin/customers'];

/** Task screens (an order, a form) get the whole phone screen: no tab bar, a Back button instead. */
const isTaskScreen = (path: string) => /^\/admin\/(orders|products)\/.+/.test(path);

export function Shell() {
  const can = useCan();
  const user = useSession((s) => s.user)!;
  const signOut = useSession((s) => s.signOut);
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const pulse = useApi<{ newOrders: number }>('/pulse', { pollMs: 30_000 });
  const newOrders = pulse.data?.newOrders ?? 0;
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);
  const reloadPulse = pulse.reload;

  useEffect(() => {
    const on = () => void reloadPulse(true);
    window.addEventListener('admin:pulse', on);
    return () => window.removeEventListener('admin:pulse', on);
  }, [reloadPulse]);

  // Refresh the badge when moving around (e.g. right after confirming an order) and start screen readers on the new page.
  useEffect(() => {
    void pulse.reload(true);
    setMoreOpen(false);
    if (first.current) { first.current = false; return; }
    if (!mainRef.current?.contains(document.activeElement)) mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  const visible = all.filter((i) => can(i.perm));
  const tabs = visible.filter((i) => TAB_PATHS.includes(i.to));
  const moreItems = visible.filter((i) => !TAB_PATHS.includes(i.to));
  const moreActive = moreItems.some((i) => pathname.startsWith(i.to)) || pathname.startsWith('/admin/account');
  const task = isTaskScreen(pathname);

  const badge = (i: NavItem) => (i.badge && newOrders > 0 ? <span className="a-nav-badge" aria-label={`${newOrders} new`}>{newOrders}</span> : null);

  return (
    <div className={`a-app ${task ? 'is-task' : ''}`}>
      <a href="#admin-main" className="skip-link">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="a-side" aria-label="Dashboard">
        <Link to="/admin" className="a-brand">
          <LogoMark />
          <span><strong>GiftsByDeesh</strong><small>Admin</small></span>
        </Link>
        <nav aria-label="Main">
          {groups.map((g) => {
            const items = g.items.filter((i) => can(i.perm));
            if (!items.length) return null;
            return (
              <div key={g.label || 'top'} className="a-nav-group">
                {g.label && <div className="a-nav-label">{g.label}</div>}
                {items.map((i) => (
                  <NavLink key={i.to} to={i.to} end={i.end} className="a-nav-item">
                    <i.icon size={20} aria-hidden="true" />
                    <span>{i.label}</span>
                    {badge(i)}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="a-side-foot">
          <a href="/" target="_blank" rel="noopener" className="a-nav-item">
            <ExternalLink size={20} aria-hidden="true" /><span>View website</span>
          </a>
          <NavLink to="/admin/account" className="a-me">
            <span className="a-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
            <span><strong>{user.name}</strong><small>{roleInfo[user.role].label} · My account</small></span>
          </NavLink>
          <button className="a-nav-item" onClick={() => void signOut()}>
            <LogOut size={20} aria-hidden="true" /><span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Phone / tablet top bar */}
      {!task && (
        <header className="a-topbar">
          <Link to="/admin" className="a-brand a-brand-sm" aria-label="GiftsByDeesh admin home">
            <LogoMark />
            <span><strong>GiftsByDeesh</strong><small>Admin</small></span>
          </Link>
          <Link to="/admin/account" className="a-avatar" aria-label={`My account (${user.name})`}>{user.name.slice(0, 1).toUpperCase()}</Link>
        </header>
      )}

      <main id="admin-main" ref={mainRef} tabIndex={-1} className="a-main">
        <Outlet />
      </main>

      {/* Phone / tablet bottom tabs */}
      {!task && (
        <nav className="a-tabbar" aria-label="Main">
          {tabs.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className="a-tab">
              <span className="a-tab-ic"><i.icon size={22} aria-hidden="true" />{badge(i)}</span>
              <span>{i.label}</span>
            </NavLink>
          ))}
          <button className={`a-tab ${moreActive ? 'active' : ''}`} aria-haspopup="dialog" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)}>
            <span className="a-tab-ic"><Menu size={22} aria-hidden="true" /></span>
            <span>More</span>
          </button>
        </nav>
      )}

      {moreOpen && <MoreSheet items={moreItems} onClose={() => setMoreOpen(false)} onSignOut={() => void signOut()} />}
      <Toaster />
    </div>
  );
}

function MoreSheet({ items, onClose, onSignOut }: { items: NavItem[]; onClose: () => void; onSignOut: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [closing, requestClose] = useExit(onClose, 200);
  useFocusTrap(ref, requestClose);
  const user = useSession((s) => s.user)!;
  return (
    <div className={`a-sheet-layer ${closing ? 'closing' : ''}`}>
      <button className="a-modal-back" aria-label="Close menu" tabIndex={-1} onClick={requestClose} />
      <div ref={ref} className="a-sheet" role="dialog" aria-modal="true" aria-label="More">
        <div className="a-sheet-head">
          <div className="a-me a-me-static">
            <span className="a-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
            <span><strong>{user.name}</strong><small>{roleInfo[user.role].label}</small></span>
          </div>
          <button className="a-icon-btn" aria-label="Close menu" onClick={requestClose}><X size={20} aria-hidden="true" /></button>
        </div>
        <nav aria-label="More">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} className="a-sheet-item">
              <i.icon size={22} aria-hidden="true" /><span>{i.label}</span>
            </NavLink>
          ))}
          <NavLink to="/admin/account" className="a-sheet-item"><UserRound size={22} aria-hidden="true" /><span>My account</span></NavLink>
          <a href="/" target="_blank" rel="noopener" className="a-sheet-item"><ExternalLink size={22} aria-hidden="true" /><span>View website</span></a>
          <button className="a-sheet-item" onClick={onSignOut}><LogOut size={22} aria-hidden="true" /><span>Sign out</span></button>
        </nav>
      </div>
    </div>
  );
}

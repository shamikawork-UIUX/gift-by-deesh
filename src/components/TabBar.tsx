import { NavLink } from 'react-router-dom';
import { BadgePercent, Gift, Heart, House, type LucideIcon } from 'lucide-react';
import './TabBar.css';

const tabs: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/shop', label: 'Shop', icon: Gift },
  { to: '/offers', label: 'Offers', icon: BadgePercent },
  { to: '/about', label: 'About', icon: Heart },
];

/** Thumb-reach navigation for phones and small tablets. The basket stays in the header. */
export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `tab-item ${isActive ? 'on' : ''}`}>
          <span className="tab-ic"><Icon size={22} strokeWidth={2.1} aria-hidden="true" /></span>
          <span className="tab-l">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

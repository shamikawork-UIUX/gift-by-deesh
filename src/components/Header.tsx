import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBasket } from 'lucide-react';
import { navLinks, site } from '../data/site';
import { cartCount, useCart } from '../store/cart';
import { useFly } from '../store/fly';
import { flip } from '../lib/format';
import { LogoMark, Wordmark } from './Logo';
import './Header.css';

export function Header() {
  const [shrunk, setShrunk] = useState(false);
  const count = useCart((s) => cartCount(s.lines));
  const bump = useCart((s) => s.bump);
  const lastAdd = useCart((s) => s.lastAdd);
  const openCart = useCart((s) => s.open);
  const setBasketEl = useFly((s) => s.setBasketEl);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (to: string) => {
    const [path, query] = to.split('?');
    if (query) return location.pathname === path && location.search === `?${query}`;
    if (path === '/shop') return location.pathname === '/shop' && !location.search.includes('vibe=');
    return location.pathname === path;
  };

  return (
    <header className={`site-head ${shrunk ? 'shrunk' : ''}`}>
      <div className="head-in">
        <Link to="/" className="logo" aria-label={`${site.name} home`}>
          <LogoMark />
          <span className="logo-text">
            <Wordmark />
            <span className="logo-sub">{site.company}</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className={isActive(l.to) ? 'active' : ''} aria-current={isActive(l.to) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="head-actions">
          <Link to="/shop" className="head-icon" aria-label="Search gifts">
            <Search size={20} aria-hidden="true" />
          </Link>
          <button
            ref={setBasketEl}
            className={`cart-btn ${flip(bump, 'cA', 'cB')}`}
            onClick={openCart}
            aria-label={`Basket, ${count} ${count === 1 ? 'item' : 'items'}`}
          >
            <span className="plus1" aria-hidden="true">+{lastAdd}</span>
            <ShoppingBasket size={21} aria-hidden="true" />
            {count > 0 && <span className={`badge ${flip(bump, 'bA', 'bB')}`} aria-hidden="true">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

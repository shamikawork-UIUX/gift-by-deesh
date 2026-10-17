import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { announcements } from '../data/site';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { FlyLayer } from './FlyLayer';
import { HintOverlay } from './HintOverlay';
import { TabBar } from './TabBar';

/** Scrolls to top on page change, or to #hash targets (e.g. /#build). */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <ScrollManager />
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="announce">{announcements[pathname] ?? announcements['/']}</div>
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer note={pathname === '/offers' ? "Offers can't be combined unless stated." : undefined} />
      <TabBar />
      <CartDrawer />
      <FlyLayer />
      <HintOverlay />
    </>
  );
}

import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { announcements, notFoundTitle, pageTitles } from '../data/site';
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

/** Sets the tab title per route and, after client-side navigation, moves focus to <main> so screen readers start on the new page. */
function RouteAnnouncer() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    document.title = pageTitles[pathname] ?? notFoundTitle;
    if (first.current) { first.current = false; return; }
    const main = document.getElementById('main');
    if (main && !main.contains(document.activeElement)) main.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

export function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <ScrollManager />
      <RouteAnnouncer />
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

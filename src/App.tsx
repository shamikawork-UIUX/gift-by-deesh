import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/home/HomePage';
import { ShopPage } from './pages/shop/ShopPage';
import { OffersPage } from './pages/offers/OffersPage';
import { AboutPage } from './pages/about/AboutPage';
import { NotFound } from './pages/NotFound';

// The dashboard is its own bundle, so shoppers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <Routes>
      <Route path="admin/*" element={<Suspense fallback={<div className="a-boot" role="status">Loading dashboard…</div>}><AdminApp /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

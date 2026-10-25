import { create } from 'zustand';
import { products as builtInProducts, type Product } from '../data/products';
import { coupon, offerEnd, weeklyOffer } from '../data/offers';
import { site } from '../data/site';

/** Shop details the owner can change in the admin dashboard (Settings). */
export interface ShopSettings {
  shopHours: string;
  cutoffTime: string;
  cutoffArea: string;
  deliveryDays: string;
  orderWhatsApp: string;
  weeklyOfferTitle: string;
  weeklyOfferBadge: string;
  /** Sri Lanka local time, "2026-10-31T23:59" */
  offerEnd: string;
  couponCode: string;
  couponLabel: string;
  couponShort: string;
}

/** Used until /api/catalog answers (and if the API is down), so the shop always renders. */
const builtInSettings: ShopSettings = {
  shopHours: site.hours,
  cutoffTime: site.cutoff.time,
  cutoffArea: site.cutoff.area,
  deliveryDays: '[X–Y]',
  orderWhatsApp: site.orderWhatsApp,
  weeklyOfferTitle: weeklyOffer.title,
  weeklyOfferBadge: weeklyOffer.badge,
  offerEnd: offerEnd.slice(0, 16),
  couponCode: coupon.code,
  couponLabel: coupon.label,
  couponShort: coupon.short,
};

interface CatalogState {
  products: Product[];
  settings: ShopSettings;
  loaded: boolean;
  load: () => Promise<void>;
}

export const useCatalog = create<CatalogState>()((set, get) => ({
  products: builtInProducts,
  settings: builtInSettings,
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch('/api/catalog');
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { products: Product[]; settings: ShopSettings };
      set({ products: data.products, settings: { ...builtInSettings, ...data.settings }, loaded: true });
    } catch {
      set({ loaded: true }); // keep the built-in catalogue
    }
  },
}));

export const useProducts = () => useCatalog((s) => s.products);
export const useSettings = () => useCatalog((s) => s.settings);
export const useProduct = (id: string) => useCatalog((s) => s.products.find((p) => p.id === id));

/** Offer end as an absolute time (settings store Sri Lanka local time). */
export const offerEndIso = (s: ShopSettings) => `${s.offerEnd}:00+05:30`;

/** Replaces [TIME], [AREA], [X–Y] tokens in static copy (e.g. FAQs) with the current settings. */
export const fillSettings = (text: string, s: ShopSettings) =>
  text.split('[TIME]').join(s.cutoffTime).split('[AREA]').join(s.cutoffArea).split('[X–Y]').join(s.deliveryDays);

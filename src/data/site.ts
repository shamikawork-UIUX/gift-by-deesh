export const site = {
  name: 'GiftsByDeesh',
  company: 'House of Deesh (Pvt) Ltd',
  year: 2026,
  /** Orders from the cart go to this WhatsApp number. */
  orderWhatsApp: '94721770653',
  contacts: {
    gifts: { label: 'Gifts & teddies', number: '072 177 0653', wa: '94721770653' },
    chocolate: { label: 'Chocolate orders', number: '072 896 2797', wa: '94728962797' },
  },
  instagram: { handle: '@gifts_by_deesh', url: 'https://www.instagram.com/gifts_by_deesh/' },
  tiktok: { handle: '@giftsbydeesh', url: 'https://www.tiktok.com/@giftsbydeesh' },
  hours: 'Open [DAYS], [HOURS]',
  cutoff: { time: '[TIME]', area: '[AREA]' },
};

export const announcements: Record<string, string> = {
  '/': 'Thoughtful gifts, delivered with love across Sri Lanka',
  '/shop': `Order by ${site.cutoff.time} for next-day delivery in ${site.cutoff.area}`,
  '/offers': 'Bouquet Week is on · plus a surprise deal hiding in the gift box below',
  '/about': 'Thoughtful gifts, delivered with love across Sri Lanka',
};

/** Browser tab titles per route. */
export const pageTitles: Record<string, string> = {
  '/': 'GiftsByDeesh — Thoughtful gifts, delivered with love',
  '/shop': 'Shop Gifts · GiftsByDeesh',
  '/offers': 'Offers & Deals · GiftsByDeesh',
  '/about': 'About & Contact · GiftsByDeesh',
};
export const notFoundTitle = 'Page not found · GiftsByDeesh';

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop Gifts' },
  { to: '/shop?vibe=sweet', label: 'Chocolate Bouquets' },
  { to: '/shop?vibe=cuddly', label: 'Teddy Bears' },
  { to: '/offers', label: 'Offers' },
  { to: '/about', label: 'About Us' },
];

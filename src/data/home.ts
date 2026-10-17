export const favouriteTabs = [
  { id: 'best', label: 'Bestsellers', items: [
    { id: 'kjb', badge: 'Bestseller' }, { id: 'gtb', badge: 'Bestseller' }, { id: 'kgb' },
    { id: 'hws' }, { id: 'fhb' }, { id: 'apl' },
  ] },
  { id: 'fresh', label: 'New in', items: [
    { id: 'apl', badge: 'New' }, { id: 'fhb', badge: 'New' }, { id: 'kgb', badge: 'New' }, { id: 'mtd', badge: 'New' },
  ] },
  { id: 'under', label: 'Under LKR 5,000', items: [
    { id: 'kjb', badge: 'Bestseller' }, { id: 'kgb' }, { id: 'mtd' }, { id: 'apl' },
  ] },
] as const;

export const homeOccasions = [
  { title: 'Birthday surprises', sub: 'Make their day unforgettable.', photo: 'Photo — birthday table with balloons & bouquet', tint: '#F7D3DE', chips: ['Kinder bouquets', 'Balloon add-on', 'Teddy + card'], cta: 'Shop birthday', to: '/shop?occ=birthday' },
  { title: 'Gifts for her', sub: 'Sweet, soft and full of love.', photo: 'Photo — bouquet held in hands', tint: '#EADDF2', chips: ['Ferrero hearts', 'Pink bouquets', 'Plushies'], cta: 'Shop for her', to: '/shop?who=her' },
  { title: 'Gifts for him', sub: "Treats and toys he'll love.", photo: 'Photo — navy gift box & Hot Wheels', tint: '#DCE4F3', chips: ['Hot Wheels sets', 'Chocolate boxes', 'Snack hampers'], cta: 'Shop for him', to: '/shop?who=him' },
  { title: 'Just because', sub: 'No reason needed to smile.', photo: 'Photo — teddy in a gift bag on a sofa', tint: '#FCE6CF', chips: ['Under LKR 5,000', 'Mini teddies', 'Kinder boxes'], cta: 'Shop small joys', to: '/shop?occ=just' },
];

export const reels = [
  { title: '75 pcs Kinder Joy bouquet', len: '0:32', tint: '#F2BDCD' },
  { title: 'Meet our giant teddy', len: '0:21', tint: '#F6D7AE' },
  { title: 'Avocado plushie unboxing', len: '0:18', tint: '#BFE2CF' },
  { title: 'Ferrero heart box wrap', len: '0:40', tint: '#DCC8D0' },
  { title: 'Hot Wheels gift set', len: '0:25', tint: '#C3CFEA' },
];

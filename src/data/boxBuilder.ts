import type { Shape } from '../components/Shapes';

// "Pack a gift box" builder. Prices are SAMPLE values.

export const boxSizes = [
  { id: 's', label: 'Small', cap: 4, cols: 2, price: 800 },
  { id: 'm', label: 'Medium', cap: 6, cols: 3, price: 1200 },
  { id: 'l', label: 'Large', cap: 9, cols: 3, price: 1600 },
] as const;
export type BoxSizeId = (typeof boxSizes)[number]['id'];

export type BoxCategory = 'choc' | 'plush' | 'toys';

export interface BoxItem {
  id: string;
  name: string;
  cat: BoxCategory;
  price: number;
  shape: Shape;
  c1: string;
  tint: string;
}

export const boxItems: BoxItem[] = [
  { id: 'kj', name: 'Kinder Joy', cat: 'choc', price: 450, shape: 'egg', c1: '#E8463B', tint: '#FDE7E4' },
  { id: 'kb', name: 'Kinder Bueno', cat: 'choc', price: 350, shape: 'bar', c1: '#7A4528', tint: '#F6E7D3' },
  { id: 'fr', name: 'Ferrero Rocher · 3 pc', cat: 'choc', price: 900, shape: 'ball', c1: '#D9A441', tint: '#FBF0D2' },
  { id: 'cb', name: 'Chocolate Bar', cat: 'choc', price: 500, shape: 'bar', c1: '#5B2A86', tint: '#EDE3F6' },
  { id: 'mt', name: 'Mini Teddy', cat: 'plush', price: 1500, shape: 'teddy', c1: '#C68E5E', tint: '#F4E6D6' },
  { id: 'pt', name: 'Pink Teddy', cat: 'plush', price: 1500, shape: 'teddy', c1: '#EFA3BB', tint: '#FCE4EC' },
  { id: 'av', name: 'Avocado Plushie', cat: 'plush', price: 1800, shape: 'avo', c1: '#5E8C3A', tint: '#DDEFE3' },
  { id: 'hw', name: 'Hot Wheels Car', cat: 'toys', price: 650, shape: 'car', c1: '#E8463B', tint: '#DCE4F3' },
];

export const boxCategories: { id: BoxCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'choc', label: 'Chocolates' },
  { id: 'plush', label: 'Plushies' },
  { id: 'toys', label: 'Toys' },
];

export const wraps = [
  { id: 'blush', label: 'Blush pink', box: '#F2B4C8', tray: '#FDEAF0', ribbon: '#D6245F' },
  { id: 'kraft', label: 'Kraft', box: '#D9B48A', tray: '#F6EADB', ribbon: '#8A4B2A' },
  { id: 'navy', label: 'Midnight', box: '#2A3058', tray: '#EEF0F8', ribbon: '#F2B4C8' },
  { id: 'mint', label: 'Mint', box: '#A8D8C2', tray: '#EAF6F0', ribbon: '#2E7D5B' },
] as const;
export type WrapId = (typeof wraps)[number]['id'];

export const TAG_MAX = 40;

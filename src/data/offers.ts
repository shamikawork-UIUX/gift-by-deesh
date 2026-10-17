import type { Shape } from '../components/Shapes';

/** "Bouquet Week" countdown end (Sri Lanka time). */
export const offerEnd = '2026-10-31T23:59:00+05:30';
export const weeklyOffer = { tag: 'THIS WEEK', title: 'Bouquet Week · 15% off all bouquets', badge: '15%' };

export const coupon = { code: 'SWEET10', label: '10% off your first order', short: '10%' };

/** Set to true once WhatsApp reminders are supported. */
export const whatsappReminders = false;

export interface Combo {
  id: string;
  name: string;
  desc: string;
  was: number;
  now: number;
  tint: string;
  a: { shape: Shape; bg: string };
  b: { shape: Shape; bg: string };
}

export const combos: Combo[] = [
  { id: 'sweet', name: 'The Sweetheart', desc: 'Kinder Joy Bouquet + Pink Mini Teddy. Instant heart-eyes.', was: 5500, now: 4900, tint: '#FDE7EE', a: { shape: 'egg', bg: '#FDE7E4' }, b: { shape: 'teddy-pink', bg: '#FCE4EC' } },
  { id: 'bday', name: 'Birthday Bash', desc: 'Kinder Gift Box + a helium balloon. Party in a box.', was: 4250, now: 3800, tint: '#E9F0FB', a: { shape: 'box', bg: '#FFFFFF' }, b: { shape: 'balloon', bg: '#DCE6F8' } },
  { id: 'racer', name: 'Little Racer', desc: 'Hot Wheels Gift Set + 3 Kinder Joys. Vroom, then snacks.', was: 6850, now: 6200, tint: '#FFF4E3', a: { shape: 'car', bg: '#DCE4F3' }, b: { shape: 'egg', bg: '#FDE7E4' } },
];

export const calendar = [
  { id: 'val', name: "Valentine's Day", month: 'FEB', day: '14', color: '#D6245F', soft: '#FDE7EE', joke: 'Chocolate says it better than you do.' },
  { id: 'avu', name: 'Sinhala & Tamil New Year', month: 'APR', day: '13', color: '#9A6A12', soft: '#FBF0D2', joke: 'Sweet treats for the whole family table.' },
  { id: 'mom', name: "Mother's Day", month: 'MAY', day: '[DATE]', color: '#7A57A0', soft: '#F1EAF8', joke: 'She deserves more than a phone call.' },
  { id: 'dad', name: "Father's Day", month: 'JUN', day: '[DATE]', color: '#3B6CC0', soft: '#E6EEFA', joke: 'Upgrade from socks this year. Please.' },
  { id: 'xmas', name: 'Christmas', month: 'DEC', day: '25', color: '#2E7D5B', soft: '#E3F2EA', joke: "Santa's taking pre-orders. So are we." },
];
export type CalendarOccasion = (typeof calendar)[number];

export const panicPicks = [
  { id: 'kgb', note: 'Fits every age. Literally everyone.' },
  { id: 'kjb', note: 'Looks like you planned it for weeks.' },
  { id: 'apl', note: 'Weird, cute, unforgettable.' },
];

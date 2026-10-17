// Checkout lives here so a payment gateway can replace WhatsApp later.
// Today: every order is sent to the shop as a pre-written WhatsApp message.

import { site } from '../data/site';
import type { CartLine, PayChoice } from '../store/cart';
import { money } from './format';

export interface Order {
  lines: CartLine[];
  deliveryDate: Date;
  note: string;
  pay: PayChoice;
}

export interface DeliveryOption {
  iso: string;
  /** "Tomorrow", "Mon" … */
  weekday: string;
  /** "17 Oct" */
  day: string;
  /** "Saturday 17 October" */
  full: string;
  date: Date;
}

/** "Saturday 17 October" */
export const fullDate = (d: Date) =>
  `${d.toLocaleDateString('en-GB', { weekday: 'long' })} ${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'long' })}`;

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The next five days, starting tomorrow. */
export function deliveryOptions(from = new Date()): DeliveryOption[] {
  const out: DeliveryOption[] = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    out.push({
      iso: toIso(d),
      weekday: i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' }),
      day: `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}`,
      full: fullDate(d),
      date: d,
    });
  }
  return out;
}

export function orderTotal(lines: CartLine[]) {
  return lines.reduce((a, l) => a + l.price * l.qty, 0);
}

export function buildOrderMessage(order: Order): string {
  const items = order.lines.map((l, i) => {
    const head = `${i + 1}. ${l.name} × ${l.qty} — ${money(l.price * l.qty)}`;
    const det = l.details?.length ? '\n' + l.details.map((d) => `    • ${d}`).join('\n') : '';
    return head + det;
  });
  const note = order.note.trim();
  return (
    "Hi GiftsByDeesh! I'd like to place an order:\n\n" +
    items.join('\n') +
    `\n\nDelivery date: ${fullDate(order.deliveryDate)}` +
    (note ? `\nGift note: "${note}"` : '') +
    `\nPayment: ${order.pay === 'koko' ? 'KOKO (3 instalments)' : 'Pay in full'}` +
    `\nTotal: ${money(orderTotal(order.lines))} (+ delivery, to be confirmed)`
  );
}

export const whatsAppLink = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

/** Returns the URL the "Send order" button opens. Swap this for a payment gateway later. */
export function checkoutUrl(order: Order): string {
  return whatsAppLink(site.orderWhatsApp, buildOrderMessage(order));
}

// Checkout lives here so a payment gateway can replace WhatsApp later.
// Today: every order is sent to the shop as a pre-written WhatsApp message, and a copy is
// saved (POST /api/orders) so it shows up in the admin dashboard under the same reference.

import type { CartLine, PayChoice } from '../store/cart';
import { money } from './format';

export interface Order {
  /** "GBD-7K3Q9X" — printed in the WhatsApp message so the shop can match the chat to the saved order */
  ref: string;
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

/** New order reference. Created in the browser so WhatsApp can open instantly (no waiting for the server). */
export function newOrderRef() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return 'GBD-' + Array.from(bytes, (b) => abc[b % abc.length]).join('');
}

export function buildOrderMessage(order: Order): string {
  const items = order.lines.map((l, i) => {
    const head = `${i + 1}. ${l.name} × ${l.qty} — ${money(l.price * l.qty)}`;
    const det = l.details?.length ? '\n' + l.details.map((d) => `    • ${d}`).join('\n') : '';
    return head + det;
  });
  const note = order.note.trim();
  return (
    `Hi GiftsByDeesh! I'd like to place an order (ref ${order.ref}):\n\n` +
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
export function checkoutUrl(order: Order, shopWhatsApp: string): string {
  return whatsAppLink(shopWhatsApp, buildOrderMessage(order));
}

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Saves a copy of the order for the dashboard. Fire-and-forget with `keepalive`, so it still
 * goes through while the browser switches to WhatsApp. The WhatsApp message is what counts:
 * if this fails, staff can add the order by hand from the chat.
 */
export function recordOrder(order: Order) {
  try {
    void fetch('/api/orders', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: order.ref,
        lines: order.lines.map((l) => ({ name: l.name, price: l.price, qty: l.qty, details: l.details ?? [] })),
        deliveryDate: isoDay(order.deliveryDate),
        note: order.note.trim(),
        pay: order.pay,
      }),
    }).catch(() => {});
  } catch { /* never block checkout */ }
}

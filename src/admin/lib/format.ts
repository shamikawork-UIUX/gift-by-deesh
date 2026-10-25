import type { Order, OrderStatus } from './api';

export { money } from '../../lib/format';

/** "+94 77 123 4567" from "94771234567" */
export const phone = (p: string | null | undefined) =>
  p && /^94\d{9}$/.test(p) ? `+94 ${p.slice(2, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p || '';

/** "071 234 5678" style for editing (what people type). */
export const phoneLocal = (p: string | null | undefined) => (p && /^94\d{9}$/.test(p) ? `0${p.slice(2, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p || '');

/** Today in Sri Lanka as YYYY-MM-DD. */
export const todayLK = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date());

const dayDiff = (iso: string) => Math.round((Date.parse(iso) - Date.parse(todayLK())) / 86_400_000);

/** "Today", "Tomorrow", "Yesterday", or "Sat 24 Oct". */
export function dayLabel(iso: string | null) {
  if (!iso) return 'No date yet';
  const d = dayDiff(iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const isOverdue = (o: Pick<Order, 'deliveryDate' | 'status'>) =>
  !!o.deliveryDate && dayDiff(o.deliveryDate) < 0 && !['delivered', 'cancelled'].includes(o.status);

/** "5 min ago", "3 h ago", "Tue 20 Oct, 14:05" */
export function timeAgo(iso: string) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  return dateTime(iso);
}

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const fullDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

// ---------- order status ----------

export const STATUS_ORDER: OrderStatus[] = ['new', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

export const statusInfo: Record<OrderStatus, { label: string; tone: 'pink' | 'blue' | 'amber' | 'violet' | 'green' | 'grey'; hint: string }> = {
  new: { label: 'New', tone: 'pink', hint: 'Sent from the website. Check the WhatsApp chat, then confirm.' },
  confirmed: { label: 'Confirmed', tone: 'blue', hint: 'Agreed with the customer. Ready to prepare.' },
  preparing: { label: 'Preparing', tone: 'amber', hint: 'Being wrapped and packed.' },
  out_for_delivery: { label: 'Out for delivery', tone: 'violet', hint: 'On the way to the customer.' },
  delivered: { label: 'Delivered', tone: 'green', hint: 'Done. Nothing more to do.' },
  cancelled: { label: 'Cancelled', tone: 'grey', hint: 'Will not be delivered.' },
};

/** The single most likely next step, shown as the main button. */
export const nextStep: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: 'confirmed', label: 'Confirm order' },
  confirmed: { to: 'preparing', label: 'Start preparing' },
  preparing: { to: 'out_for_delivery', label: 'Send out for delivery' },
  out_for_delivery: { to: 'delivered', label: 'Mark as delivered' },
};

export const itemsSummary = (o: Pick<Order, 'items'>) =>
  o.items.map((i) => (i.qty > 1 ? `${i.name} × ${i.qty}` : i.name)).join(', ');

// ---------- WhatsApp templates ----------

export const waLink = (number: string | null, text: string) =>
  `https://wa.me/${number ?? ''}?text=${encodeURIComponent(text)}`;

/** Ready-made messages staff can send from an order. No emoji, matching the shop's voice. */
export function orderTemplates(o: Order) {
  const hi = `Hi${o.customerName ? ` ${o.customerName.split(' ')[0]}` : ''}!`;
  const when = o.deliveryDate ? fullDate(o.deliveryDate) : 'the date we agreed';
  const total = `LKR ${o.total.toLocaleString('en-US')}`;
  const list = o.items.map((i) => `• ${i.name} × ${i.qty}`).join('\n');
  return [
    { id: 'confirm', label: 'Confirm order & total', text: `${hi} Thank you for your order ${o.ref} with GiftsByDeesh.\n\n${list}\n\nTotal: ${total}${o.deliveryFee ? ` (including ${`LKR ${o.deliveryFee.toLocaleString('en-US')}`} delivery)` : ''}\nDelivery: ${when}\n\nCould you please confirm the delivery address and a contact number for the recipient?` },
    { id: 'payment', label: 'Payment details', text: `${hi} For order ${o.ref}, the total is ${total}.${o.payMethod === 'koko' ? ' You chose KOKO — 3 interest-free payments. We\'ll send the KOKO link here.' : ' We\'ll share how to pay right here.'}` },
    { id: 'preparing', label: 'Being wrapped', text: `${hi} Your gift for order ${o.ref} is being hand-wrapped right now. We'll let you know when it's on the way.` },
    { id: 'out', label: 'On the way', text: `${hi} Good news — order ${o.ref} is out for delivery today. The rider will call the recipient before arriving.` },
    { id: 'delivered', label: 'Delivered — thank you', text: `${hi} Order ${o.ref} has been delivered. Thank you for choosing GiftsByDeesh! We'd love to see a photo if they liked it.` },
  ];
}

// ---------- CSV export ----------

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    // Prefix formula-like cells so spreadsheets don't execute them.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

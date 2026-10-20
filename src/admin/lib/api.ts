// Thin fetch wrapper for /api/admin/*. Errors carry the server's human-readable message.

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Set by the session store: called on 401 so the app can show the sign-in screen. */
let onUnauthorised: (() => void) | null = null;
export const setUnauthorisedHandler = (fn: () => void) => { onUnauthorised = fn; };

export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/admin${path}`, {
      method: init.method ?? 'GET',
      credentials: 'same-origin',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, "Can't reach the server. Check your internet connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/login') && !path.startsWith('/session')) onUnauthorised?.();
    throw new ApiError(res.status, (data as { error?: string }).error || 'Something went wrong. Please try again.');
  }
  return data as T;
}

// ---------- shared types (mirror server/routes-admin.mjs) ----------

export type Role = 'owner' | 'manager' | 'staff';
export type Permission =
  | 'orders.view' | 'orders.edit' | 'orders.cancel' | 'revenue.view' | 'products.view' | 'products.edit'
  | 'customers.view' | 'reminders.view' | 'reminders.manage' | 'settings.edit' | 'activity.view' | 'team.manage';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  permissions: Permission[];
}

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  details: string[];
}

export interface Order {
  ref: string;
  source: 'website' | 'manual';
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'paid';
  payMethod: 'full' | 'koko';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryDate: string | null;
  giftNote: string;
  customerName: string;
  customerPhone: string | null;
  address: string;
  staffNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderEvent {
  at: string;
  message: string;
  user: string | null;
}

export interface AdminProduct {
  id: string;
  name: string;
  note: string;
  price: number;
  who: string[];
  occ: string[];
  vibe: string;
  tint: string;
  tint2: string;
  paper: string;
  badge?: 'Bestseller' | 'New';
  pop: number;
  image?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  phone: string;
  name: string;
  orders: number;
  spent: number;
  lastOrder: string;
  reminders: boolean;
}

export interface Reminder {
  id: number;
  channel: 'email' | 'whatsapp';
  contact: string;
  occasions: string[];
  consentAt: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: number;
  at: string;
  user: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
}

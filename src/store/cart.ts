import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartLine {
  key: string;
  name: string;
  price: number;
  qty: number;
  tint: string;
  details?: string[];
  sub?: string;
}

export type PayChoice = 'full' | 'koko';

interface CartState {
  lines: CartLine[];
  /** ISO date (yyyy-mm-dd) picked in the drawer */
  deliveryDate: string | null;
  note: string;
  pay: PayChoice;

  // UI state — not persisted
  isOpen: boolean;
  /** Increments on every add so the header basket can replay its wiggle */
  bump: number;
  lastAdd: number;
  undo: { line: CartLine; idx: number } | null;

  add: (line: CartLine) => void;
  inc: (key: string) => void;
  dec: (key: string) => void;
  remove: (key: string) => void;
  undoRemove: () => void;
  clearUndo: () => void;
  clear: () => void;
  setDeliveryDate: (iso: string) => void;
  setNote: (note: string) => void;
  setPay: (pay: PayChoice) => void;
  open: () => void;
  close: () => void;
}

const setQty = (lines: CartLine[], key: string, fn: (q: number) => number) =>
  lines.map((l) => (l.key === key ? { ...l, qty: fn(l.qty) } : l));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      deliveryDate: null,
      note: '',
      pay: 'full',
      isOpen: false,
      bump: 0,
      lastAdd: 1,
      undo: null,

      add: (line) => {
        const lines = get().lines.slice();
        const i = lines.findIndex((x) => x.key === line.key);
        if (i >= 0) lines[i] = { ...lines[i], qty: lines[i].qty + line.qty };
        else lines.push({ ...line });
        set({ lines, bump: get().bump + 1, lastAdd: line.qty });
      },
      inc: (key) => set({ lines: setQty(get().lines, key, (q) => q + 1) }),
      dec: (key) => set({ lines: setQty(get().lines, key, (q) => Math.max(1, q - 1)) }),
      remove: (key) => {
        const lines = get().lines;
        const idx = lines.findIndex((x) => x.key === key);
        if (idx < 0) return;
        set({ lines: lines.filter((x) => x.key !== key), undo: { line: lines[idx], idx } });
      },
      undoRemove: () => {
        const u = get().undo;
        if (!u) return;
        const lines = get().lines.slice();
        lines.splice(Math.min(u.idx, lines.length), 0, u.line);
        set({ lines, undo: null });
      },
      clearUndo: () => set({ undo: null }),
      clear: () => set({ lines: [], note: '', undo: null }),
      setDeliveryDate: (deliveryDate) => set({ deliveryDate }),
      setNote: (note) => set({ note: note.slice(0, 200) }),
      setPay: (pay) => set({ pay }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'giftsbydeesh-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, deliveryDate: s.deliveryDate, note: s.note, pay: s.pay }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((a, l) => a + l.qty, 0);
export const cartTotal = (lines: CartLine[]) => lines.reduce((a, l) => a + l.price * l.qty, 0);

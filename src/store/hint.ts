import { create } from 'zustand';

interface HintState {
  hint: { name: string; price: string; gen: number } | null;
  send: (name: string, price: string) => void;
  clear: () => void;
}

/** "Send a hint" envelope overlay, shared by every page that has a heart button. */
export const useHint = create<HintState>()((set, get) => ({
  hint: null,
  send: (name, price) => set({ hint: { name, price, gen: (get().hint?.gen ?? 0) + 1 } }),
  clear: () => set({ hint: null }),
}));

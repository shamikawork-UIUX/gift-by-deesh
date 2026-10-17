import { create } from 'zustand';

export interface Flight {
  id: number;
  tint: string;
  /** start (viewport px, top-left of the 56px token) */
  sx: number;
  sy: number;
  /** distance to the basket */
  dx: number;
  dy: number;
  moved: boolean;
}

interface FlyState {
  flights: Flight[];
  basketEl: HTMLElement | null;
  setBasketEl: (el: HTMLElement | null) => void;
  launch: (f: Omit<Flight, 'id' | 'moved'>) => number;
  move: (id: number) => void;
  land: (id: number) => void;
}

let nextId = 0;

export const useFly = create<FlyState>()((set, get) => ({
  flights: [],
  basketEl: null,
  setBasketEl: (basketEl) => set({ basketEl }),
  launch: (f) => {
    const id = ++nextId;
    set({ flights: get().flights.concat({ ...f, id, moved: false }) });
    return id;
  },
  move: (id) => set({ flights: get().flights.map((x) => (x.id === id ? { ...x, moved: true } : x)) }),
  land: (id) => set({ flights: get().flights.filter((x) => x.id !== id) }),
}));

import { create } from 'zustand';
import { api, setUnauthorisedHandler, type Permission, type User } from './api';

type Status = 'loading' | 'signed-out' | 'setup' | 'signed-in' | 'error';

interface SessionState {
  status: Status;
  user: User | null;
  setupNeedsCode: boolean;
  /** Shown on the sign-in screen after being signed out by the server (expired session). */
  notice: string;
  check: () => Promise<void>;
  setUser: (u: User) => void;
  signOut: () => Promise<void>;
  expired: () => void;
}

export const useSession = create<SessionState>()((set) => ({
  status: 'loading',
  user: null,
  setupNeedsCode: false,
  notice: '',
  check: async () => {
    try {
      const s = await api<{ user: User | null; needsSetup: boolean; setupNeedsCode: boolean }>('/session');
      set({ user: s.user, setupNeedsCode: s.setupNeedsCode, status: s.user ? 'signed-in' : s.needsSetup ? 'setup' : 'signed-out' });
    } catch {
      set({ status: 'error' });
    }
  },
  setUser: (user) => set({ user, status: 'signed-in', notice: '' }),
  signOut: async () => {
    try { await api('/logout', { method: 'POST' }); } catch { /* signed out locally anyway */ }
    set({ user: null, status: 'signed-out', notice: '' });
  },
  expired: () => set({ user: null, status: 'signed-out', notice: 'You were signed out. Please sign in again.' }),
}));

setUnauthorisedHandler(() => useSession.getState().expired());

/** Does the signed-in person have this permission? (The server checks again on every request.) */
export function useCan() {
  const user = useSession((s) => s.user);
  return (p: Permission) => !!user?.permissions.includes(p);
}

export const roleInfo: Record<User['role'], { label: string; desc: string }> = {
  owner: { label: 'Owner', desc: 'Everything, including the team and who can sign in.' },
  manager: { label: 'Manager', desc: 'Orders, products, prices, reminders, shop settings and sales figures. Can’t manage the team.' },
  staff: { label: 'Staff', desc: 'Handles orders: confirm, pack, deliver, message customers. Can view products and reminders but not change them. No sales totals.' },
};

import { create } from 'zustand';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Toast {
  id: number;
  tone: 'ok' | 'error';
  text: string;
  action?: { label: string; run: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let seq = 0;
export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = ++seq;
    set({ toasts: [...get().toasts.slice(-2), { ...t, id }] });
    // Errors and toasts with an action (e.g. Undo) stay a little longer.
    window.setTimeout(() => get().dismiss(id), t.tone === 'error' || t.action ? 7000 : 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  ok: (text: string, action?: Toast['action']) => useToasts.getState().push({ tone: 'ok', text, action }),
  error: (text: string) => useToasts.getState().push({ tone: 'error', text }),
};

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="a-toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`a-toast a-toast-${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
          {t.tone === 'ok' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
          <span>{t.text}</span>
          {t.action && <button className="a-toast-act" onClick={() => { t.action!.run(); dismiss(t.id); }}>{t.action.label}</button>}
          <button className="a-toast-x" aria-label="Dismiss" onClick={() => dismiss(t.id)}><X size={16} aria-hidden="true" /></button>
        </div>
      ))}
    </div>
  );
}

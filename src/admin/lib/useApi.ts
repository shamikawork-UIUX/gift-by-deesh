import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

/** Ask the shell to refresh the new-orders badge now (after confirming an order, etc.). */
export const refreshPulse = () => window.dispatchEvent(new Event('admin:pulse'));

/**
 * Loads `path` and keeps `data` while reloading, so lists don't flash empty.
 * `pollMs` refreshes in the background while the tab is visible.
 */
export function useApi<T>(path: string | null, { pollMs }: { pollMs?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!path);
  const ctrl = useRef<AbortController | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!path) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    if (!quiet) setLoading(true);
    try {
      const d = await api<T>(path, { signal: c.signal });
      setData(d);
      setError('');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      if (!quiet) setError((e as Error).message);
    } finally {
      if (ctrl.current === c) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
    return () => ctrl.current?.abort();
  }, [load]);

  useEffect(() => {
    if (!pollMs) return;
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') void load(true); }, pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);

  return { data, setData, error, loading, reload: load };
}

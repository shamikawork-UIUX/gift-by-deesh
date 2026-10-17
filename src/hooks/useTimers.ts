import { useCallback, useEffect, useRef } from 'react';

/** setTimeout that is cleared automatically when the component unmounts. */
export function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach((t) => clearTimeout(t)), []);
  return useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    ids.current.push(id);
    return id;
  }, []);
}

import { useEffect, useState } from 'react';

/** True while the media query matches, e.g. useMedia('(min-width: 1024px)'). */
export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}

export const useDesktop = () => useMedia('(min-width: 1024px)');

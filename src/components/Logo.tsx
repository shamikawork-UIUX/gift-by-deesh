import { Gift } from 'lucide-react';

export function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <Gift size={22} color="#fff" strokeWidth={2} />
    </span>
  );
}

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="wordmark" style={{ color: dark ? '#fff' : 'var(--ink)' }}>
      GiftsBy<span style={{ color: dark ? 'var(--pink-light)' : 'var(--pink)' }}>Deesh</span>
    </span>
  );
}

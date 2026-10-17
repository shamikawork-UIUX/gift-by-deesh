// Little illustrated goodies used by the box builder, combos and hero art.

export type Shape = 'egg' | 'bar' | 'ball' | 'teddy' | 'teddy-pink' | 'avo' | 'car' | 'balloon' | 'box' | 'heart';

export function ShapeSvg({ shape, c1 }: { shape: Shape; c1?: string }) {
  switch (shape) {
    case 'egg':
      return (
        <svg aria-hidden="true" viewBox="0 0 40 40">
          <ellipse cx="20" cy="21" rx="11" ry="14" fill="#fff" stroke="#E2D6D9" strokeWidth="1.5" />
          <path d="M9 21A11 14 0 0 0 31 21Z" fill={c1 ?? '#E8463B'} />
        </svg>
      );
    case 'bar':
      return (
        <svg aria-hidden="true" viewBox="0 0 40 40">
          <rect x="7" y="12" width="26" height="16" rx="4" fill={c1} />
          <rect x="7" y="17.5" width="26" height="5" fill="#fff" opacity=".9" />
          <path d="M14 12v16M20 12v16M26 12v16" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
        </svg>
      );
    case 'ball':
      return (
        <svg aria-hidden="true" viewBox="0 0 40 40">
          <circle cx="13" cy="24" r="7" fill={c1 ?? '#D9A441'} />
          <circle cx="27" cy="24" r="7" fill={c1 ?? '#D9A441'} />
          <circle cx="20" cy="15" r="7" fill={c1 ?? '#D9A441'} />
          <circle cx="18" cy="13" r="2" fill="#fff" opacity=".55" />
          <circle cx="11" cy="22" r="2" fill="#fff" opacity=".55" />
          <circle cx="25" cy="22" r="2" fill="#fff" opacity=".55" />
        </svg>
      );
    case 'teddy':
    case 'teddy-pink': {
      const c = c1 ?? (shape === 'teddy-pink' ? '#EFA3BB' : '#C68E5E');
      return (
        <svg aria-hidden="true" viewBox="0 0 40 40">
          <circle cx="11" cy="12" r="5.5" fill={c} />
          <circle cx="29" cy="12" r="5.5" fill={c} />
          <circle cx="20" cy="22" r="12" fill={c} />
          <ellipse cx="20" cy="26.5" rx="6" ry="4.5" fill="#fff" opacity=".7" />
          <circle cx="15.5" cy="20" r="1.6" fill="#3B2A22" />
          <circle cx="24.5" cy="20" r="1.6" fill="#3B2A22" />
          <circle cx="20" cy="25" r="1.6" fill="#3B2A22" />
        </svg>
      );
    }
    case 'avo':
      return (
        <svg aria-hidden="true" viewBox="0 0 40 40">
          <path d="M20 5c-5 0-7.5 6-9.5 12S8 34 20 34s11.5-11 9.5-17S25 5 20 5z" fill="#5E8C3A" />
          <path d="M20 9c-3.5 0-5.2 5-6.7 10S11.5 31 20 31s8.2-7 6.7-12S23.5 9 20 9z" fill="#CFE6A8" />
          <circle cx="20" cy="24" r="4.6" fill="#8A5A3B" />
          <circle cx="17.6" cy="16.5" r="1" fill="#2D3A1E" />
          <circle cx="22.4" cy="16.5" r="1" fill="#2D3A1E" />
        </svg>
      );
    case 'car': {
      const c = c1 ?? '#E8463B';
      return (
        <svg aria-hidden="true" viewBox="0 0 40 40">
          <path d="M15 14h9l4 7H11z" fill="#CFE3FF" stroke={c} strokeWidth="2" strokeLinejoin="round" />
          <rect x="5" y="20" width="30" height="8" rx="3.5" fill={c} />
          <circle cx="12" cy="28.5" r="3.6" fill="#1B1F3B" />
          <circle cx="28" cy="28.5" r="3.6" fill="#1B1F3B" />
          <rect x="30" y="22" width="4" height="2.5" rx="1" fill="#FFE08A" />
        </svg>
      );
    }
    case 'balloon':
      return (
        <svg aria-hidden="true" viewBox="0 0 40 40">
          <ellipse cx="20" cy="16" rx="10" ry="12" fill="#5B8BD9" />
          <ellipse cx="16.5" cy="11" rx="2.5" ry="3.5" fill="#fff" opacity=".45" />
          <path d="M18.5 28h3l-1.5 2.5z" fill="#5B8BD9" />
          <path d="M20 30q-3 4 0 7" stroke="#1B1F3B" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'box':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#D6245F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
        </svg>
      );
    case 'heart':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill={c1 ?? '#D6245F'}>
          <path d={HEART_PATH} />
        </svg>
      );
  }
}

export const HEART_PATH =
  'M12 20s-7.5-4.6-9.2-9.3C1.7 7.5 3.8 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.2 0 5.3 3 4.2 6.2C19.5 15.4 12 20 12 20z';
export const STAR_PATH = 'M12 2l2.6 6.6L21 9.3l-5 4.4 1.6 6.8L12 17l-5.6 3.5L8 13.7 3 9.3l6.4-.7z';

export function Bow({ color, className, full = true }: { color: string; className?: string; full?: boolean }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 120 76">
      <path d="M60 38C38 8 8 10 12 32c3 16 30 14 48 6z" fill={color} />
      <path d="M60 38C82 8 112 10 108 32c-3 16-30 14-48 6z" fill={color} />
      {full && <path d="M56 42 42 74l9-4 5 6 6-32z" fill={color} />}
      {full && <path d="M64 42l14 32-9-4-5 6-6-32z" fill={color} />}
      <circle cx="60" cy="39" r="9" fill={color} stroke="rgba(0,0,0,.18)" strokeWidth="2" />
    </svg>
  );
}

/** Basket-with-teddy illustration for empty states. */
export function TeddyBasket({ className, size = 140 }: { className?: string; size?: number }) {
  return (
    <svg className={className} aria-hidden="true" width={size} height={size} viewBox="0 0 60 60">
      <circle cx="18" cy="13" r="6" fill="#C68E5E" />
      <circle cx="42" cy="13" r="6" fill="#C68E5E" />
      <circle cx="30" cy="24" r="14" fill="#C68E5E" />
      <ellipse cx="30" cy="29" rx="7" ry="5" fill="#F3DFC9" />
      <circle cx="25" cy="21.5" r="1.8" fill="#3B2A22" />
      <circle cx="35" cy="21.5" r="1.8" fill="#3B2A22" />
      <circle cx="30" cy="27" r="1.6" fill="#3B2A22" />
      <path d="M27 32q3-1.6 6 0" stroke="#3B2A22" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M14 40h32l-3 15H17z" fill="#F2B4C8" stroke="#D6245F" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M21 40c0-7 18-7 18 0" stroke="#D6245F" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function InstagramIcon({ size = 17 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".6" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon({ size = 17 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.8 2.4 4.6 5 5" />
    </svg>
  );
}

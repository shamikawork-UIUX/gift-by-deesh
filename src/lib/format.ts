/** LKR 4,000 */
export const money = (n: number) => 'LKR ' + n.toLocaleString('en-US');

/** One KOKO instalment (3 interest-free payments). */
export const kokoPart = (price: number) => Math.ceil(price / 3);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Alternates between two class names so a CSS animation replays on every change. */
export const flip = (gen: number, a: string, b: string) => (gen ? (gen % 2 ? a : b) : '');

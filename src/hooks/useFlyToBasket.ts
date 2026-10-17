import { useCallback } from 'react';
import { useCart, type CartLine } from '../store/cart';
import { useFly } from '../store/fly';
import { prefersReducedMotion } from '../lib/format';

const FLIGHT_MS = 790;

/**
 * Returns `fly(line, fromEl)`: a token arcs from the clicked element into the
 * header basket, then the line is added to the cart (which wiggles the basket).
 */
export function useFlyToBasket() {
  return useCallback((line: CartLine, fromEl?: Element | null) => {
    const { add } = useCart.getState();
    const { basketEl, launch, move, land } = useFly.getState();
    if (!fromEl || !basketEl || prefersReducedMotion()) {
      add(line);
      return;
    }
    const b = fromEl.getBoundingClientRect();
    const c = basketEl.getBoundingClientRect();
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    const id = launch({
      tint: line.tint,
      sx: Math.round(bx - 28),
      sy: Math.round(by - 28),
      dx: Math.round(c.left + c.width / 2 - bx),
      dy: Math.round(c.top + c.height / 2 - by),
    });
    window.setTimeout(() => move(id), 30);
    window.setTimeout(() => add(line), FLIGHT_MS);
    window.setTimeout(() => land(id), FLIGHT_MS + 110);
  }, []);
}

import { kokoPart, money } from '../lib/format';
import './PriceBlock.css';

/** "or 3 × LKR 1,334 with [KOKO]" — replace the pill with KOKO's official badge before launch. */
export function Koko({ price, className = '', light = false }: { price: number; className?: string; light?: boolean }) {
  return (
    <span className={`koko ${light ? 'koko-light' : ''} ${className}`}>
      or 3 × {money(kokoPart(price))} with <span className="koko-tag">KOKO</span>
    </span>
  );
}

interface PriceBlockProps {
  price: number;
  from?: boolean;
  align?: 'left' | 'right';
}

export function PriceBlock({ price, from = true, align = 'left' }: PriceBlockProps) {
  return (
    <div className="price-block" style={{ textAlign: align }}>
      {from && <div className="price-from">from</div>}
      <div className="price-main">{money(price)}</div>
      <Koko price={price} className="price-koko" />
    </div>
  );
}

import type { MouseEvent } from 'react';
import { Heart, Plus } from 'lucide-react';
import type { Product } from '../data/products';
import { money } from '../lib/format';
import { PhotoLabel } from './Placeholder';
import { Koko } from './PriceBlock';
import './ProductCard.css';

interface Props {
  product: Product;
  badge?: string;
  added?: boolean;
  hinted?: boolean;
  onAdd: (e: MouseEvent<HTMLButtonElement>) => void;
  onHint: () => void;
}

/** Product card with hover photo swap and an "Add to basket" button that is always visible and widens on hover. */
export function ProductCard({ product: p, badge, added, hinted, onAdd, onHint }: Props) {
  return (
    <article className="pcard">
      <div className="ph pcard-img" style={{ background: p.tint }}>
        <PhotoLabel label={`${p.name} — front`} />
        <PhotoLabel label={`${p.name} — wrapped / in hand`} className="ph-in alt" style={{ background: p.tint2 }} />
        {badge && (
          <span className="pbadge" style={{ background: badge === 'New' ? 'var(--ink)' : 'var(--pink)' }}>{badge}</span>
        )}
        <button
          className={`heart ${hinted ? 'sent' : ''}`}
          aria-label={`Send ${p.name} as a hint on WhatsApp`}
          onClick={onHint}
          style={{ color: hinted ? 'var(--pink)' : 'var(--ink)' }}
        >
          <span className="tip" aria-hidden="true">Send a hint</span>
          <Heart size={19} fill={hinted ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        <div className="add">
          <button onClick={onAdd} style={{ background: added ? 'var(--ink)' : 'var(--pink)' }}>
            <Plus size={18} strokeWidth={2.6} aria-hidden="true" />
            <span className="add-lbl">{added ? 'Add one more' : 'Add to basket'}</span>
            <span className="sr-only">: {p.name}</span>
          </button>
        </div>
      </div>
      <div className="pcard-body">
        <div>
          <h3>{p.name}</h3>
          <div className="pcard-note">{p.note}</div>
        </div>
        <div className="pcard-price">
          <div className="price-from">from</div>
          <div className="pcard-amt">{money(p.price)}</div>
        </div>
      </div>
      <div className="pcard-koko"><Koko price={p.price} /></div>
    </article>
  );
}

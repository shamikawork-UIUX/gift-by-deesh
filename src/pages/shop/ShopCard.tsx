import { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { occName, whoName, type Product } from '../../data/products';
import { ProductPhoto } from '../../components/Placeholder';
import { PriceBlock } from '../../components/PriceBlock';
import { Bow } from '../../components/Shapes';
import { useFlyToBasket } from '../../hooks/useFlyToBasket';
import { useHint } from '../../store/hint';
import { money } from '../../lib/format';
import '../../components/ProductCard.css';

export const productMeta = (p: Product) => `${whoName[p.who[0]]} · ${occName[p.occ[0]]}`;

export function WrapOverlay({ paper }: { paper: string }) {
  return (
    <div className="wrapov" style={{ backgroundColor: paper }} aria-hidden="true">
      <div className="rv" />
      <div className="rh" />
      <Bow className="bow" color="var(--pink)" />
    </div>
  );
}

export function WrapToggle({ wrapped, onChange }: { wrapped: boolean; onChange: (w: boolean) => void }) {
  return (
    <div className="wtog" role="group" aria-label="Preview">
      <button className={wrapped ? '' : 'on'} aria-pressed={!wrapped} onClick={() => onChange(false)}>Gift</button>
      <button className={wrapped ? 'on' : ''} aria-pressed={wrapped} onClick={() => onChange(true)}>Wrapped</button>
    </div>
  );
}

export function ShopCard({ product: p, onOpen }: { product: Product; onOpen: () => void }) {
  const [wrapped, setWrapped] = useState(false);
  const [liked, setLiked] = useState(false);
  const fly = useFlyToBasket();
  const sendHint = useHint((s) => s.send);

  return (
    <article className="scard">
      <div className="simg" style={{ background: p.tint }}>
        <button className="simg-btn" aria-label={`Quick view ${p.name}`} onClick={onOpen}>
          <ProductPhoto image={p.image} name={p.name} label={`Photo — ${p.name}`} className="simg-ph" />
        </button>
        {wrapped && <WrapOverlay paper={p.paper} />}
        <span className="qv-hint" aria-hidden="true">Quick view</span>
        {p.badge && <span className="pbadge" style={{ background: p.badge === 'New' ? 'var(--ink)' : 'var(--pink)' }}>{p.badge}</span>}
        <button
          className={`heart ${liked ? 'sent' : ''}`}
          aria-label={`Send ${p.name} as a hint on WhatsApp`}
          style={{ color: liked ? 'var(--pink)' : 'var(--ink)' }}
          onClick={() => { setLiked(true); sendHint(p.name, money(p.price)); }}
        >
          <Heart size={19} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        <WrapToggle wrapped={wrapped} onChange={setWrapped} />
      </div>
      <div className="scard-body">
        <div>
          <button className="name-btn" onClick={onOpen}>{p.name}</button>
          <div className="scard-meta">{productMeta(p)}</div>
        </div>
        <div className="scard-foot">
          <PriceBlock price={p.price} />
          <button
            className="addbtn"
            aria-label={`Add ${p.name} to basket`}
            onClick={(e) => fly({ key: `${p.id}-reg-`, name: p.name, price: p.price, qty: 1, tint: p.tint }, e.currentTarget)}
          >
            <Plus size={20} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

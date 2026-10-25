import { useRef, useState } from 'react';
import { Check, Heart, Minus, Plus, ShoppingBasket, X } from 'lucide-react';
import { addOns, sizeOptions, type Product } from '../../data/products';
import { ProductPhoto } from '../../components/Placeholder';
import { useProduct } from '../../store/catalog';
import { Koko } from '../../components/PriceBlock';
import { useExit, useFocusTrap } from '../../hooks/useDialog';
import { useFlyToBasket } from '../../hooks/useFlyToBasket';
import { useHint } from '../../store/hint';
import { flip, money } from '../../lib/format';
import { WrapOverlay, WrapToggle, productMeta } from './ShopCard';

type SizeId = (typeof sizeOptions)[number]['id'];

/** Quick view = centred modal (the cart is a side drawer). */
export function QuickView({ id, onClose }: { id: string; onClose: () => void }) {
  const product = useProduct(id);
  // The shop only opens quick view for products it is showing, so this is just a guard.
  return product ? <QuickViewDialog p={product} onClose={onClose} /> : null;
}

function QuickViewDialog({ p, onClose }: { p: Product; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [closing, requestClose] = useExit(onClose, 260);
  useFocusTrap(ref, requestClose);
  const fly = useFlyToBasket();
  const sendHint = useHint((s) => s.send);

  const [size, setSize] = useState<SizeId>('reg');
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [qty, setQty] = useState(1);
  const [wrapped, setWrapped] = useState(false);
  const [liked, setLiked] = useState(false);
  const [gen, setGen] = useState(0);
  const bump = () => setGen((g) => g + 1);

  const sz = sizeOptions.find((z) => z.id === size)!;
  const addSum = addOns.reduce((a, x) => a + (picked[x.id] ? x.price : 0), 0);
  const unit = p.price + sz.extra + addSum;
  const total = unit * qty;

  const add = (el: HTMLElement) => {
    const chosen = addOns.filter((a) => picked[a.id]);
    fly(
      {
        key: `${p.id}-${size}-${chosen.map((a) => a.id).join('.')}`,
        name: p.name + (size === 'lg' ? ' (Large)' : ''),
        price: unit,
        qty,
        tint: p.tint,
        details: chosen.map((a) => `Add-on: ${a.label}`),
      },
      el,
    );
    requestClose();
  };

  return (
    <div className={`qv-layer ${closing ? 'closing' : ''}`}>
      <button className="qv-back" aria-label="Close quick view" tabIndex={-1} onClick={requestClose} />
      <div ref={ref} className="qv" role="dialog" aria-modal="true" aria-labelledby="qv-title">
        <button className="qv-close" onClick={requestClose} aria-label="Close"><X size={16} strokeWidth={2.6} aria-hidden="true" /></button>
        <div className="qv-img" style={{ background: p.tint }}>
          <ProductPhoto image={p.image} name={p.name} label={`Photo — ${p.name}`} size={34} className="simg-ph" />
          {wrapped && <WrapOverlay paper={p.paper} />}
          <WrapToggle wrapped={wrapped} onChange={setWrapped} />
        </div>
        <div className="qv-info">
          <div style={{ paddingRight: 52 }}>
            <span className="eyebrow">QUICK VIEW</span>
            <h2 id="qv-title" className="qv-title">{p.name}</h2>
            <div className="qv-meta">{productMeta(p)} · {p.note}</div>
          </div>
          <div role="group" aria-labelledby="qv-size" style={{ marginTop: 22 }}>
            <div id="qv-size" className="qv-lab">Size</div>
            <div className="seg">
              {sizeOptions.map((z) => (
                <button key={z.id} className={size === z.id ? 'on' : ''} aria-pressed={size === z.id} onClick={() => { setSize(z.id); bump(); }}>
                  <span className="seg-t">{z.label}</span>
                  <span className="seg-s">{z.extra ? `+ ${money(z.extra)}` : 'As pictured'}</span>
                </button>
              ))}
            </div>
          </div>
          <div role="group" aria-labelledby="qv-extra" style={{ marginTop: 22 }}>
            <div id="qv-extra" className="qv-lab">Make it extra special</div>
            <div className="addons">
              {addOns.map((a) => {
                const on = !!picked[a.id];
                return (
                  <button key={a.id} className={`addon ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => { setPicked((s) => ({ ...s, [a.id]: !on })); bump(); }}>
                    <span className="box"><Check size={14} strokeWidth={3.2} aria-hidden="true" /></span>
                    <span className="addon-l">{a.label}</span>
                    <span className="addon-p">+ {money(a.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="qv-buy">
            <div className="qv-row">
              <div className="qv-qty">
                <button className="stp" aria-label="Fewer" disabled={qty <= 1} onClick={() => { setQty((q) => Math.max(1, q - 1)); bump(); }}>
                  <Minus size={16} strokeWidth={2.6} aria-hidden="true" />
                </button>
                <span aria-label={`Quantity ${qty}`}>{qty}</span>
                <button className="stp" aria-label="More" onClick={() => { setQty((q) => q + 1); bump(); }}>
                  <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="qv-tl">Total</div>
                <div className={`qv-total ${flip(gen, 'pa', 'pb')}`}>{money(total)}</div>
                <div style={{ marginTop: 2 }}><Koko price={total} /></div>
              </div>
            </div>
            <div className="qv-ctas">
              <button className="big-add" onClick={(e) => add(e.currentTarget)}>
                <ShoppingBasket size={20} aria-hidden="true" />Add to basket
              </button>
              <button
                className="qv-heart"
                aria-label={`Send ${p.name} as a hint on WhatsApp`}
                style={{ color: liked ? 'var(--pink)' : 'var(--ink)' }}
                onClick={() => { setLiked(true); sendHint(p.name, money(p.price)); }}
              >
                <Heart size={22} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
              </button>
            </div>
            <p className="qv-fine">Hand-wrapped and confirmed with you on WhatsApp at checkout.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

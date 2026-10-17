import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { favouriteTabs } from '../../data/home';
import { productById } from '../../data/products';
import { ProductCard } from '../../components/ProductCard';
import { useFlyToBasket } from '../../hooks/useFlyToBasket';
import { useHint } from '../../store/hint';
import { money } from '../../lib/format';
import './Favourites.css';

const VISIBLE = 4;

export function Favourites() {
  const [tab, setTab] = useState<string>(favouriteTabs[0].id);
  const [offset, setOffset] = useState(0);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [hinted, setHinted] = useState<Record<string, boolean>>({});
  const fly = useFlyToBasket();
  const sendHint = useHint((s) => s.send);

  const current = favouriteTabs.find((t) => t.id === tab)!;
  const items = current.items.map((it) => ({ product: productById(it.id)!, badge: 'badge' in it ? it.badge : undefined }));
  const maxOff = Math.max(0, items.length - VISIBLE);
  const off = Math.min(offset, maxOff);

  return (
    <section id="favourites" className="container fav-sec">
      <div className="sec-head" style={{ marginBottom: 28 }}>
        <div>
          <h2 className="h2">Customer favourites</h2>
          <div className="fav-tabs" role="group" aria-label="Filter favourites">
            {favouriteTabs.map((t) => (
              <button key={t.id} className={`tab ${t.id === tab ? 'on' : ''}`} aria-pressed={t.id === tab} onClick={() => { setTab(t.id); setOffset(0); }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="fav-nav">
          <Link to="/shop" className="fav-all">View all gifts</Link>
          <button className="icon-btn arrow hide-sm" aria-label="Previous" disabled={off === 0} onClick={() => setOffset(Math.max(0, off - 1))}>
            <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <button className="icon-btn arrow hide-sm" aria-label="Next" disabled={off >= maxOff} onClick={() => setOffset(Math.min(maxOff, off + 1))}>
            <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="car-view">
        <div className="track" style={{ transform: `translateX(calc(${-off} * (25% + 5px)))` }}>
          {items.map(({ product: p, badge }) => (
            <ProductCard
              key={`${tab}-${p.id}`}
              product={p}
              badge={badge}
              added={!!added[p.id]}
              hinted={!!hinted[p.id]}
              onAdd={(e) => {
                setAdded((a) => ({ ...a, [p.id]: true }));
                fly({ key: `${p.id}-reg-`, name: p.name, price: p.price, qty: 1, tint: p.tint }, e.currentTarget);
              }}
              onHint={() => {
                setHinted((h) => ({ ...h, [p.id]: true }));
                sendHint(p.name, money(p.price));
              }}
            />
          ))}
        </div>
      </div>
      <p className="fav-foot">Tap the heart to send a hint to someone special on WhatsApp.</p>
    </section>
  );
}

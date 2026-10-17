import { Plus } from 'lucide-react';
import { combos } from '../../data/offers';
import { ShapeSvg } from '../../components/Shapes';
import { Koko } from '../../components/PriceBlock';
import { useFlyToBasket } from '../../hooks/useFlyToBasket';
import { money } from '../../lib/format';

export function Combos() {
  const fly = useFlyToBasket();
  return (
    <section className="container sec-t sec-b-sm">
      <div className="sec-head" style={{ marginBottom: 36 }}>
        <div>
          <p className="eyebrow">COMBO DEALS</p>
          <h2 className="h2">Better together</h2>
        </div>
        <p className="sec-lede" style={{ maxWidth: 360 }}>Two gifts that were clearly meant to be. Bundled, wrapped and a little cheaper.</p>
      </div>
      <div className="combos">
        {combos.map((c) => (
          <article key={c.id} className="combo">
            <div className="combo-vis" style={{ background: c.tint }}>
              <span className="sticker">Save {money(c.was - c.now)}</span>
              <div className="ftok ta" style={{ width: 104, height: 104, background: c.a.bg }}><ShapeSvg shape={c.a.shape} /></div>
              <span className="plus-sign" aria-hidden="true">+</span>
              <div className="ftok tb" style={{ width: 104, height: 104, background: c.b.bg }}><ShapeSvg shape={c.b.shape} /></div>
            </div>
            <div>
              <h3 className="combo-t">{c.name}</h3>
              <p className="combo-d">{c.desc}</p>
            </div>
            <div className="combo-foot">
              <div>
                <div className="combo-was"><span className="sr-only">Was </span>{money(c.was)}</div>
                <div className="combo-now"><span className="sr-only">Now </span>{money(c.now)}</div>
                <div style={{ marginTop: 4 }}><Koko price={c.now} /></div>
              </div>
              <button
                className="pill-add"
                onClick={(e) =>
                  fly(
                    { key: `combo-${c.id}`, name: `${c.name} combo`, price: c.now, qty: 1, tint: c.tint, details: [c.desc], sub: `You save ${money(c.was - c.now)}` },
                    e.currentTarget,
                  )
                }
              >
                <Plus size={18} strokeWidth={2.4} aria-hidden="true" />Add combo<span className="sr-only">: {c.name}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

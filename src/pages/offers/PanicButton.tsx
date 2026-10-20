import { useState } from 'react';
import { Plus } from 'lucide-react';
import { panicPicks } from '../../data/offers';
import { useProducts, useSettings } from '../../store/catalog';
import { Koko } from '../../components/PriceBlock';
import { useFlyToBasket } from '../../hooks/useFlyToBasket';
import { money } from '../../lib/format';

export function PanicButton() {
  const products = useProducts();
  const settings = useSettings();
  const picks = panicPicks.flatMap((pk) => { const p = products.find((x) => x.id === pk.id); return p ? [{ pk, p }] : []; });
  const [on, setOn] = useState(false);
  const [gen, setGen] = useState(0);
  const fly = useFlyToBasket();

  return (
    <section className={`panic-wrap ${gen ? (gen % 2 ? 'sqA' : 'sqB') : ''}`}>
      <div className="container sec-y">
        <div className="panic-row">
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <p className="eyebrow" style={{ color: 'var(--pink-light)' }}>EMERGENCY GIFT MODE</p>
            <h2 className="h2" style={{ fontSize: 48, lineHeight: 1.04 }}>Forgot someone's birthday?</h2>
            <p className="panic-p">It happens to the best of us. Press the big button. Don't overthink it.</p>
          </div>
          <div className="panic-zone">
            <span className="pring" aria-hidden="true" />
            <span className="pring r2" aria-hidden="true" />
            <button className="panic-btn" aria-expanded={on} aria-controls="calm-panel" onClick={() => { setOn(true); setGen((g) => g + 1); }}>
              {on ? 'PHEW' : 'PANIC'}
            </button>
          </div>
        </div>

        {on && (
          <div id="calm-panel" className="calm-panel">
            <div className="calm-bear">
              <svg width="130" height="130" viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="11" cy="12" r="5.5" fill="#C68E5E" /><circle cx="29" cy="12" r="5.5" fill="#C68E5E" />
                <circle cx="20" cy="22" r="12" fill="#C68E5E" />
                <ellipse cx="20" cy="27" rx="6" ry="4.5" fill="#F3DFC9" />
                <circle cx="15.5" cy="20" r="1.8" fill="#3B2A22" /><circle cx="24.5" cy="20" r="1.8" fill="#3B2A22" />
                <circle cx="20" cy="25" r="1.5" fill="#3B2A22" />
                <path d="M17 29.5q3 1.6 6 0" stroke="#3B2A22" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <path className="sweat" d="M29 15c0 1.6-1 2.6-1.8 2.6S25.4 16.6 25.4 15c0-1.4 1.8-3.6 1.8-3.6S29 13.6 29 15z" fill="#7FB4E8" />
              </svg>
              <span>Deep breaths.</span>
            </div>
            <div style={{ flex: '1 1 420px', minWidth: 0 }}>
              <h3 className="calm-t">Relax. We've got you.</h3>
              <p className="calm-p">Three crowd-pleasers, wrapped and ready. Order by {settings.cutoffTime} for same-day delivery in {settings.cutoffArea}.</p>
              <ul className="picks">
                {picks.map(({ pk, p }, i) => {
                  return (
                    <li key={p.id} className="pick" style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
                      <span className="pick-sw" style={{ background: p.tint }} aria-hidden="true" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="pick-n">{p.name}</div>
                        <div className="pick-s">{pk.note}</div>
                      </div>
                      <div className="pick-price">
                        <div className="pick-amt">{money(p.price)}</div>
                        <Koko price={p.price} light />
                      </div>
                      <button
                        className="pick-add"
                        aria-label={`Add ${p.name} to basket`}
                        onClick={(e) => fly({ key: `${p.id}-reg-`, name: p.name, price: p.price, qty: 1, tint: p.tint }, e.currentTarget)}
                      >
                        <Plus size={20} strokeWidth={2.6} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button className="text-btn light" onClick={() => setOn(false)}>Okay, I'm calm now</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

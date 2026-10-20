import { useState } from 'react';
import { ChevronDown, RotateCcw, Sparkles } from 'lucide-react';
import { occasionOptions, whoOptions } from '../../data/products';
import { flip, money } from '../../lib/format';
import { BUDGET_MAX, BUDGET_MIN, type Filters } from './ShopPage';

interface Props {
  filters: Filters;
  gen: number;
  setFilter: (p: Partial<Filters>) => void;
  reset: () => void;
}

export function GiftFinder({ filters, gen, setFilter, reset }: Props) {
  // Phones only: the questions fold away so gifts show sooner. Always open on wider screens (see Shop.css).
  const [open, setOpen] = useState(false);
  const active = [filters.who !== 'any', filters.occ !== 'any', filters.budget < BUDGET_MAX].filter(Boolean).length;

  return (
    <section className="container finder-sec" style={{ paddingTop: 32 }}>
      <div className={`finder-card ${open ? '' : 'is-folded'}`}>
        <div className="finder-head">
          <div className="finder-title">
            <span className="finder-ic"><Sparkles size={20} aria-hidden="true" /></span>
            <h2>Gift Finder</h2>
          </div>
          <button className="finder-reset" onClick={reset}><RotateCcw size={16} strokeWidth={2.2} aria-hidden="true" />Start over</button>
          <button className={`finder-toggle ${open ? 'on' : ''}`} aria-expanded={open} aria-controls="finder-body" onClick={() => setOpen((o) => !o)}>
            {open ? 'Hide' : active ? `Refine · ${active} set` : 'Refine'}
            <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
        <div id="finder-body" className={`finder ${open ? '' : 'folded'}`}>
          <div role="group" aria-labelledby="f-who">
            <div id="f-who" className="finder-q">1 · WHO'S IT FOR?</div>
            <div className="chips">
              {whoOptions.map((o) => (
                <button key={o.id} className={`chip ${filters.who === o.id ? 'on' : ''}`} aria-pressed={filters.who === o.id} onClick={() => setFilter({ who: o.id })}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div role="group" aria-labelledby="f-occ">
            <div id="f-occ" className="finder-q">2 · WHAT'S THE OCCASION?</div>
            <div className="chips">
              {occasionOptions.map((o) => (
                <button key={o.id} className={`chip ${filters.occ === o.id ? 'on' : ''}`} aria-pressed={filters.occ === o.id} onClick={() => setFilter({ occ: o.id })}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="budget" className="finder-q" style={{ display: 'block' }}>3 · BUDGET</label>
            <div className="budget-v">Up to <span className={flip(gen, 'pa', 'pb')}>{money(filters.budget)}</span></div>
            <input
              id="budget"
              className="range"
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={500}
              value={filters.budget}
              aria-valuetext={money(filters.budget)}
              onChange={(e) => setFilter({ budget: Number(e.target.value) })}
            />
            <div className="range-ends"><span>{money(BUDGET_MIN)}</span><span>{money(BUDGET_MAX)}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

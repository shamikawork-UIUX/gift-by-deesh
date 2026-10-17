import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { products, vibeOptions, type Occasion, type Vibe, type Who } from '../../data/products';
import { GiftFinder } from './GiftFinder';
import { Toolbar } from './Toolbar';
import { ShopCard } from './ShopCard';
import { BoxTile, GuideTile } from './Tiles';
import { EmptyState } from './EmptyState';
import { QuickView } from './QuickView';
import './Shop.css';

export type SortKey = 'pop' | 'low' | 'high';
export interface Filters {
  who: Who | 'any';
  occ: Occasion | 'any';
  budget: number;
  vibe: Vibe | 'all';
  sort: SortKey;
}

export const BUDGET_MIN = 2000;
export const BUDGET_MAX = 15000;
const DEFAULTS: Filters = { who: 'any', occ: 'any', budget: BUDGET_MAX, vibe: 'all', sort: 'pop' };

function readFilters(p: URLSearchParams): Filters {
  const budget = Number(p.get('budget'));
  return {
    who: (p.get('who') as Filters['who']) || DEFAULTS.who,
    occ: (p.get('occ') as Filters['occ']) || DEFAULTS.occ,
    budget: budget >= BUDGET_MIN && budget <= BUDGET_MAX ? budget : DEFAULTS.budget,
    vibe: (p.get('vibe') as Filters['vibe']) || DEFAULTS.vibe,
    sort: (p.get('sort') as SortKey) || DEFAULTS.sort,
  };
}

export function ShopPage() {
  // Filters live in the URL so nav links like /shop?vibe=cuddly work and results are shareable.
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [gen, setGen] = useState(1);
  const [qvId, setQvId] = useState<string | null>(null);
  const prevSearch = useRef(params.toString());

  useEffect(() => {
    const s = params.toString();
    if (s !== prevSearch.current) {
      prevSearch.current = s;
      setGen((g) => g + 1);
    }
  }, [params]);

  const setFilter = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    (Object.keys(next) as (keyof Filters)[]).forEach((k) => {
      if (next[k] !== DEFAULTS[k]) p.set(k, String(next[k]));
    });
    setParams(p, { replace: true, preventScrollReset: true });
  };
  const reset = () => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true });

  const vibeBg = vibeOptions.find((v) => v.id === filters.vibe)?.bg ?? vibeOptions[0].bg;
  useEffect(() => {
    document.body.style.backgroundColor = vibeBg;
    return () => { document.body.style.backgroundColor = ''; };
  }, [vibeBg]);

  const list = useMemo(() => {
    const l = products.filter(
      (p) =>
        (filters.who === 'any' || p.who.includes(filters.who)) &&
        (filters.occ === 'any' || p.occ.includes(filters.occ)) &&
        p.price <= filters.budget &&
        (filters.vibe === 'all' || p.vibe === filters.vibe),
    );
    if (filters.sort === 'low') return l.sort((a, b) => a.price - b.price);
    if (filters.sort === 'high') return l.sort((a, b) => b.price - a.price);
    return l.sort((a, b) => a.pop - b.pop);
  }, [filters.who, filters.occ, filters.budget, filters.vibe, filters.sort]);

  const anim = gen % 2 ? 'inA' : 'inB';
  const cells: { key: string; node: JSX.Element; wide?: boolean }[] = [];
  list.forEach((p, i) => {
    cells.push({ key: p.id, node: <ShopCard product={p} onOpen={() => setQvId(p.id)} /> });
    if (i === 2 && list.length >= 4) cells.push({ key: 'box-tile', node: <BoxTile /> });
    if (i === 7 && list.length >= 9) {
      cells.push({
        key: 'guide-tile',
        wide: true,
        node: <GuideTile onPick={() => setFilter({ budget: 5000, vibe: 'sweet', who: 'any', occ: 'any' })} />,
      });
    }
  });

  return (
    <div className="shop-page">
      <section className="container shop-title">
        <nav aria-label="Breadcrumb" className="crumbs"><Link to="/">Home</Link> / <span aria-current="page">Shop Gifts</span></nav>
        <div className="sec-head" style={{ marginTop: 14 }}>
          <h1 className="shop-h1">Find their perfect <span>gift</span></h1>
          <p className="sec-lede">Answer three quick questions, or just browse. Every gift is hand-wrapped and delivered islandwide.</p>
        </div>
      </section>

      <GiftFinder filters={filters} gen={gen} setFilter={setFilter} reset={reset} />
      <Toolbar filters={filters} count={list.length} gen={gen} setFilter={setFilter} />

      <section className="container shop-grid-sec" aria-label="Gifts">
        {list.length > 0 ? (
          <div className="sgrid">
            {cells.map((c, i) => (
              <div key={c.key} className={`cell ${anim} ${c.wide ? 'wide' : ''}`} style={{ animationDelay: `${Math.min(i, 12) * 55}ms` }}>
                {c.node}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState onReset={reset} />
        )}
      </section>

      {qvId && <QuickView id={qvId} onClose={() => setQvId(null)} />}
    </div>
  );
}

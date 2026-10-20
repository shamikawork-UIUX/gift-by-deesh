import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { occasionOptions, products, vibeOptions, whoOptions, type Occasion, type Product, type Vibe, type Who } from '../../data/products';
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
  /** Free-text search */
  q: string;
}

// Slider starts at the cheapest gift (rounded down to the 500 step) so every position can match something.
export const BUDGET_MIN = Math.floor(Math.min(...products.map((p) => p.price)) / 500) * 500;
export const BUDGET_MAX = 15000;
const DEFAULTS: Filters = { who: 'any', occ: 'any', budget: BUDGET_MAX, vibe: 'all', sort: 'pop', q: '' };

/** Extra words people search with, per vibe ("chocolate" should find the Kinder bouquets). */
const vibeWords: Record<Vibe, string> = {
  sweet: 'chocolate chocolates sweet sweets treats kinder',
  cuddly: 'teddy teddies bear plush plushie soft cuddly toy',
  playful: 'toy toys car cars playful kids fun',
  fancy: 'fancy luxury premium chocolate',
};

const label = <T extends string>(opts: { id: T; label: string }[], id: T) => opts.find((o) => o.id === id)?.label ?? '';

function searchText(p: Product) {
  return [
    p.name, p.note, p.vibe, vibeWords[p.vibe],
    ...p.who.map((w) => label(whoOptions, w)),
    ...p.occ.map((o) => label(occasionOptions, o)),
  ].join(' ').toLowerCase();
}

/** Every word typed must appear somewhere in the product's text. */
function matchesQuery(p: Product, q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = searchText(p);
  return words.every((w) => text.includes(w));
}

function readFilters(p: URLSearchParams): Filters {
  const budget = Number(p.get('budget'));
  return {
    who: (p.get('who') as Filters['who']) || DEFAULTS.who,
    occ: (p.get('occ') as Filters['occ']) || DEFAULTS.occ,
    budget: budget >= BUDGET_MIN && budget <= BUDGET_MAX ? budget : DEFAULTS.budget,
    vibe: (p.get('vibe') as Filters['vibe']) || DEFAULTS.vibe,
    sort: (p.get('sort') as SortKey) || DEFAULTS.sort,
    q: p.get('q') ?? DEFAULTS.q,
  };
}

export function ShopPage() {
  // Filters live in the URL so nav links like /shop?vibe=cuddly work and results are shareable.
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [gen, setGen] = useState(1);
  const [qvId, setQvId] = useState<string | null>(null);
  const prevSearch = useRef(params.toString());
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // The header search icon links here with { focusSearch: true }.
  useEffect(() => {
    if ((location.state as { focusSearch?: boolean } | null)?.focusSearch) searchRef.current?.focus();
  }, [location.key, location.state]);

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
        (filters.vibe === 'all' || p.vibe === filters.vibe) &&
        matchesQuery(p, filters.q),
    );
    if (filters.sort === 'low') return l.sort((a, b) => a.price - b.price);
    if (filters.sort === 'high') return l.sort((a, b) => b.price - a.price);
    return l.sort((a, b) => a.pop - b.pop);
  }, [filters.who, filters.occ, filters.budget, filters.vibe, filters.sort, filters.q]);

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
        <div className="shop-search" role="search">
          <Search size={20} aria-hidden="true" />
          <label htmlFor="shop-q" className="sr-only">Search gifts</label>
          <input
            id="shop-q"
            ref={searchRef}
            type="search"
            placeholder="Search, e.g. teddy or Ferrero"
            autoComplete="off"
            enterKeyHint="search"
            value={filters.q}
            onChange={(e) => setFilter({ q: e.target.value })}
          />
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
          <EmptyState onReset={reset} query={filters.q.trim()} />
        )}
      </section>

      {qvId && <QuickView id={qvId} onClose={() => setQvId(null)} />}
    </div>
  );
}

import { vibeOptions } from '../../data/products';
import { flip } from '../../lib/format';
import type { Filters, SortKey } from './ShopPage';

interface Props {
  filters: Filters;
  count: number;
  gen: number;
  setFilter: (p: Partial<Filters>) => void;
}

export function Toolbar({ filters, count, gen, setFilter }: Props) {
  return (
    <section className="container toolbar-sec">
      <div className="toolbar">
        <div className="vibes" role="group" aria-label="Vibe">
          {vibeOptions.map((v) => (
            <button key={v.id} className={`vibe ${filters.vibe === v.id ? 'on' : ''}`} aria-pressed={filters.vibe === v.id} onClick={() => setFilter({ vibe: v.id })}>
              <span className="vdot" style={{ background: v.dot }} aria-hidden="true" />{v.label}
            </button>
          ))}
        </div>
        <div className="toolbar-r">
          <div role="status" className="match">
            <strong className={flip(gen, 'pa', 'pb')}>{count}</strong> {count === 1 ? 'gift matches' : 'gifts match'}
          </div>
          <label className="sort">
            Sort
            <select value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value as SortKey })}>
              <option value="pop">Most loved</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}

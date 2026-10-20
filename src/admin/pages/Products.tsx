import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, PackageSearch, Plus } from 'lucide-react';
import { api, type AdminProduct } from '../lib/api';
import { useCan } from '../lib/session';
import { useApi } from '../lib/useApi';
import { money } from '../lib/format';
import { Badge, Button, EmptyState, ErrorState, FilterPills, Notice, PageHeader, SearchBox, Skeleton, Toggle, btn } from '../ui/ui';
import { toast } from '../ui/toast';
import { vibeOptions } from '../../data/products';

type Show = 'all' | 'live' | 'hidden';
export const vibeLabel = (v: string) => vibeOptions.find((o) => o.id === v)?.label ?? v;

export function Products() {
  const can = useCan();
  const editable = can('products.edit');
  const { data, setData, error, loading, reload } = useApi<{ products: AdminProduct[] }>('/products');
  const [show, setShow] = useState<Show>('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');

  const all = data?.products ?? [];
  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return all.filter((p) => (show === 'all' || (show === 'live' ? p.active : !p.active)) && words.every((w) => `${p.name} ${p.note} ${vibeLabel(p.vibe)}`.toLowerCase().includes(w)));
  }, [all, show, q]);

  const setActive = async (p: AdminProduct, active: boolean, undoable = true) => {
    setBusy(p.id);
    try {
      const r = await api<{ product: AdminProduct }>(`/products/${p.id}`, { method: 'PATCH', body: { active } });
      setData((d) => d && { products: d.products.map((x) => (x.id === p.id ? r.product : x)) });
      toast.ok(active ? `“${p.name}” is on the website` : `“${p.name}” is hidden from the website`, undoable ? { label: 'Undo', run: () => void setActive(r.product, !active, false) } : undefined);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="a-page">
      <PageHeader
        title="Products"
        subtitle={data ? `${all.filter((p) => p.active).length} on the website · ${all.filter((p) => !p.active).length} hidden` : 'What customers can order from the shop.'}
        actions={editable && <Link to="/admin/products/new" className={btn('primary')}><Plus size={18} aria-hidden="true" />Add product</Link>}
      />
      {!editable && <Notice>You can view products. Ask a manager or the owner to add or change them.</Notice>}

      <div className="a-toolbar">
        <FilterPills<Show> label="Show products" value={show} onChange={setShow} items={[
          { id: 'all', label: 'All', count: all.length },
          { id: 'live', label: 'On the website', count: all.filter((p) => p.active).length },
          { id: 'hidden', label: 'Hidden', count: all.filter((p) => !p.active).length },
        ]} />
        <SearchBox value={q} onChange={setQ} label="Search products" placeholder="Search by name" />
      </div>

      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading && !data && <Skeleton rows={6} />}
      {data && list.length === 0 && (
        <EmptyState icon={PackageSearch} title={q ? `No products match “${q}”` : 'No products here'}
          action={q ? <Button onClick={() => setQ('')}>Clear search</Button> : editable && <Link to="/admin/products/new" className={btn('primary')}>Add product</Link>} />
      )}

      <ul className="a-product-grid">
        {list.map((p) => (
          <li key={p.id} className={`a-product ${p.active ? '' : 'is-hidden'}`}>
            <Link to={`/admin/products/${p.id}`} className="a-product-link" aria-label={`${editable ? 'Edit' : 'View'} ${p.name}`}>
              <div className="a-product-img" style={{ background: p.tint }}>
                {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="a-product-noimg"><ImageIcon size={26} aria-hidden="true" />No photo yet</span>}
                {p.badge && <Badge tone={p.badge === 'New' ? 'ink' : 'pink'}>{p.badge}</Badge>}
              </div>
              <div className="a-product-body">
                <strong>{p.name}</strong>
                <span className="a-muted a-small">{p.note || vibeLabel(p.vibe)}</span>
                <span className="a-product-price">{money(p.price)}</span>
              </div>
            </Link>
            <div className="a-product-foot">
              {editable ? (
                <Toggle label="On the website" checked={p.active} disabled={busy === p.id} onChange={(v) => void setActive(p, v)} />
              ) : (
                <Badge tone={p.active ? 'green' : 'grey'}>{p.active ? 'On the website' : 'Hidden'}</Badge>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

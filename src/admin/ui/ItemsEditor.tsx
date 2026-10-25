import { useId } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { AdminProduct, OrderItem } from '../lib/api';
import { useApi } from '../lib/useApi';
import { money } from '../lib/format';
import { Button, IconButton } from './ui';

export interface EditableItem extends OrderItem {
  key: string;
}

let seq = 0;
export const toEditable = (items: OrderItem[]): EditableItem[] => items.map((i) => ({ ...i, details: [...(i.details ?? [])], key: `i${++seq}` }));
export const blankItem = (): EditableItem => ({ key: `i${++seq}`, name: '', price: 0, qty: 1, details: [] });

/** Problems that would stop saving, keyed by item key, with a message per field. */
export function itemErrors(items: EditableItem[]) {
  const errs: Record<string, { name?: string; price?: string }> = {};
  items.forEach((i) => {
    const e: { name?: string; price?: string } = {};
    if (!i.name.trim()) e.name = 'Add a name';
    if (!Number.isInteger(i.price) || i.price < 0) e.price = 'Enter a price';
    if (e.name || e.price) errs[i.key] = e;
  });
  return errs;
}

export function ItemsEditor({ items, onChange, showErrors }: { items: EditableItem[]; onChange: (items: EditableItem[]) => void; showErrors: boolean }) {
  const { data } = useApi<{ products: AdminProduct[] }>('/products');
  const pickId = useId();
  const errs = showErrors ? itemErrors(items) : {};
  const update = (key: string, patch: Partial<EditableItem>) => onChange(items.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const addProduct = (id: string) => {
    const p = data?.products.find((x) => x.id === id);
    if (!p) return;
    const same = items.find((i) => i.name === p.name && i.price === p.price && !i.details.length);
    if (same) update(same.key, { qty: Math.min(99, same.qty + 1) });
    else onChange([...items.filter((i) => i.name || i.price), { ...blankItem(), name: p.name, price: p.price }]);
  };

  return (
    <div className="a-items-editor">
      <ul className="a-items-rows">
        {items.map((i, idx) => (
          <li key={i.key} className="a-item-row">
            <div className="a-field">
              <label htmlFor={`${i.key}-n`} className="sr-only">Item {idx + 1} name</label>
              <input id={`${i.key}-n`} className={`a-input ${errs[i.key]?.name ? 'bad' : ''}`} placeholder="Item name" value={i.name} maxLength={120}
                onChange={(e) => update(i.key, { name: e.target.value })} aria-invalid={!!errs[i.key]?.name} />
              {errs[i.key]?.name && <p className="a-field-error">{errs[i.key]!.name}</p>}
            </div>
            <div className="a-field a-item-price">
              <label htmlFor={`${i.key}-p`} className="sr-only">Item {idx + 1} price in LKR</label>
              <div className="a-input-prefix"><span aria-hidden="true">LKR</span>
                <input id={`${i.key}-p`} className={`a-input ${errs[i.key]?.price ? 'bad' : ''}`} inputMode="numeric" value={i.price || ''} placeholder="0"
                  onChange={(e) => update(i.key, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })} aria-invalid={!!errs[i.key]?.price} />
              </div>
              {errs[i.key]?.price && <p className="a-field-error">{errs[i.key]!.price}</p>}
            </div>
            <div className="a-stepper" role="group" aria-label={`Quantity of item ${idx + 1}`}>
              <IconButton icon={Minus} label="One less" onClick={() => update(i.key, { qty: Math.max(1, i.qty - 1) })} disabled={i.qty <= 1} />
              <span aria-live="polite">{i.qty}</span>
              <IconButton icon={Plus} label="One more" onClick={() => update(i.key, { qty: Math.min(99, i.qty + 1) })} />
            </div>
            <span className="a-item-line">{money(i.price * i.qty)}</span>
            <IconButton icon={Trash2} label={`Remove ${i.name || `item ${idx + 1}`}`} onClick={() => onChange(items.filter((x) => x.key !== i.key))} disabled={items.length <= 1} />
            {i.details.length > 0 && <ul className="a-item-details">{i.details.map((d) => <li key={d}>{d}</li>)}</ul>}
          </li>
        ))}
      </ul>
      <div className="a-items-add">
        <label htmlFor={pickId} className="sr-only">Add a product from the shop</label>
        <select id={pickId} className="a-input" value="" onChange={(e) => addProduct(e.target.value)} disabled={!data}>
          <option value="">{data ? 'Add a product from the shop…' : 'Loading products…'}</option>
          {data?.products.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}{p.active ? '' : ' (hidden)'}</option>)}
        </select>
        <Button icon={Plus} onClick={() => onChange([...items, blankItem()])}>Custom item</Button>
      </div>
    </div>
  );
}

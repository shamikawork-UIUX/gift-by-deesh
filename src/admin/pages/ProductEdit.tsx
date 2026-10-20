import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImageIcon, ImagePlus, Trash2, Upload } from 'lucide-react';
import { api, type AdminProduct } from '../lib/api';
import { useCan } from '../lib/session';
import { money } from '../lib/format';
import { useUnsavedChanges } from '../lib/useUnsavedChanges';
import { Badge, Button, Card, ChipGroup, ConfirmDialog, ErrorState, Field, Notice, PageHeader, Skeleton, Toggle, describedBy } from '../ui/ui';
import { toast } from '../ui/toast';
import { occasionOptions, vibeOptions, whoOptions } from '../../data/products';
import { kokoPart } from '../../lib/format';

const TINTS = ['#F7D3DE', '#FCE4EC', '#FDE7E4', '#FCE6CF', '#F6E7D3', '#F4E6D6', '#FBF0D2', '#D8EDE2', '#DDE9F7', '#DCE4F3', '#E6E2F0', '#EADDF2'];
const PAPERS = ['#E9A3BA', '#EFA3BB', '#F2B4C8', '#D9B48A', '#EDB98A', '#B9875C', '#D9A441', '#8FC7A9', '#B79BD0', '#E8463B', '#2A3058'];
const vibeHelp: Record<string, string> = { sweet: 'Chocolates and treats', cuddly: 'Teddies and plushies', playful: 'Toys and fun', fancy: 'Premium gifts' };

/** Slightly darker shade for the "in hand" placeholder photo. */
function shade(hex: string, amt = -0.06) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 + amt))));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Resizes to max 1200px and re-encodes (WebP when the browser can), so uploads stay small on mobile data. */
async function prepareImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Please choose a JPG, PNG or WebP photo.');
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL('image/webp', 0.85);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
}

type Form = { name: string; note: string; price: number; who: string[]; occ: string[]; vibe: string; tint: string; paper: string; badge: '' | 'Bestseller' | 'New'; pop: number; active: boolean };
const blank: Form = { name: '', note: '', price: 0, who: [], occ: [], vibe: '', tint: TINTS[0], paper: PAPERS[0], badge: '', pop: 100, active: true };
const toForm = (p: AdminProduct): Form => ({ name: p.name, note: p.note, price: p.price, who: p.who, occ: p.occ, vibe: p.vibe, tint: p.tint, paper: p.paper, badge: p.badge ?? '', pop: p.pop, active: p.active });

export function ProductEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const can = useCan();
  const editable = can('products.edit');

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loadError, setLoadError] = useState('');
  const [f, setF] = useState<Form>(blank);
  const [saved, setSaved] = useState<Form>(blank);
  const [photo, setPhoto] = useState<string | null>(null); // new photo waiting to upload
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<null | 'delete' | 'leave' | 'photo'>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    api<{ product: AdminProduct }>(`/products/${encodeURIComponent(id!)}`)
      .then((r) => { setProduct(r.product); setF(toForm(r.product)); setSaved(toForm(r.product)); })
      .catch((e) => setLoadError((e as Error).message));
  }, [id, isNew]);

  const dirty = JSON.stringify(f) !== JSON.stringify(saved) || !!photo;
  useUnsavedChanges(editable && dirty && !busy);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const errs = tried ? {
    name: !f.name.trim() ? 'Give the product a name.' : '',
    price: !f.price ? 'Enter the price in LKR.' : '',
    who: !f.who.length ? 'Choose at least one.' : '',
    occ: !f.occ.length ? 'Choose at least one.' : '',
    vibe: !f.vibe ? 'Choose one.' : '',
  } : { name: '', price: '', who: '', occ: '', vibe: '' };

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    try { setPhoto(await prepareImage(file)); } catch (e) { toast.error((e as Error).message); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    setError('');
    if (!f.name.trim() || !f.price || !f.who.length || !f.occ.length || !f.vibe) {
      window.setTimeout(() => document.querySelector<HTMLElement>('.has-error input, .has-error button')?.focus(), 0);
      return;
    }
    setBusy(true);
    try {
      const body = { ...f, badge: f.badge || null, tint2: shade(f.tint) };
      let p = (await api<{ product: AdminProduct }>(isNew ? '/products' : `/products/${product!.id}`, { method: isNew ? 'POST' : 'PATCH', body })).product;
      if (photo) {
        try {
          p = (await api<{ product: AdminProduct }>(`/products/${p.id}/image`, { method: 'POST', body: { dataUrl: photo } })).product;
        } catch (err) {
          toast.error(`Saved, but the photo didn't upload: ${(err as Error).message}`);
        }
      }
      setPhoto(null);
      setProduct(p);
      setF(toForm(p));
      setSaved(toForm(p));
      setTried(false);
      toast.ok(isNew ? `“${p.name}” added${p.active ? ' to the website' : ' (hidden)'}` : 'Changes saved');
      if (isNew) navigate(`/admin/products/${p.id}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!product) return;
    setBusy(true);
    try {
      const r = await api<{ product: AdminProduct }>(`/products/${product.id}/image`, { method: 'DELETE' });
      setProduct(r.product);
      setConfirm(null);
      toast.ok('Photo removed');
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const del = async () => {
    setBusy(true);
    try {
      await api(`/products/${product!.id}`, { method: 'DELETE' });
      setSaved(f); setPhoto(null);
      toast.ok(`“${product!.name}” deleted`);
      navigate('/admin/products', { replace: true });
    } catch (e) { toast.error((e as Error).message); setBusy(false); }
  };

  const title = isNew ? 'Add product' : product?.name ?? 'Product';
  if (loadError) return <div className="a-page"><PageHeader title="Product" back="/admin/products" /><ErrorState message={loadError} /></div>;
  if (!isNew && !product) return <div className="a-page"><PageHeader title="Product" back="/admin/products" /><Skeleton rows={8} /></div>;

  const shownImage = photo ?? product?.image;

  return (
    <div className="a-page a-page-task">
      <PageHeader title={title} back="/admin/products" subtitle={!isNew && product && (product.active ? <Badge tone="green">On the website</Badge> : <Badge tone="grey">Hidden from the website</Badge>)} />
      {!editable && <Notice>You can view this product. Ask a manager or the owner to change it.</Notice>}

      <form onSubmit={submit} noValidate className="a-form-page">
        <fieldset disabled={!editable || busy} className="a-plain-fieldset">
          <div className="a-detail">
            <div className="a-detail-main">
              <Card title="Photo" id="pe-photo">
                <div className="a-photo-edit">
                  <div className="a-photo-frame" style={{ background: f.tint }}>
                    {shownImage ? <img src={shownImage} alt={`Photo of ${f.name || 'the product'}`} /> : <span className="a-product-noimg"><ImageIcon size={30} aria-hidden="true" />No photo yet</span>}
                  </div>
                  <div className="a-photo-actions">
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="pe-file" tabIndex={-1} aria-hidden="true" onChange={(e) => void pickPhoto(e.target.files?.[0])} />
                    <label htmlFor="pe-file" role="button" className="a-btn a-btn-secondary" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}>
                      {shownImage ? <Upload size={18} aria-hidden="true" /> : <ImagePlus size={18} aria-hidden="true" />}{shownImage ? 'Replace photo' : 'Add photo'}
                    </label>
                    {photo && <Button variant="ghost" onClick={() => setPhoto(null)}>Undo new photo</Button>}
                    {!photo && product?.image && <Button variant="ghost" icon={Trash2} onClick={() => setConfirm('photo')}>Remove photo</Button>}
                    <p className="a-hint">Square photos look best. Large photos are shrunk automatically.{photo && ' The new photo is saved when you press Save.'}</p>
                  </div>
                </div>
              </Card>

              <Card title="Details" id="pe-basics">
                <Field label="Product name" htmlFor="pe-name" error={errs.name}>
                  <input id="pe-name" className="a-input" value={f.name} maxLength={80} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errs.name} aria-describedby={describedBy('pe-name', errs.name)} autoFocus={isNew} />
                </Field>
                <Field label="Short description" htmlFor="pe-note" optional hint="One line under the name, e.g. “75 pcs, hand-wrapped”.">
                  <input id="pe-note" className="a-input" value={f.note} maxLength={80} onChange={(e) => set('note', e.target.value)} aria-describedby="pe-note-hint" />
                </Field>
                <Field label="Price" htmlFor="pe-price" error={errs.price} hint={f.price ? `Customers also see “or 3 × ${money(kokoPart(f.price))} with KOKO”.` : undefined}>
                  <div className="a-input-prefix"><span aria-hidden="true">LKR</span>
                    <input id="pe-price" className="a-input" inputMode="numeric" value={f.price || ''} placeholder="0" onChange={(e) => set('price', Number(e.target.value.replace(/\D/g, '')) || 0)}
                      aria-invalid={!!errs.price} aria-describedby={describedBy('pe-price', errs.price, f.price)} />
                  </div>
                </Field>
              </Card>

              <Card title="Where it shows in the Gift Finder" id="pe-filters">
                <ChipGroup label="Who is it for?" multiple options={whoOptions.filter((o) => o.id !== 'any') as { id: string; label: string }[]} value={f.who} onChange={(v) => set('who', v)} error={errs.who} />
                <ChipGroup label="Occasions" multiple options={occasionOptions.filter((o) => o.id !== 'any') as { id: string; label: string }[]} value={f.occ} onChange={(v) => set('occ', v)} error={errs.occ} />
                <ChipGroup label="Vibe (shop filter)" options={vibeOptions.filter((o) => o.id !== 'all').map((o) => ({ id: o.id, label: `${o.label} · ${vibeHelp[o.id]}` }))} value={f.vibe ? [f.vibe] : []} onChange={(v) => set('vibe', v[0])} error={errs.vibe} />
              </Card>
            </div>

            <aside className="a-detail-side">
              <Card title="On the website" id="pe-vis">
                <Toggle label="Show on the website" description={f.active ? 'Customers can see and order it.' : 'Hidden. Nothing is deleted, and you can show it again any time.'} checked={f.active} onChange={(v) => set('active', v)} />
              </Card>

              <Card title="Preview" id="pe-prev">
                <div className="a-preview-card">
                  <div className="a-preview-img" style={{ background: f.tint }}>
                    {shownImage ? <img src={shownImage} alt="" /> : <span className="a-product-noimg"><ImageIcon size={24} aria-hidden="true" />Photo — {f.name || 'product'}</span>}
                    {f.badge && <span className="a-preview-badge" style={{ background: f.badge === 'New' ? 'var(--ink)' : 'var(--pink)' }}>{f.badge}</span>}
                  </div>
                  <div className="a-preview-body">
                    <strong>{f.name || 'Product name'}</strong>
                    <span className="a-muted a-small">{f.note || 'Short description'}</span>
                    <span><span className="a-muted a-small">from </span><strong>{money(f.price || 0)}</strong></span>
                  </div>
                </div>
              </Card>

              <Card title="Look & order" id="pe-look">
                <ChipGroup label="Badge" options={[{ id: '', label: 'None' }, { id: 'Bestseller', label: 'Bestseller' }, { id: 'New', label: 'New' }] as { id: Form['badge']; label: string }[]} value={[f.badge]} onChange={(v) => set('badge', v[0])} />
                <fieldset className="a-field a-fieldset">
                  <legend>Photo background</legend>
                  <div className="a-swatches">
                    {TINTS.map((c) => <button key={c} type="button" className={`a-swatch ${f.tint === c ? 'on' : ''}`} style={{ background: c }} aria-label={`Background ${c}`} aria-pressed={f.tint === c} onClick={() => set('tint', c)} />)}
                  </div>
                  <p className="a-hint">Shown behind the photo, or instead of it while there's no photo.</p>
                </fieldset>
                <fieldset className="a-field a-fieldset">
                  <legend>Wrapping paper (for the “Wrapped” preview)</legend>
                  <div className="a-swatches">
                    {PAPERS.map((c) => <button key={c} type="button" className={`a-swatch ${f.paper === c ? 'on' : ''}`} style={{ background: c }} aria-label={`Wrapping ${c}`} aria-pressed={f.paper === c} onClick={() => set('paper', c)} />)}
                  </div>
                </fieldset>
                <Field label="Position in “Most loved”" htmlFor="pe-pop" hint="1 shows first. Products with the same number are sorted by name.">
                  <input id="pe-pop" className="a-input a-input-short" inputMode="numeric" value={f.pop} onChange={(e) => set('pop', Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1))} aria-describedby="pe-pop-hint" />
                </Field>
              </Card>

              {!isNew && editable && (
                <Card title="Delete" id="pe-del" className="a-danger-card">
                  <p className="a-hint">Deleting removes it for good. Past orders keep the item name and price. If it might come back, hide it instead.</p>
                  <Button variant="danger" icon={Trash2} onClick={() => setConfirm('delete')}>Delete product</Button>
                </Card>
              )}
            </aside>
          </div>
        </fieldset>

        {editable && (
          <>
            {error && <p className="a-form-error" role="alert">{error}</p>}
            <div className="a-savebar">
              <span className="a-savebar-status a-muted a-small" aria-live="polite">{dirty ? 'Unsaved changes' : isNew ? '' : 'All changes saved'}</span>
              <Button onClick={() => (dirty ? setConfirm('leave') : navigate('/admin/products'))}>{dirty ? 'Cancel' : 'Back'}</Button>
              <Button type="submit" variant="primary" loading={busy} disabled={!isNew && !dirty}>{isNew ? 'Add product' : 'Save changes'}</Button>
            </div>
          </>
        )}
      </form>

      {confirm === 'delete' && (
        <ConfirmDialog title={`Delete “${product?.name}”?`} confirmLabel="Delete for good" busy={busy} onClose={() => setConfirm(null)} onConfirm={() => void del()}>
          <p>This can't be undone. To take it off the website for now, use <strong>Show on the website</strong> instead.</p>
        </ConfirmDialog>
      )}
      {confirm === 'leave' && (
        <ConfirmDialog title="Discard your changes?" confirmLabel="Discard" onClose={() => setConfirm(null)} onConfirm={() => { setF(saved); setPhoto(null); navigate('/admin/products'); }}>
          <p>Anything you changed since the last save will be lost.</p>
        </ConfirmDialog>
      )}
      {confirm === 'photo' && (
        <ConfirmDialog title="Remove the photo?" confirmLabel="Remove photo" busy={busy} onClose={() => setConfirm(null)} onConfirm={() => void removePhoto()}>
          <p>The coloured placeholder will show instead until you add a new one.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

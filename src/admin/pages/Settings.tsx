import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { phoneLocal } from '../lib/format';
import { useUnsavedChanges } from '../lib/useUnsavedChanges';
import { Button, Card, ErrorState, Field, Notice, PageHeader, Skeleton, describedBy } from '../ui/ui';
import { toast } from '../ui/toast';
import type { ShopSettings } from '../../store/catalog';

type Key = keyof ShopSettings;
interface Def { key: Key; label: string; hint: string; type?: 'text' | 'datetime-local' | 'tel'; short?: boolean }

const groups: { title: string; lede: string; fields: Def[] }[] = [
  { title: 'Delivery & opening hours', lede: 'Shown in the top banner on the Shop page, in the FAQs, on the About page and in the footer.', fields: [
    { key: 'cutoffTime', label: 'Order cut-off time', hint: 'e.g. “2 pm”. Used in “Order by 2 pm for next-day delivery”.', short: true },
    { key: 'cutoffArea', label: 'Next-day delivery area', hint: 'e.g. “Colombo & suburbs”.' },
    { key: 'deliveryDays', label: 'Delivery time for other areas', hint: 'e.g. “2–3”. Used in “usually take 2–3 working days”.', short: true },
    { key: 'shopHours', label: 'Opening hours', hint: 'e.g. “Open Mon–Sat, 9 am – 7 pm”.' },
  ] },
  { title: 'Orders', lede: 'Where website orders are sent.', fields: [
    { key: 'orderWhatsApp', label: 'WhatsApp number for orders', hint: 'Sri Lankan mobile. Every “Send order on WhatsApp” goes to this chat.', type: 'tel' },
  ] },
  { title: 'This week’s offer', lede: 'The countdown box at the top of the Offers page.', fields: [
    { key: 'weeklyOfferTitle', label: 'Offer title', hint: 'e.g. “Bouquet Week · 15% off all bouquets”.' },
    { key: 'weeklyOfferBadge', label: 'Badge', hint: 'Short, e.g. “15%”.', short: true },
    { key: 'offerEnd', label: 'Offer ends', hint: 'Sri Lanka time. The countdown hides itself after this.', type: 'datetime-local' },
  ] },
  { title: 'Coupon', lede: 'Revealed by the “Unwrap a deal” gift box on the Offers page. Staff apply it in the WhatsApp chat.', fields: [
    { key: 'couponCode', label: 'Code', hint: 'Letters and numbers, e.g. SWEET10.', short: true },
    { key: 'couponLabel', label: 'What it gives', hint: 'e.g. “10% off your first order”.' },
    { key: 'couponShort', label: 'Big number on the ticket', hint: 'e.g. “10%”.', short: true },
  ] },
];

const isPlaceholder = (v: string) => /\[[^\]]+\]/.test(v);

export function Settings() {
  const [saved, setSaved] = useState<ShopSettings | null>(null);
  const [f, setF] = useState<ShopSettings | null>(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api<{ settings: ShopSettings }>('/settings')
    .then((r) => { const s = { ...r.settings, orderWhatsApp: phoneLocal(r.settings.orderWhatsApp) }; setSaved(s); setF(s); setLoadError(''); })
    .catch((e) => setLoadError((e as Error).message));
  useEffect(() => { void load(); }, []);

  const dirty = !!f && !!saved && JSON.stringify(f) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ settings: ShopSettings }>('/settings', { method: 'PUT', body: f });
      const s = { ...r.settings, orderWhatsApp: phoneLocal(r.settings.orderWhatsApp) };
      setSaved(s); setF(s);
      toast.ok('Settings saved. The website shows them straight away.');
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  if (loadError) return <div className="a-page"><PageHeader title="Shop settings" /><ErrorState message={loadError} onRetry={() => void load()} /></div>;
  if (!f) return <div className="a-page"><PageHeader title="Shop settings" /><Skeleton rows={8} /></div>;
  const placeholders = (Object.keys(f) as Key[]).filter((k) => isPlaceholder(f[k]));

  return (
    <div className="a-page a-page-task-desktop">
      <PageHeader title="Shop settings" subtitle="Details customers see on the website." />
      {placeholders.length > 0 && (
        <Notice tone="warn" title={`${placeholders.length} ${placeholders.length === 1 ? 'field still shows' : 'fields still show'} a placeholder`}>
          Customers currently see text like <code>[TIME]</code>. Fill in the fields marked below.
        </Notice>
      )}
      <form onSubmit={submit} noValidate className="a-form-page">
        {groups.map((g) => (
          <Card key={g.title} title={g.title} id={`st-${g.fields[0].key}`}>
            <p className="a-card-lede">{g.lede}</p>
            <div className="a-form-2">
              {g.fields.map((d) => {
                const id = `st-${d.key}`;
                const warn = isPlaceholder(f[d.key]);
                return (
                  <Field key={d.key} label={d.label} htmlFor={id} hint={<>{warn && <span className="a-warn-inline"><AlertTriangle size={14} aria-hidden="true" /> Still a placeholder. </span>}{d.hint}</>}>
                    <input id={id} className={`a-input ${d.short ? 'a-input-short' : ''} ${warn ? 'warn' : ''}`} type={d.type ?? 'text'} inputMode={d.type === 'tel' ? 'tel' : undefined}
                      value={f[d.key]} maxLength={120} onChange={(e) => setF({ ...f, [d.key]: e.target.value })} aria-describedby={describedBy(id, undefined, true)} />
                  </Field>
                );
              })}
            </div>
          </Card>
        ))}
        {error && <p className="a-form-error" role="alert">{error}</p>}
        <div className="a-savebar">
          <span className="a-savebar-status a-muted a-small" aria-live="polite">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <Button onClick={() => saved && setF(saved)} disabled={!dirty}>Undo changes</Button>
          <Button type="submit" variant="primary" loading={busy} disabled={!dirty}>Save settings</Button>
        </div>
      </form>
    </div>
  );
}

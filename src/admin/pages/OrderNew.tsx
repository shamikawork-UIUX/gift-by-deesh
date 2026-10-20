import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Order } from '../lib/api';
import { money, todayLK } from '../lib/format';
import { useUnsavedChanges } from '../lib/useUnsavedChanges';
import { refreshPulse } from '../lib/useApi';
import { Button, Card, ConfirmDialog, Field, PageHeader, Toggle, describedBy } from '../ui/ui';
import { ItemsEditor, blankItem, itemErrors, type EditableItem } from '../ui/ItemsEditor';
import { toast } from '../ui/toast';

const tomorrow = () => {
  const d = new Date(`${todayLK()}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function OrderNew() {
  const navigate = useNavigate();
  const [f, setF] = useState({ customerName: '', customerPhone: '', address: '', deliveryDate: tomorrow(), giftNote: '', staffNotes: '', deliveryFee: 0, payMethod: 'full' as 'full' | 'koko', paid: false, confirmed: true });
  const [items, setItems] = useState<EditableItem[]>([blankItem()]);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const dirty = !!(f.customerName || f.customerPhone || f.address || f.giftNote || f.staffNotes || items.some((i) => i.name || i.price));
  const [done, setDone] = useState(false);
  useUnsavedChanges(dirty && !done);

  const errs = {
    customerName: tried && !f.customerName.trim() ? 'Add the customer’s name.' : '',
    customerPhone: tried && !f.customerPhone.trim() ? 'Add a phone number so you can confirm on WhatsApp.' : '',
    items: tried && Object.keys(itemErrors(items)).length ? 'Every item needs a name and a price.' : '',
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    setError('');
    if (!f.customerName.trim() || !f.customerPhone.trim() || Object.keys(itemErrors(items)).length) {
      // Take people straight to the first problem.
      window.setTimeout(() => document.querySelector<HTMLElement>('.has-error input, .has-error textarea, .a-input.bad')?.focus(), 0);
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ order: Order }>('/orders', {
        method: 'POST',
        body: {
          customerName: f.customerName, customerPhone: f.customerPhone, address: f.address, deliveryDate: f.deliveryDate || null,
          giftNote: f.giftNote, staffNotes: f.staffNotes, deliveryFee: f.deliveryFee, payMethod: f.payMethod,
          paymentStatus: f.paid ? 'paid' : 'unpaid', status: f.confirmed ? 'confirmed' : 'new',
          items: items.map(({ key, ...i }) => i),
        },
      });
      setDone(true);
      refreshPulse();
      toast.ok(`Order ${r.order.ref} added`);
      navigate(`/admin/orders/${r.order.ref}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => (dirty ? setLeaving(true) : navigate('/admin/orders'));

  return (
    <div className="a-page a-page-task">
      <PageHeader title="New order" subtitle="For orders that came in by phone, Instagram or a WhatsApp chat." back="/admin/orders" />
      <form onSubmit={submit} noValidate className="a-form-page">
        <div className="a-detail">
          <div className="a-detail-main">
            <Card title="Customer" id="on-cust">
              <div className="a-form-2">
                <Field label="Name" htmlFor="on-name" error={errs.customerName}>
                  <input id="on-name" className="a-input" value={f.customerName} maxLength={80} onChange={(e) => set('customerName', e.target.value)} aria-invalid={!!errs.customerName} aria-describedby={describedBy('on-name', errs.customerName)} autoFocus />
                </Field>
                <Field label="Phone (WhatsApp)" htmlFor="on-phone" error={errs.customerPhone} hint="e.g. 077 123 4567">
                  <input id="on-phone" className="a-input" type="tel" inputMode="tel" value={f.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} aria-invalid={!!errs.customerPhone} aria-describedby={describedBy('on-phone', errs.customerPhone, true)} />
                </Field>
              </div>
              <Field label="Delivery address" htmlFor="on-addr" optional hint="Add the recipient’s name and number if it’s a gift for someone else.">
                <textarea id="on-addr" className="a-input" rows={3} maxLength={400} value={f.address} onChange={(e) => set('address', e.target.value)} aria-describedby="on-addr-hint" />
              </Field>
            </Card>

            <Card title="Items" id="on-items">
              {errs.items && <p className="a-form-error" role="alert">{errs.items}</p>}
              <ItemsEditor items={items} onChange={setItems} showErrors={tried} />
            </Card>

            <Card title="Delivery" id="on-del">
              <div className="a-form-2">
                <Field label="Delivery date" htmlFor="on-date"><input id="on-date" className="a-input" type="date" value={f.deliveryDate} onChange={(e) => set('deliveryDate', e.target.value)} /></Field>
                <Field label="Delivery fee" htmlFor="on-fee" optional>
                  <div className="a-input-prefix"><span aria-hidden="true">LKR</span>
                    <input id="on-fee" className="a-input" inputMode="numeric" value={f.deliveryFee || ''} placeholder="0" onChange={(e) => set('deliveryFee', Number(e.target.value.replace(/\D/g, '')) || 0)} />
                  </div>
                </Field>
              </div>
              <Field label="Gift note" htmlFor="on-note" optional hint="Written on the card that goes with the gift.">
                <textarea id="on-note" className="a-input" rows={2} maxLength={200} value={f.giftNote} onChange={(e) => set('giftNote', e.target.value)} aria-describedby="on-note-hint" />
              </Field>
            </Card>
          </div>

          <aside className="a-detail-side">
            <Card title="Payment & status" id="on-pay">
              <div className="a-seg" role="group" aria-label="Payment method">
                {(['full', 'koko'] as const).map((m) => (
                  <button key={m} type="button" className={f.payMethod === m ? 'on' : ''} aria-pressed={f.payMethod === m} onClick={() => set('payMethod', m)}>{m === 'koko' ? 'KOKO' : 'Pay in full'}</button>
                ))}
              </div>
              <Toggle label="Payment received" checked={f.paid} onChange={(v) => set('paid', v)} />
              <Toggle label="Already confirmed with the customer" description={f.confirmed ? 'Starts as Confirmed.' : 'Starts as New, to confirm later.'} checked={f.confirmed} onChange={(v) => set('confirmed', v)} />
            </Card>
            <Card title="Notes for the team" id="on-notes">
              <label htmlFor="on-staff" className="sr-only">Notes for the team</label>
              <textarea id="on-staff" className="a-input" rows={3} maxLength={1000} value={f.staffNotes} placeholder="Only the team sees this." onChange={(e) => set('staffNotes', e.target.value)} />
            </Card>
            <Card title="Summary" id="on-sum">
              <dl className="a-totals">
                <div><dt>Items</dt><dd>{money(subtotal)}</dd></div>
                <div><dt>Delivery</dt><dd>{money(f.deliveryFee)}</dd></div>
                <div className="a-total"><dt>Total</dt><dd>{money(subtotal + f.deliveryFee)}</dd></div>
              </dl>
            </Card>
          </aside>
        </div>

        {error && <p className="a-form-error" role="alert">{error}</p>}
        <div className="a-savebar">
          <span className="a-savebar-total"><span className="a-muted a-small">Total</span><strong>{money(subtotal + f.deliveryFee)}</strong></span>
          <Button onClick={cancel}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>Add order</Button>
        </div>
      </form>

      {leaving && (
        <ConfirmDialog title="Discard this order?" confirmLabel="Discard" onClose={() => setLeaving(false)} onConfirm={() => { setDone(true); navigate('/admin/orders'); }}>
          <p>What you've typed so far won't be saved.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

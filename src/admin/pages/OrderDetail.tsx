import { useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Copy, MessageCircle, Pencil, Phone } from 'lucide-react';
import { api, type Order, type OrderEvent, type OrderStatus } from '../lib/api';
import { useCan } from '../lib/session';
import { refreshPulse, useApi } from '../lib/useApi';
import {
  STATUS_ORDER, dateTime, dayLabel, fullDate, isOverdue, money, nextStep, orderTemplates, phone, phoneLocal, statusInfo, timeAgo, waLink,
} from '../lib/format';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, Notice, PageHeader, Skeleton, StatusBadge, Toggle, btn, describedBy } from '../ui/ui';
import { ItemsEditor, itemErrors, toEditable, type EditableItem } from '../ui/ItemsEditor';
import { toast } from '../ui/toast';
import { kokoPart } from '../../lib/format';

type Patch = Partial<Pick<Order, 'status' | 'paymentStatus' | 'payMethod' | 'customerName' | 'address' | 'deliveryDate' | 'giftNote' | 'staffNotes' | 'deliveryFee'>> & {
  customerPhone?: string; items?: { name: string; price: number; qty: number; details: string[] }[]; reason?: string;
};

export function OrderDetail() {
  const { ref = '' } = useParams();
  const can = useCan();
  const { data, setData, error, loading, reload } = useApi<{ order: Order; events: OrderEvent[] }>(`/orders/${encodeURIComponent(ref)}`);
  const [saving, setSaving] = useState<string | null>(null);
  const [ask, setAsk] = useState<null | { kind: 'cancel' | 'reopen' | 'confirm-no-phone'; to: OrderStatus }>(null);
  const [reason, setReason] = useState('');

  if (error) return <div className="a-page"><PageHeader title={ref} back="/admin/orders" /><ErrorState message={error} onRetry={() => void reload()} /></div>;
  if (loading && !data) return <div className="a-page"><PageHeader title={ref} back="/admin/orders" /><Skeleton rows={8} /></div>;
  if (!data) return null;
  const o = data.order;
  const editable = can('orders.edit');

  /** Saves, refreshes the history, and offers Undo for quick one-tap changes. */
  const save = async (key: string, patch: Patch, msg: string, undo?: Patch) => {
    setSaving(key);
    try {
      await api(`/orders/${o.ref}`, { method: 'PATCH', body: patch });
      const fresh = await api<{ order: Order; events: OrderEvent[] }>(`/orders/${o.ref}`);
      setData(fresh);
      if (patch.status) refreshPulse();
      toast.ok(msg, undo ? { label: 'Undo', run: () => void save(key, undo, 'Change undone') } : undefined);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setSaving(null);
    }
  };

  const moveTo = (to: OrderStatus) => {
    if (to === 'cancelled') return setAsk({ kind: 'cancel', to });
    if (o.status === 'cancelled') return setAsk({ kind: 'reopen', to });
    if (o.status === 'new' && to === 'confirmed' && !o.customerPhone) return setAsk({ kind: 'confirm-no-phone', to });
    void save('status', { status: to }, `Order ${statusInfo[to].label.toLowerCase()}`, { status: o.status });
  };

  const next = nextStep[o.status];
  const late = isOverdue(o);

  return (
    <div className="a-page a-page-task">
      <PageHeader
        title={o.ref}
        back="/admin/orders"
        subtitle={<>{o.source === 'website' ? 'Sent from the website' : 'Added by staff'} {timeAgo(o.createdAt)} · <StatusBadge status={o.status} /></>}
      />

      {o.status === 'new' && (
        <Notice tone="info" title="How to confirm this order">
          <ol className="a-steps-list">
            <li>Open WhatsApp and find the message with reference <strong>{o.ref}</strong>.</li>
            <li>Add the customer's name, phone and delivery address below.</li>
            <li>Check the items and total with them, then tap <strong>Confirm order</strong>.</li>
          </ol>
        </Notice>
      )}
      {late && <Notice tone="warn" title="Past its delivery date">This order was due {dayLabel(o.deliveryDate).toLowerCase()}. Update the delivery date or mark it as delivered.</Notice>}

      <div className="a-detail">
        <div className="a-detail-main">
          <CustomerCard o={o} editable={editable} saving={saving === 'customer'} onSave={(p) => save('customer', p, 'Customer details saved')} />
          <ItemsCard o={o} editable={editable} saving={saving === 'items'} onSave={(p) => save('items', p, 'Items updated')} />
          <DeliveryCard o={o} editable={editable} saving={saving === 'delivery'} onSave={(p) => save('delivery', p, 'Delivery details saved')} />
          <NotesCard o={o} editable={editable} saving={saving === 'notes'} onSave={(p) => save('notes', p, 'Notes saved')} />
        </div>

        <aside className="a-detail-side">
          <Card title="Status" id="od-status">
            <ol className="a-progress" aria-label="Order progress">
              {STATUS_ORDER.map((s, i) => {
                const cur = STATUS_ORDER.indexOf(o.status);
                const state = o.status === 'cancelled' ? 'off' : i < cur ? 'done' : i === cur ? 'now' : 'todo';
                return (
                  <li key={s} className={`a-progress-step ${state}`} aria-current={state === 'now' ? 'step' : undefined}>
                    <span className="a-progress-dot" aria-hidden="true">{state === 'done' && <Check size={12} strokeWidth={3} />}</span>
                    <span>{statusInfo[s].label}</span>
                  </li>
                );
              })}
            </ol>
            <p className="a-hint">{statusInfo[o.status].hint}</p>
            {editable && (
              <div className="a-status-actions">
                {next && <Button variant="primary" block onClick={() => moveTo(next.to)} loading={saving === 'status'} className="a-desktop-only">{next.label}</Button>}
                <StatusPicker o={o} canCancel={can('orders.cancel')} onPick={moveTo} />
              </div>
            )}
          </Card>

          <Card title="Payment" id="od-pay">
            <div className="a-seg" role="group" aria-label="Payment method">
              {(['full', 'koko'] as const).map((m) => (
                <button key={m} type="button" className={o.payMethod === m ? 'on' : ''} aria-pressed={o.payMethod === m} disabled={!editable || saving === 'pay'}
                  onClick={() => void save('pay', { payMethod: m }, m === 'koko' ? 'Payment method: KOKO' : 'Payment method: pay in full', { payMethod: o.payMethod })}>
                  {m === 'koko' ? 'KOKO' : 'Pay in full'}
                </button>
              ))}
            </div>
            {o.payMethod === 'koko' && <p className="a-hint">3 × {money(kokoPart(o.total))}, interest-free.</p>}
            <Toggle
              label="Payment received"
              description={o.paymentStatus === 'paid' ? 'Marked as paid.' : 'Switch on once the money is in.'}
              checked={o.paymentStatus === 'paid'}
              disabled={!editable || saving === 'pay'}
              onChange={(v) => void save('pay', { paymentStatus: v ? 'paid' : 'unpaid' }, v ? 'Marked as paid' : 'Marked as unpaid', { paymentStatus: o.paymentStatus })}
            />
          </Card>

          <MessageCard o={o} />

          <Card title="History" id="od-hist">
            <ol className="a-timeline">
              {data.events.map((e, i) => (
                <li key={i}>
                  <span className="a-timeline-dot" aria-hidden="true" />
                  <div><p>{e.message}</p><span className="a-muted a-small">{dateTime(e.at)}{e.user ? ` · ${e.user}` : ''}</span></div>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>

      {/* Phones: the next step is always one thumb away */}
      {editable && next && (
        <div className="a-sticky-actions">
          <div><span className="a-muted a-small">Total</span><strong>{money(o.total)}</strong></div>
          <Button variant="primary" onClick={() => moveTo(next.to)} loading={saving === 'status'}>{next.label}</Button>
        </div>
      )}

      {ask?.kind === 'cancel' && (
        <ConfirmDialog title={`Cancel order ${o.ref}?`} confirmLabel="Cancel order" busy={saving === 'status'} onClose={() => { setAsk(null); setReason(''); }}
          onConfirm={async () => { if (await save('status', { status: 'cancelled', reason }, 'Order cancelled', { status: o.status })) { setAsk(null); setReason(''); } }}>
          <p>The order stays in the list under <em>Cancelled</em>, and you can reopen it later.</p>
          <Field label="Reason" htmlFor="od-reason" optional hint="Saved in the order history, e.g. “Customer changed their mind”.">
            <input id="od-reason" className="a-input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} aria-describedby="od-reason-hint" />
          </Field>
        </ConfirmDialog>
      )}
      {ask?.kind === 'reopen' && (
        <ConfirmDialog title="Reopen this order?" tone="primary" confirmLabel={`Move to ${statusInfo[ask.to].label}`} busy={saving === 'status'} onClose={() => setAsk(null)}
          onConfirm={async () => { if (await save('status', { status: ask.to }, 'Order reopened', { status: 'cancelled' })) setAsk(null); }}>
          <p>It will show up again in the to-do list.</p>
        </ConfirmDialog>
      )}
      {ask?.kind === 'confirm-no-phone' && (
        <ConfirmDialog title="Confirm without a phone number?" tone="primary" confirmLabel="Confirm anyway" busy={saving === 'status'} onClose={() => setAsk(null)}
          onConfirm={async () => { if (await save('status', { status: 'confirmed' }, 'Order confirmed', { status: 'new' })) setAsk(null); }}>
          <p>Adding the customer's number first lets you message them in one tap at each step, and keeps them in <em>Customers</em>.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatusPicker({ o, canCancel, onPick }: { o: Order; canCancel: boolean; onPick: (s: OrderStatus) => void }) {
  const options = (Object.keys(statusInfo) as OrderStatus[]).filter((s) => s !== o.status && (canCancel || (s !== 'cancelled' && o.status !== 'cancelled')));
  if (!options.length) return null;
  return (
    <div className="a-field">
      <label htmlFor="od-move" className="a-small a-muted">Or move to another step</label>
      <select id="od-move" className="a-input" value="" onChange={(e) => e.target.value && onPick(e.target.value as OrderStatus)}>
        <option value="">Choose a status…</option>
        {options.map((s) => <option key={s} value={s}>{s === 'cancelled' ? 'Cancel order' : statusInfo[s].label}</option>)}
      </select>
      {!canCancel && <p className="a-hint">Only a manager or the owner can cancel orders.</p>}
    </div>
  );
}

/** A card that switches between a read view and an inline form. */
function EditableCard({ title, id, editable, editing, onEdit, view, form }: {
  title: string; id: string; editable: boolean; editing: boolean; onEdit: () => void; view: ReactNode; form: ReactNode;
}) {
  return (
    <Card title={title} id={id} action={editable && !editing && <Button size="sm" variant="ghost" icon={Pencil} onClick={onEdit} aria-label={`Edit ${title.toLowerCase()}`}>Edit</Button>}>
      {editing ? form : view}
    </Card>
  );
}

function FormButtons({ saving, onCancel, dirty }: { saving: boolean; onCancel: () => void; dirty: boolean }) {
  return (
    <div className="a-form-buttons">
      <Button onClick={onCancel}>Cancel</Button>
      <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>Save</Button>
    </div>
  );
}

function CustomerCard({ o, editable, saving, onSave }: { o: Order; editable: boolean; saving: boolean; onSave: (p: Patch) => Promise<boolean> }) {
  const empty = !o.customerName && !o.customerPhone;
  const [editing, setEditing] = useState(editable && empty && o.status === 'new');
  const from = () => ({ customerName: o.customerName, customerPhone: phoneLocal(o.customerPhone), address: o.address });
  const [f, setF] = useState(from);
  const dirty = f.customerName !== o.customerName || f.customerPhone !== phoneLocal(o.customerPhone) || f.address !== o.address;
  const edit = () => { setF(from()); setEditing(true); };
  const reset = () => { setF(from()); setEditing(false); };

  return (
    <EditableCard title="Customer" id="od-cust" editable={editable} editing={editing} onEdit={edit}
      view={empty ? (
        <EmptyState icon={Phone} title="No customer details yet" text="Copy them from the WhatsApp chat so you can message them and find them later." action={editable && <Button onClick={edit}>Add customer details</Button>} />
      ) : (
        <dl className="a-dl">
          <div><dt>Name</dt><dd>{o.customerName || '—'}</dd></div>
          <div><dt>Phone</dt><dd>{o.customerPhone ? <a href={`tel:+${o.customerPhone}`} className="a-link">{phone(o.customerPhone)}</a> : '—'}</dd></div>
          <div className="a-dl-wide"><dt>Delivery address</dt><dd className="a-pre">{o.address || '—'}</dd></div>
        </dl>
      )}
      form={(
        <form className="a-form" onSubmit={async (e) => { e.preventDefault(); if (await onSave(f)) setEditing(false); }}>
          <div className="a-form-2">
            <Field label="Name" htmlFor="od-name"><input id="od-name" className="a-input" autoComplete="off" value={f.customerName} maxLength={80} onChange={(e) => setF({ ...f, customerName: e.target.value })} /></Field>
            <Field label="Phone (WhatsApp)" htmlFor="od-phone" hint="Sri Lankan mobile, e.g. 077 123 4567">
              <input id="od-phone" className="a-input" type="tel" inputMode="tel" value={f.customerPhone} onChange={(e) => setF({ ...f, customerPhone: e.target.value })} aria-describedby={describedBy('od-phone', undefined, true)} />
            </Field>
          </div>
          <Field label="Delivery address" htmlFor="od-addr" hint="Include the recipient's name and phone if it's a gift for someone else.">
            <textarea id="od-addr" className="a-input" rows={3} value={f.address} maxLength={400} onChange={(e) => setF({ ...f, address: e.target.value })} aria-describedby="od-addr-hint" />
          </Field>
          <FormButtons saving={saving} dirty={dirty} onCancel={reset} />
        </form>
      )}
    />
  );
}

function ItemsCard({ o, editable, saving, onSave }: { o: Order; editable: boolean; saving: boolean; onSave: (p: Patch) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<EditableItem[]>(() => toEditable(o.items));
  const [fee, setFee] = useState(o.deliveryFee);
  const [tried, setTried] = useState(false);
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const edit = () => { setItems(toEditable(o.items)); setFee(o.deliveryFee); setTried(false); setEditing(true); };
  const reset = () => { setTried(false); setEditing(false); };
  const dirty = fee !== o.deliveryFee || JSON.stringify(items.map(({ key, ...i }) => i)) !== JSON.stringify(o.items);

  return (
    <EditableCard title="Items" id="od-items" editable={editable && o.status !== 'cancelled'} editing={editing} onEdit={edit}
      view={(
        <>
          <ul className="a-lines">
            {o.items.map((i, idx) => (
              <li key={idx}>
                <div><strong>{i.name}</strong> <span className="a-muted">× {i.qty}</span>
                  {i.details.length > 0 && <ul className="a-item-details">{i.details.map((d) => <li key={d}>{d}</li>)}</ul>}
                </div>
                <span>{money(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="a-totals">
            <div><dt>Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
            <div><dt>Delivery</dt><dd>{o.deliveryFee ? money(o.deliveryFee) : <span className="a-muted">Not added yet</span>}</dd></div>
            <div className="a-total"><dt>Total</dt><dd>{money(o.total)}</dd></div>
          </dl>
        </>
      )}
      form={(
        <form className="a-form" onSubmit={async (e) => {
          e.preventDefault();
          setTried(true);
          if (Object.keys(itemErrors(items)).length) return;
          if (await onSave({ items: items.map(({ key, ...i }) => i), deliveryFee: fee })) { setEditing(false); setTried(false); }
        }}>
          <ItemsEditor items={items} onChange={setItems} showErrors={tried} />
          <Field label="Delivery fee" htmlFor="od-fee" hint="Agree it with the customer in the chat.">
            <div className="a-input-prefix"><span aria-hidden="true">LKR</span>
              <input id="od-fee" className="a-input" inputMode="numeric" value={fee || ''} placeholder="0" onChange={(e) => setFee(Number(e.target.value.replace(/\D/g, '')) || 0)} aria-describedby="od-fee-hint" />
            </div>
          </Field>
          <p className="a-totals-live">New total: <strong>{money(subtotal + fee)}</strong></p>
          <FormButtons saving={saving} dirty={dirty} onCancel={reset} />
        </form>
      )}
    />
  );
}

function DeliveryCard({ o, editable, saving, onSave }: { o: Order; editable: boolean; saving: boolean; onSave: (p: Patch) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const from = () => ({ deliveryDate: o.deliveryDate ?? '', giftNote: o.giftNote });
  const [f, setF] = useState(from);
  const dirty = f.deliveryDate !== (o.deliveryDate ?? '') || f.giftNote !== o.giftNote;
  const edit = () => { setF(from()); setEditing(true); };
  const reset = () => setEditing(false);
  return (
    <EditableCard title="Delivery" id="od-del" editable={editable} editing={editing} onEdit={edit}
      view={(
        <dl className="a-dl">
          <div><dt>Date</dt><dd>{o.deliveryDate ? <>{fullDate(o.deliveryDate)} {isOverdue(o) && <Badge tone="red">Overdue</Badge>}</> : '—'}</dd></div>
          <div className="a-dl-wide"><dt>Gift note</dt><dd className="a-pre">{o.giftNote ? `“${o.giftNote}”` : <span className="a-muted">No note</span>}</dd></div>
        </dl>
      )}
      form={(
        <form className="a-form" onSubmit={async (e) => { e.preventDefault(); if (await onSave({ deliveryDate: f.deliveryDate || null, giftNote: f.giftNote })) setEditing(false); }}>
          <Field label="Delivery date" htmlFor="od-date"><input id="od-date" className="a-input" type="date" value={f.deliveryDate} onChange={(e) => setF({ ...f, deliveryDate: e.target.value })} /></Field>
          <Field label="Gift note" htmlFor="od-note" optional hint="Written on the card that goes with the gift.">
            <textarea id="od-note" className="a-input" rows={2} maxLength={200} value={f.giftNote} onChange={(e) => setF({ ...f, giftNote: e.target.value })} aria-describedby="od-note-hint" />
          </Field>
          <FormButtons saving={saving} dirty={dirty} onCancel={reset} />
        </form>
      )}
    />
  );
}

function NotesCard({ o, editable, saving, onSave }: { o: Order; editable: boolean; saving: boolean; onSave: (p: Patch) => Promise<boolean> }) {
  const [notes, setNotes] = useState(o.staffNotes);
  const dirty = notes !== o.staffNotes;
  return (
    <Card title="Notes for the team" id="od-notes">
      <form className="a-form" onSubmit={(e) => { e.preventDefault(); void onSave({ staffNotes: notes }); }}>
        <label htmlFor="od-staff" className="sr-only">Notes for the team</label>
        <textarea id="od-staff" className="a-input" rows={3} maxLength={1000} value={notes} disabled={!editable} placeholder="Only the team sees this, e.g. “Ring the bell twice”, “Paid half in advance”."
          onChange={(e) => setNotes(e.target.value)} />
        {editable && dirty && <FormButtons saving={saving} dirty={dirty} onCancel={() => setNotes(o.staffNotes)} />}
      </form>
    </Card>
  );
}

function MessageCard({ o }: { o: Order }) {
  const [copied, setCopied] = useState('');
  const templates = orderTemplates(o);
  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); window.setTimeout(() => setCopied(''), 2000); } catch { toast.error("Couldn't copy. Long-press the message instead."); }
  };
  return (
    <Card title="Message the customer" id="od-msg">
      {!o.customerPhone && <p className="a-hint">No phone number yet: WhatsApp will ask you to pick the chat.</p>}
      <ul className="a-templates">
        {templates.map((t) => (
          <li key={t.id}>
            <a href={waLink(o.customerPhone, t.text)} target="_blank" rel="noopener" className={btn('whatsapp', 'sm')}>
              <MessageCircle size={16} aria-hidden="true" />{t.label}
            </a>
            <button type="button" className="a-icon-btn" aria-label={`Copy “${t.label}” message`} onClick={() => void copy(t.id, t.text)}>
              {copied === t.id ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
      <p className="a-hint">Opens WhatsApp with the message written for you. Nothing is sent until you press send.</p>
    </Card>
  );
}


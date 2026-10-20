import { useMemo, useState } from 'react';
import { BellRing, Download, Mail, MessageCircle, Trash2 } from 'lucide-react';
import { api, type Reminder } from '../lib/api';
import { useCan } from '../lib/session';
import { useApi } from '../lib/useApi';
import { dateTime, downloadCsv, phone, waLink } from '../lib/format';
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, FilterPills, Notice, PageHeader, Skeleton, btn } from '../ui/ui';
import { toast } from '../ui/toast';
import { calendar } from '../../data/offers';

const occName = (id: string) => calendar.find((c) => c.id === id)?.name ?? id;

function nextDate(o: (typeof calendar)[number]) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let d = new Date(now.getFullYear(), months.indexOf(o.month), Number(o.day) || 1);
  if (d < today) d = new Date(now.getFullYear() + 1, months.indexOf(o.month), Number(o.day) || 1);
  return { date: d, days: Math.round((d.getTime() - today.getTime()) / 86_400_000) };
}

const nudge = (occ: string) => `Hi! A friendly reminder from GiftsByDeesh: ${occName(occ)} is coming up. Order by ${new Date(Date.now() + 5 * 86_400_000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} and we'll hand-wrap and deliver it in time. Reply here and we'll help you pick something lovely.\n\n(Reply STOP and we won't remind you again.)`;

export function Reminders() {
  const can = useCan();
  const manage = can('reminders.manage');
  const { data, setData, error, loading, reload } = useApi<{ reminders: Reminder[] }>('/reminders');
  const upcoming = useMemo(() => calendar.map((o) => ({ ...o, ...nextDate(o) })).sort((a, b) => a.days - b.days), []);
  const [occ, setOcc] = useState<string>(upcoming[0].id);
  const [removing, setRemoving] = useState<Reminder | null>(null);
  const [busy, setBusy] = useState(false);

  const all = data?.reminders ?? [];
  const list = all.filter((r) => occ === 'all' || r.occasions.includes(occ));
  const current = upcoming.find((o) => o.id === occ);
  const shown = (r: Reminder) => (r.channel === 'whatsapp' ? phone(r.contact) : r.contact);

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await api(`/reminders/${removing.id}`, { method: 'DELETE' });
      setData((d) => d && { reminders: d.reminders.filter((x) => x.id !== removing.id) });
      toast.ok(`${shown(removing)} won't get reminders any more`);
      setRemoving(null);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="a-page">
      <PageHeader
        title="Reminders"
        subtitle="People who asked to be reminded before an occasion (from the Offers page)."
        actions={manage && all.length > 0 && (
          <Button icon={Download} onClick={() => downloadCsv(`reminders-${occ}.csv`, [['Channel', 'Contact', 'Occasions', 'Signed up', 'Consent given'], ...list.map((r) => [r.channel, shown(r), r.occasions.map(occName).join('; '), r.createdAt, r.consentAt])])}>
            Export CSV
          </Button>
        )}
      />

      <FilterPills label="Occasion" value={occ} onChange={setOcc} items={[
        ...upcoming.map((o) => ({ id: o.id, label: `${o.name} · ${o.days === 0 ? 'today' : `in ${o.days} d`}`, count: all.filter((r) => r.occasions.includes(o.id)).length })),
        { id: 'all', label: 'Everyone', count: all.length },
      ]} />

      {current && current.days <= 14 && list.length > 0 && (
        <Notice tone="warn" title={`${current.name} is ${current.days === 0 ? 'today' : `in ${current.days} days`}`}>
          Time to send the reminder. Tap <strong>Remind</strong> next to each person. WhatsApp opens with the message written for you.
        </Notice>
      )}
      {!manage && <Notice>You can see and message sign-ups. Removing people or exporting the list needs a manager.</Notice>}

      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading && !data && <Skeleton rows={5} />}
      {data && list.length === 0 && <EmptyState icon={BellRing} title="No sign-ups for this occasion yet" text="People sign up with “Remind me” on the Offers page of the website." />}

      {list.length > 0 && (
        <ul className="a-cards">
          {list.map((r) => (
            <li key={r.id} className="a-person">
              <div className="a-row-top">
                <strong>{r.channel === 'whatsapp' ? <MessageCircle size={16} aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />} {shown(r)}</strong>
                <span className="a-muted a-small">since {dateTime(r.createdAt)}</span>
              </div>
              <div className="a-chips-static">{r.occasions.map((o) => <Badge key={o} tone={o === occ ? 'pink' : 'grey'}>{occName(o)}</Badge>)}</div>
              <div className="a-person-actions">
                {r.channel === 'whatsapp'
                  ? <a href={waLink(r.contact, nudge(occ === 'all' ? r.occasions[0] : occ))} target="_blank" rel="noopener" className={btn('whatsapp', 'sm')}><MessageCircle size={16} aria-hidden="true" />Remind</a>
                  : <a href={`mailto:${r.contact}?subject=${encodeURIComponent(`${occName(occ === 'all' ? r.occasions[0] : occ)} is coming up`)}&body=${encodeURIComponent(nudge(occ === 'all' ? r.occasions[0] : occ))}`} className={btn('secondary', 'sm')}><Mail size={16} aria-hidden="true" />Email</a>}
                {manage && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setRemoving(r)}>Remove</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {removing && (
        <ConfirmDialog title={`Stop reminding ${shown(removing)}?`} confirmLabel="Remove" busy={busy} onClose={() => setRemoving(null)} onConfirm={() => void remove()}>
          <p>Use this when someone asks to stop. They'll be removed from every occasion.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

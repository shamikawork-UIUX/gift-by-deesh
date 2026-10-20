import { useState } from 'react';
import { Bell } from 'lucide-react';
import { calendar } from '../../data/offers';
import { cancelReminder, loadSaved } from '../../lib/reminders';
import { ReminderModal } from './ReminderModal';

const toMap = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;

export function GiftCalendar() {
  const [reminders, setReminders] = useState<Record<string, boolean>>(() => toMap(loadSaved()?.occasions ?? []));
  const [remId, setRemId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const cancel = async (id: string) => {
    const saved = loadSaved();
    if (!saved || busy) return;
    setBusy(id);
    setNotice('');
    try {
      setReminders(toMap(await cancelReminder(saved, id)));
      setNotice(`Reminder for ${calendar.find((o) => o.id === id)?.name} cancelled.`);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="container sec-t-sm sec-b">
      <div className="sec-head" style={{ marginBottom: 32 }}>
        <div>
          <p className="eyebrow">GIFTING CALENDAR</p>
          <h2 className="h2">Never forget again</h2>
        </div>
        <p className="sec-lede">Tap "Remind me" and we'll send you a friendly nudge a week before — with that occasion's best offers.</p>
      </div>
      <div className="cal">
        {calendar.map((o) => {
          const on = !!reminders[o.id];
          return (
            <div key={o.id} className="cal-card">
              <div className="date-chip" aria-label={`${o.month} ${o.day}`}>
                <span className="m" style={{ background: o.color }}>{o.month}</span>
                <span className="d">{o.day}</span>
              </div>
              <div>
                <h3 className="cal-card-name">{o.name}</h3>
                <div className="cal-card-joke">{o.joke}</div>
              </div>
              <button
                className={`rem ${on ? 'on' : ''}`}
                aria-pressed={on}
                aria-busy={busy === o.id}
                aria-label={on ? `Reminder set for ${o.name}. Tap to cancel` : `Remind me about ${o.name}`}
                onClick={() => (on ? cancel(o.id) : setRemId(o.id))}
              >
                <Bell className="bell" size={16} strokeWidth={2.2} aria-hidden="true" />
                {on ? 'Reminder set' : 'Remind me'}
              </button>
            </div>
          );
        })}
      </div>
      <p className="cal-notice" role="status">{notice}</p>

      {remId && (
        <ReminderModal
          occasion={calendar.find((o) => o.id === remId)!}
          onClose={() => setRemId(null)}
          onSaved={(ids) => { setReminders(toMap(ids)); setNotice(''); }}
        />
      )}
    </section>
  );
}

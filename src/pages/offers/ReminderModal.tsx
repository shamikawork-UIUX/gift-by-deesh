import { useRef, useState, type FormEvent } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { calendar, whatsappReminders, type CalendarOccasion } from '../../data/offers';
import { useExit, useFocusTrap } from '../../hooks/useDialog';
import { loadSaved, saveReminder } from '../../lib/reminders';
import { Confetti } from './Confetti';

interface Props {
  occasion: CalendarOccasion;
  onClose: () => void;
  /** Every occasion this contact is now signed up for */
  onSaved: (occasions: string[]) => void;
}

type Channel = 'email' | 'wa';

/** Sri Lankan mobile: "071 234 5678" or "71 234 5678" → "712345678" (9 digits, starts with 7), else ''. */
const localMobile = (v: string) => {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('94')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return /^7\d{8}$/.test(d) ? d : '';
};

export function ReminderModal({ occasion: o, onClose, onSaved }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [closing, requestClose] = useExit(onClose, 240);
  useFocusTrap(ref, requestClose);

  // Pre-fill with whatever this device signed up with last time.
  const [prev] = useState(loadSaved);
  const [channel, setChannel] = useState<Channel>(prev ? (prev.channel === 'email' ? 'email' : 'wa') : whatsappReminders ? 'wa' : 'email');
  const [email, setEmail] = useState(prev?.channel === 'email' ? prev.contact : '');
  const [phone, setPhone] = useState(prev?.channel === 'whatsapp' ? prev.contact : '');
  const [all, setAll] = useState(false);
  const [err, setErr] = useState('');
  const [errGen, setErrGen] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ch: Channel = whatsappReminders ? channel : 'email';
  const m = localMobile(phone);
  const contact = ch === 'email' ? email.trim() : m ? `+94 ${m.slice(0, 2)} ${m.slice(2, 5)} ${m.slice(5)}` : `+94 ${phone.trim()}`;

  const fail = (msg: string) => {
    setErr(msg);
    setErrGen((g) => g + 1);
    inputRef.current?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const value = ch === 'email' ? email.trim() : phone.trim();
    if (!value) return fail(ch === 'email' ? 'Please enter your email address.' : 'Please enter your WhatsApp number.');
    if (ch === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return fail('Hmm, that email looks a little off. Mind checking it?');
    const mobile = ch === 'wa' ? localMobile(value) : '';
    if (ch === 'wa' && !mobile) return fail('Please enter a Sri Lankan mobile number, e.g. 71 234 5678.');

    setSaving(true);
    try {
      const occasions = await saveReminder({
        channel: ch === 'email' ? 'email' : 'whatsapp',
        contact: ch === 'email' ? value : mobile,
        occasions: all ? calendar.map((c) => c.id) : [o.id],
      });
      onSaved(occasions);
      setErr('');
      setDone(true);
    } catch (error) {
      fail((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rm-layer ${closing ? 'closing' : ''}`}>
      <button className="rm-back" aria-label="Close" tabIndex={-1} onClick={requestClose} />
      <div
        ref={ref}
        className={`rm-card ${err ? (errGen % 2 ? 'eA' : 'eB') : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rm-title"
      >
        <button className="rm-x" onClick={requestClose} aria-label="Close"><X size={16} strokeWidth={2.6} aria-hidden="true" /></button>

        {!done ? (
          <form onSubmit={submit} noValidate>
            <div className="rm-head">
              <div className="rm-bell" style={{ background: o.soft, color: o.color }}><Bell size={30} aria-hidden="true" /></div>
              <div>
                <div className="rm-date" style={{ color: o.color }}>{o.month} {o.day}</div>
                <h2 id="rm-title" className="rm-title">Remind me about {o.name}</h2>
              </div>
            </div>
            <p className="rm-p">We'll send one friendly nudge a week before, with that occasion's best offers. That's it, promise.</p>

            {whatsappReminders && (
              <div className="rm-seg" role="group" aria-label="Remind me by">
                <button type="button" className={ch === 'email' ? 'on' : ''} aria-pressed={ch === 'email'} onClick={() => { setChannel('email'); setErr(''); }}>Email</button>
                <button type="button" className={ch === 'wa' ? 'on' : ''} aria-pressed={ch === 'wa'} onClick={() => { setChannel('wa'); setErr(''); }}>WhatsApp</button>
              </div>
            )}

            {ch === 'email' ? (
              <>
                <label htmlFor="rm-email" className="rm-lab">Your email</label>
                <input
                  id="rm-email"
                  ref={inputRef}
                  data-autofocus
                  className={`rm-in ${err ? 'bad' : ''}`}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  aria-invalid={!!err}
                  aria-describedby={err ? 'rm-err' : undefined}
                  onChange={(e) => { setEmail(e.target.value); setErr(''); }}
                />
              </>
            ) : (
              <>
                <label htmlFor="rm-phone" className="rm-lab">Your WhatsApp number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="rm-pre">+94</span>
                  <input
                    id="rm-phone"
                    ref={inputRef}
                    data-autofocus
                    className={`rm-in ${err ? 'bad' : ''}`}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="71 234 5678"
                    value={phone}
                    aria-invalid={!!err}
                    aria-describedby={err ? 'rm-err' : undefined}
                    onChange={(e) => { setPhone(e.target.value); setErr(''); }}
                  />
                </div>
              </>
            )}
            {err && <p id="rm-err" role="alert" className="rm-err">{err}</p>}

            <button type="button" className={`rm-check ${all ? 'on' : ''}`} aria-pressed={all} onClick={() => setAll((a) => !a)}>
              <span className="bx"><Check size={14} strokeWidth={3.2} aria-hidden="true" /></span>
              Also remind me about the other occasions
            </button>

            <button type="submit" className="rm-go" style={{ background: 'var(--pink)' }} disabled={saving} aria-busy={saving}>
              <Bell size={18} strokeWidth={2.2} aria-hidden="true" />{saving ? 'Saving…' : 'Set my reminder'}
            </button>
            <p className="rm-fine">By setting a reminder you agree we can {ch === 'email' ? 'email' : 'WhatsApp'} you about these occasions. No spam, just gift nudges. Unsubscribe anytime.</p>
          </form>
        ) : (
          <div className="rm-done" role="status">
            <Confetti />
            <div className="big-bell" style={{ background: o.soft, color: o.color }}>
              <Bell size={54} aria-hidden="true" />
              <span className="ok"><Check size={18} strokeWidth={3.2} aria-hidden="true" /></span>
            </div>
            <h2 id="rm-title" className="rm-done-t">You're on the list!</h2>
            <p className="rm-done-p">
              {all
                ? `We'll nudge you a week before every occasion on the calendar, at ${contact}.`
                : `We'll nudge you a week before ${o.name}, at ${contact}.`}
            </p>
            <button className="rm-go" onClick={requestClose} style={{ background: 'var(--ink)' }} data-autofocus>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

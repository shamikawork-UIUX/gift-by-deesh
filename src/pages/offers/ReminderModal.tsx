import { useRef, useState, type FormEvent } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { whatsappReminders, type CalendarOccasion } from '../../data/offers';
import { useExit, useFocusTrap } from '../../hooks/useDialog';
import { Confetti } from './Confetti';

interface Props {
  occasion: CalendarOccasion;
  onClose: () => void;
  onSaved: (all: boolean) => void;
}

type Channel = 'email' | 'wa';

export function ReminderModal({ occasion: o, onClose, onSaved }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [closing, requestClose] = useExit(onClose, 240);
  useFocusTrap(ref, requestClose);

  const [channel, setChannel] = useState<Channel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [all, setAll] = useState(false);
  const [err, setErr] = useState('');
  const [errGen, setErrGen] = useState(0);
  const [done, setDone] = useState(false);

  const ch: Channel = whatsappReminders ? channel : 'email';
  const contact = ch === 'email' ? email.trim() : `+94 ${phone.trim()}`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    let msg = '';
    if (ch === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) msg = 'Hmm, that email looks a little off. Mind checking it?';
    if (ch === 'wa' && phone.replace(/\D/g, '').length < 9) msg = 'That number looks too short — try 9 digits after +94.';
    if (msg) {
      setErr(msg);
      setErrGen((g) => g + 1);
      return;
    }
    // TODO: send { contact, channel: ch, occasions } to Mailchimp / Brevo. For now it only lives in state.
    onSaved(all);
    setErr('');
    setDone(true);
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
                    className={`rm-in ${err ? 'bad' : ''}`}
                    type="tel"
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

            <button type="submit" className="rm-go" style={{ background: 'var(--pink)' }}>
              <Bell size={18} strokeWidth={2.2} aria-hidden="true" />Set my reminder
            </button>
            <p className="rm-fine">No spam, just gift nudges. Unsubscribe anytime.</p>
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

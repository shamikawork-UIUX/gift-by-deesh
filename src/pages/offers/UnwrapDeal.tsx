import { useState } from 'react';
import { coupon } from '../../data/offers';
import { Bow } from '../../components/Shapes';
import { useTimers } from '../../hooks/useTimers';
import { Confetti } from './Confetti';

const lines = ['Psst… tap me!', 'Ooh, it rattled…', 'Something is wiggling in here!', 'SURPRISE!'];

export function UnwrapDeal() {
  const [taps, setTaps] = useState(0);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const later = useTimers();

  const bubble = open ? lines[3] : lines[Math.min(taps, 2)];
  let giftCls = 'idle';
  if (open) giftCls = 'open';
  else if (taps) giftCls = taps % 2 ? 'shA' : 'shB';

  const tap = () => {
    if (open) return;
    const t = taps + 1;
    setTaps(t);
    if (t >= 3) setOpen(true);
  };

  const copy = async () => {
    try { await navigator.clipboard?.writeText(coupon.code); } catch { /* clipboard blocked */ }
    setCopied(true);
    later(() => setCopied(false), 2000);
  };

  return (
    <section className="unwrap-sec">
      <div className="container sec-y" style={{ textAlign: 'center' }}>
        <p className="eyebrow">UNWRAP A DEAL</p>
        <h2 className="h2">There's something in this box…</h2>
        <p className="unwrap-lede">Tap it a few times. We promise it doesn't bite.</p>

        <div style={{ position: 'relative', marginTop: 44 }}>
          <div className={`bubble ${(taps + (open ? 1 : 0)) % 2 ? 'bA' : 'bB'}`} role="status">{bubble}</div>
          <div style={{ position: 'relative', marginTop: 30 }}>
            <button className={`gift ${giftCls}`} onClick={tap} aria-label="Tap the gift box to unwrap a deal" aria-disabled={open}>
              {open && (
                <>
                  <svg className="peek" viewBox="0 0 110 110" aria-hidden="true">
                    <circle cx="30" cy="26" r="13" fill="#C68E5E" /><circle cx="80" cy="26" r="13" fill="#C68E5E" />
                    <circle cx="30" cy="26" r="6" fill="#E9C3A0" /><circle cx="80" cy="26" r="6" fill="#E9C3A0" />
                    <circle cx="55" cy="58" r="34" fill="#C68E5E" />
                    <ellipse cx="55" cy="70" rx="15" ry="11" fill="#F3DFC9" />
                    <circle cx="43" cy="52" r="4" fill="#3B2A22" /><circle cx="67" cy="52" r="4" fill="#3B2A22" />
                    <ellipse cx="55" cy="65" rx="5" ry="3.6" fill="#3B2A22" />
                    <path d="M49 74q6 5 12 0" stroke="#3B2A22" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                    <ellipse cx="34" cy="64" rx="6" ry="3.5" fill="#F2A7BE" opacity=".85" />
                    <ellipse cx="76" cy="64" rx="6" ry="3.5" fill="#F2A7BE" opacity=".85" />
                    <g className="arm"><ellipse cx="96" cy="58" rx="9" ry="14" fill="#C68E5E" transform="rotate(-25 96 58)" /></g>
                  </svg>
                  <Confetti extra />
                </>
              )}
              <span className="g-base"><span className="rv" /></span>
              <span className="g-lid"><span className="rv" /><Bow className="bow" color="var(--pink)" full={false} /></span>
            </button>
          </div>
          <div className="tap-dots" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ background: open || taps > i ? 'var(--pink)' : 'var(--line-2)' }} />
            ))}
          </div>
        </div>

        {open && (
          <div style={{ marginTop: 34 }}>
            <div className="ticket">
              <div className="ticket-pc">{coupon.short}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="ticket-l">Your code · {coupon.label}</div>
                <div className="ticket-code">{coupon.code}</div>
              </div>
              <button className="copy-btn" onClick={copy} style={{ background: copied ? 'var(--ok-ink)' : 'var(--ink)' }}>
                {copied ? 'Copied!' : 'Copy code'}
              </button>
            </div>
            <button className="text-btn" onClick={() => { setTaps(0); setOpen(false); setCopied(false); }}>Wrap it back up</button>
          </div>
        )}
      </div>
    </section>
  );
}

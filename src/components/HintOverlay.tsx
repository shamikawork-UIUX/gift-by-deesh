import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useHint } from '../store/hint';
import { HEART_PATH } from './Shapes';
import './HintOverlay.css';

const hintText = (name: string, price: string) =>
  `Psst… just a little hint: I'd love the ${name} (${price}) from GiftsByDeesh! ${window.location.origin}/shop`;

/** Envelope animation for "Send a hint", then WhatsApp opens with the hint pre-written. */
export function HintOverlay() {
  const hint = useHint((s) => s.hint);
  const clear = useHint((s) => s.clear);

  const url = hint ? `https://wa.me/?text=${encodeURIComponent(hintText(hint.name, hint.price))}` : '';

  useEffect(() => {
    if (!hint) return;
    const open = window.setTimeout(() => window.open(url, '_blank', 'noopener'), 2700);
    const done = window.setTimeout(clear, 5000);
    return () => {
      clearTimeout(open);
      clearTimeout(done);
    };
  }, [hint, url, clear]);

  if (!hint) return null;

  return (
    <div className="hint-layer" key={hint.gen} role="status" aria-live="polite">
      <div className="hint-veil" />
      <div className="env-wrap">
        <svg className="spark s1" aria-hidden="true" viewBox="0 0 24 24" fill="#D6245F"><path d={HEART_PATH} /></svg>
        <svg className="spark s2" aria-hidden="true" viewBox="0 0 24 24" fill="#F2B4C8"><path d={HEART_PATH} /></svg>
        <svg className="spark s3" aria-hidden="true" viewBox="0 0 24 24" fill="#D6245F"><path d={HEART_PATH} /></svg>
        <div className="env">
          <div className="env-back" />
          <div className="env-flap" />
          <div className="env-letter">
            <div className="env-l1">Just a little hint…</div>
            <div className="env-l2">{hint.name}</div>
            <div className="env-l3">{hint.price}</div>
          </div>
          <div className="env-front" />
          <div className="env-seal">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d={HEART_PATH} /></svg>
          </div>
        </div>
      </div>
      <div className="env-caption">Wrapping up your hint…</div>
      <div className="hint-toast">
        <span className="toast-ic" style={{ background: 'var(--wa-green)', color: 'var(--wa-ink)' }}>
          <Check size={16} strokeWidth={3} aria-hidden="true" />
        </span>
        <span>
          <strong>Hint sent!</strong> <span className="dim">Opening WhatsApp… </span>
          <a href={url} target="_blank" rel="noopener">Didn't open?</a>
        </span>
      </div>
    </div>
  );
}

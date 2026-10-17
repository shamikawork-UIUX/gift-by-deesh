import { useState } from 'react';
import { Hand, MapPin, MessageCircle, RotateCw } from 'lucide-react';
import { promises } from '../../data/about';

const icons = { hand: Hand, pin: MapPin, chat: MessageCircle };

export function Promises() {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  return (
    <section style={{ background: '#fff' }}>
      <div className="container sec-y">
        <div style={{ marginBottom: 32 }}>
          <p className="eyebrow">OUR LITTLE PROMISES</p>
          <h2 className="h2">What you can count on</h2>
        </div>
        <div className="promises">
          {promises.map((p, i) => {
            const Icon = icons[p.icon];
            const on = !!flipped[i];
            return (
              <button key={p.title} className={`flip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setFlipped((f) => ({ ...f, [i]: !on }))}>
                <span className="sr-only">{p.title}: {p.back}</span>
                <div className="flip-in" aria-hidden="true">
                  <div className="face" style={{ background: p.tint }}>
                    <span className="face-ic" style={{ color: p.color }}><Icon size={28} /></span>
                    <div>
                      <div className="face-t">{p.title}</div>
                      <div className="face-hint">Flip me <RotateCw size={14} strokeWidth={2.4} /></div>
                    </div>
                  </div>
                  <div className="face back">
                    <div className="hand face-back-t">{p.title}</div>
                    <p>{p.back}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

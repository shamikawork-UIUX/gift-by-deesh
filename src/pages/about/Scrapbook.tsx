import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { chapters } from '../../data/about';
import { PhotoLabel } from '../../components/Placeholder';
import { flip } from '../../lib/format';

export function Scrapbook() {
  const [chap, setChap] = useState(0);
  const [gen, setGen] = useState(0);
  const go = (i: number) => { setChap(i); setGen((g) => g + 1); };
  const c = chapters[chap];

  return (
    <section className="story-sec">
      <div className="container sec-y">
        <div className="sec-head" style={{ marginBottom: 32 }}>
          <div>
            <p className="eyebrow">OUR STORY</p>
            <h2 className="h2">A little scrapbook</h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="icon-btn arrow-lg" aria-label="Previous chapter" disabled={chap === 0} onClick={() => go(Math.max(0, chap - 1))}>
              <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button className="icon-btn arrow-lg" aria-label="Next chapter" disabled={chap === chapters.length - 1} onClick={() => go(Math.min(chapters.length - 1, chap + 1))}>
              <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="split">
          <div className="chapters" role="tablist" aria-label="Chapters">
            {chapters.map((ch, i) => (
              <button
                key={ch.short}
                role="tab"
                aria-selected={i === chap}
                aria-controls="story-page"
                className={`chap-dot ${i === chap ? 'on' : i < chap ? 'done' : ''}`}
                onClick={() => go(i)}
              >
                <span className="n">{i + 1}</span>{ch.short}
              </button>
            ))}
          </div>
          <div className="book">
            <div id="story-page" role="tabpanel" aria-live="polite" className={`page ${flip(gen, 'tA', 'tB')}`}>
              <PhotoLabel label={c.photo} className="page-ph" style={{ background: c.tint }} />
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                <div className="hand page-when">Chapter {chap + 1} · {c.when}</div>
                <h3 className="page-t">{c.title}</h3>
                <p className="page-b">{c.body}</p>
              </div>
            </div>
            <div className="page-dots" aria-hidden="true">
              {chapters.map((ch, i) => <span key={ch.short} className={i === chap ? 'on' : ''} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

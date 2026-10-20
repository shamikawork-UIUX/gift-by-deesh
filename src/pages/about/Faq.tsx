import { useState } from 'react';
import { CircleHelp, Plus } from 'lucide-react';
import { faqs } from '../../data/faqs';
import { fillSettings, useSettings } from '../../store/catalog';

export function Faq() {
  const [open, setOpen] = useState(0);
  const settings = useSettings();
  return (
    <section id="faq" className="faq-sec">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p className="eyebrow">GOOD QUESTIONS</p>
        <h2 className="h2">Things people often ask</h2>
      </div>
      <div className="faqs">
        {faqs.map((f, i) => {
          const on = open === i;
          return (
            <div key={f.q} className={`faq ${on ? 'on' : ''}`}>
              <h3 style={{ margin: 0 }}>
                <button className="faq-q" aria-expanded={on} aria-controls={`faq-a-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(on ? -1 : i)}>
                  <span className="faq-ic" style={{ background: f.tint, color: f.color }}><CircleHelp size={18} strokeWidth={2.2} aria-hidden="true" /></span>
                  <span className="faq-qt">{f.q}</span>
                  <span className="pm" aria-hidden="true"><Plus size={16} strokeWidth={2.6} /></span>
                </button>
              </h3>
              <div className="faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                <div><p>{fillSettings(f.a, settings)}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

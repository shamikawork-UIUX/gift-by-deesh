import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { homeOccasions } from '../../data/home';
import { PhotoLabel } from '../../components/Placeholder';
import './Occasions.css';

export function Occasions() {
  const [active, setActive] = useState(0);
  const occ = homeOccasions[active];

  return (
    <section className="occ-sec">
      <div className="container occ-wrap">
        <div className="occ-list">
          <p className="eyebrow">SHOP BY OCCASION</p>
          <h2 className="h2" style={{ marginBottom: 28 }}>Make every moment special</h2>
          <div role="tablist" aria-label="Occasions">
            {homeOccasions.map((o, i) => (
              <button
                key={o.title}
                role="tab"
                id={`occ-tab-${i}`}
                aria-selected={i === active}
                aria-controls="occ-panel"
                className={`occ ${i === active ? 'on' : ''}`}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
              >
                <span className="num">0{i + 1}</span>
                <span className="t">{o.title}</span>
                <span className="ar" aria-hidden="true"><ArrowRight size={20} strokeWidth={2.2} /></span>
              </button>
            ))}
          </div>
        </div>

        <div id="occ-panel" role="tabpanel" aria-labelledby={`occ-tab-${active}`} className="ph occ-ph" style={{ background: occ.tint }}>
          <PhotoLabel label={occ.photo} size={36} style={{ paddingBottom: 140, fontSize: 14 }} />
          <div className="occ-card" key={active}>
            <div className="occ-card-t">{occ.title}</div>
            <div className="occ-card-s">{occ.sub}</div>
            <div className="occ-chips">
              {occ.chips.map((c) => <span key={c} className="occ-chip">{c}</span>)}
              <Link to={occ.to} className="occ-cta">{occ.cta} <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { HEART_PATH } from '../../components/Shapes';
import { PhotoLabel } from '../../components/Placeholder';

const polaroids = [
  { cls: 'p1', tint: '#FCE6CF', photo: 'Photo — our very first bouquet', cap: 'the first one!' },
  { cls: 'p2', tint: '#DCE4F3', photo: 'Photo — packing day chaos', cap: 'packing day' },
  { cls: 'p3', tint: '#F7D3DE', photo: 'Photo — Deesh at the wrapping table', cap: 'hello from the studio' },
];

export function AboutHero() {
  const [fan, setFan] = useState(false);
  return (
    <section id="top" className="container about-hero">
      <div className="about-hero-in">
        <div className="about-copy">
          <p className="eyebrow">ABOUT US</p>
          <h1>
            Hi, we're House of Deesh{' '}
            <span className="wave-hi" aria-hidden="true">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="var(--pink)" style={{ verticalAlign: -4 }}><path d={HEART_PATH} /></svg>
            </span>
          </h1>
          <svg aria-hidden="true" className="squig-svg" width="260" height="22" viewBox="0 0 260 22">
            <path className="squig" d="M4 14 Q 24 2 44 14 T 84 14 T 124 14 T 164 14 T 204 14 T 252 12" stroke="var(--pink)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="400" strokeDashoffset="400" />
          </svg>
          <p className="about-lede">A small Sri Lankan gift studio that turns chocolates, teddies and toys into little moments of happiness. Every single gift is hand-picked, hand-wrapped and sent off with love.</p>
          <p className="hand about-sign">— [Founder name], founder &amp; chief bow-tier</p>
        </div>
        <div className="about-pics">
          <button className={`pol-stack ${fan ? 'fan' : ''}`} onClick={() => setFan((f) => !f)} aria-pressed={fan} aria-label="Fan out photos from our studio">
            {polaroids.map((p) => (
              <div key={p.cls} className={`pol ${p.cls}`}>
                <span className="tape" />
                <PhotoLabel label={p.photo} size={28} className="pol-ph" style={{ background: p.tint }} />
                <div className="cap hand">{p.cap}</div>
              </div>
            ))}
          </button>
          <p className="pol-hint">Hover (or tap) the photos</p>
        </div>
      </div>
    </section>
  );
}

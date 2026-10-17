import { useState } from 'react';
import { Play } from 'lucide-react';
import { reels } from '../../data/home';
import { site } from '../../data/site';
import { InstagramIcon, TikTokIcon } from '../../components/Shapes';
import './Reels.css';

export function Reels() {
  const [active, setActive] = useState(2);

  return (
    <section className="reels-sec">
      <div className="container sec-y">
        <div className="sec-head" style={{ marginBottom: 40 }}>
          <div>
            <p className="eyebrow">WATCH US WRAP</p>
            <h2 className="h2">Fresh from our reels</h2>
          </div>
          <div className="social-pills">
            <a href={site.instagram.url} target="_blank" rel="noopener" className="social-pill"><InstagramIcon />{site.instagram.handle}</a>
            <a href={site.tiktok.url} target="_blank" rel="noopener" className="social-pill"><TikTokIcon />{site.tiktok.handle}</a>
          </div>
        </div>

        <div className="reels">
          {reels.map((r, i) => {
            const on = i === active;
            const props = on
              ? { as: 'a' as const, href: site.instagram.url, target: '_blank', rel: 'noopener' }
              : { as: 'button' as const };
            const inner = (
              <>
                <span className="reel-len">Reel · {r.len}</span>
                <span className="play"><Play size={22} fill="currentColor" aria-hidden="true" /></span>
                <span className="reel-cap">
                  <span className="reel-t">{r.title}</span>
                  <span className="reel-s">{on ? 'Watch on Instagram →' : 'Order this gift →'}</span>
                </span>
              </>
            );
            return props.as === 'a' ? (
              <a key={r.title} className="reel on" href={props.href} target={props.target} rel={props.rel} style={{ background: r.tint }} aria-label={`Watch reel: ${r.title}`}>
                {inner}
              </a>
            ) : (
              <button key={r.title} className="reel" onClick={() => setActive(i)} style={{ background: r.tint }} aria-label={`Show reel: ${r.title}`}>
                {inner}
              </button>
            );
          })}
        </div>
        <div className="reel-dots">
          {reels.map((r, i) => (
            <button key={r.title} className={`dot ${i === active ? 'on' : ''}`} aria-label={`Show reel ${i + 1}`} aria-pressed={i === active} onClick={() => setActive(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

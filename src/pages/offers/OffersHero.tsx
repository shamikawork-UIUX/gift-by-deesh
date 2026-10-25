import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { weeklyOffer } from '../../data/offers';
import { offerEndIso, useSettings } from '../../store/catalog';
import { ShapeSvg } from '../../components/Shapes';

const pad = (n: number) => String(n).padStart(2, '0');

function useCountdown(endIso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = Date.parse(endIso);
  const secs = Math.floor((isNaN(end) ? 0 : Math.max(0, end - now)) / 1000);
  return {
    live: secs > 0,
    secs,
    d: pad(Math.floor(secs / 86400)),
    h: pad(Math.floor((secs % 86400) / 3600)),
    m: pad(Math.floor((secs % 3600) / 60)),
    s: pad(secs % 60),
  };
}

export function OffersHero() {
  const settings = useSettings();
  const cd = useCountdown(offerEndIso(settings));

  return (
    <section id="top" className="of-hero">
      <div className="container of-hero-in">
        <div className="of-hero-copy">
          <p className="eyebrow" style={{ color: 'var(--pink-dark)', marginBottom: 12 }}>OFFERS &amp; TREATS</p>
          <h1>Sweet deals, wrapped with <span>love.</span></h1>
          <p className="of-lede">Combos, seasonal surprises and a gift box full of discounts. Go on, have a look around.</p>

          <div className="of-weekly">
            <div className="of-weekly-head">
              <span className="of-tag">{weeklyOffer.tag}</span>
              <span className="of-weekly-t">{settings.weeklyOfferTitle}</span>
            </div>
            {cd.live ? (
              <div className="of-weekly-row">
                <div className="cd" role="timer" aria-label={`Offer ends in ${cd.d} days ${cd.h} hours ${cd.m} minutes`}>
                  <div className="cd-box"><div className="cd-num">{cd.d}</div><div className="cd-l">DAYS</div></div>
                  <div className="cd-box"><div className="cd-num">{cd.h}</div><div className="cd-l">HRS</div></div>
                  <div className="cd-box"><div className="cd-num">{cd.m}</div><div className="cd-l">MIN</div></div>
                  <div className="cd-box pink" aria-hidden="true"><div className={`cd-num ${cd.secs % 2 ? 'pa' : 'pb'}`}>{cd.s}</div><div className="cd-l">SEC</div></div>
                </div>
                <Link to="/shop?vibe=sweet" className="btn btn-ink">Shop bouquets</Link>
              </div>
            ) : (
              <p className="of-ended">This offer has ended — new treats coming soon!</p>
            )}
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-blob" />
          <div className="fl f1" style={{ left: '12%', top: '8%' }}><div className="ftok" style={{ width: 120, height: 120, background: '#FDE7E4' }}><ShapeSvg shape="egg" /></div></div>
          <div className="fl f2" style={{ right: '10%', top: '4%' }}><div className="ftok" style={{ width: 104, height: 104, background: '#FBF0D2' }}><ShapeSvg shape="ball" /></div></div>
          <div className="fl f3" style={{ left: '34%', top: '32%' }}><div className="ftok" style={{ width: 168, height: 168, background: '#F4E6D6' }}><ShapeSvg shape="teddy" /></div></div>
          <div className="fl f4" style={{ left: '6%', bottom: '10%' }}><div className="ftok" style={{ width: 96, height: 96, background: '#DCE4F3' }}><ShapeSvg shape="car" /></div></div>
          <div className="fl f5" style={{ right: '8%', bottom: '14%' }}><div className="ftok" style={{ width: 110, height: 110, background: '#fff' }}><ShapeSvg shape="heart" /></div></div>
          <div className="fl" style={{ right: '30%', top: '2%' }}><div className="spin">{settings.weeklyOfferBadge}</div></div>
        </div>
      </div>
    </section>
  );
}

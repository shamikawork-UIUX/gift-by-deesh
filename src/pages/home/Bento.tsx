import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PhotoLabel } from '../../components/Placeholder';
import './Bento.css';

export function Bento() {
  return (
    <section id="shop" className="container bento-sec">
      <div className="sec-head" style={{ marginBottom: 32 }}>
        <div>
          <p className="eyebrow">SHOP BY CATEGORY</p>
          <h2 className="h2">Find the perfect gift</h2>
        </div>
        <p className="sec-lede" style={{ maxWidth: 340 }}>Every gift is hand-wrapped and ready to delight. Pick a collection to start.</p>
      </div>

      <div className="bento">
        <Link to="/shop?vibe=sweet" className="bento-tile big" style={{ background: '#F7D3DE' }}>
          <div className="ph bento-fill">
            <PhotoLabel label="Photo — chocolate bouquet" color="#7A3A50" size={34} style={{ paddingBottom: 120 }} />
          </div>
          <div className="bento-card">
            <div>
              <span className="bento-pill">Most loved</span>
              <div className="bento-t" style={{ fontSize: 30 }}>Chocolate Bouquets</div>
              <div className="reveal">Kinder, Ferrero &amp; more — from LKR 4,000</div>
            </div>
            <span className="go go-lg"><ArrowRight size={22} strokeWidth={2.2} aria-hidden="true" /></span>
          </div>
        </Link>

        <Link to="/shop?vibe=cuddly" className="bento-tile wide" style={{ background: '#F4E6D6' }}>
          <div className="ph bento-right">
            <PhotoLabel label="Photo — teddy bears" color="#6E5236" />
          </div>
          <div className="bento-side">
            <div className="bento-t" style={{ fontSize: 28 }}>Teddy Bears</div>
            <div>
              <div className="reveal" style={{ marginBottom: 10 }}>Pocket-size to giant cuddles</div>
              <span className="go go-ink"><ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" /></span>
            </div>
          </div>
        </Link>

        <Link to="/shop?vibe=sweet" className="bento-tile" style={{ background: '#FCE6CF' }}>
          <div className="ph bento-fill">
            <PhotoLabel label="Photo — Kinder gifts" color="#7A4E22" size={28} style={{ paddingBottom: 60 }} />
          </div>
          <div className="bento-foot">
            <div className="bento-t" style={{ fontSize: 24 }}>Kinder Gifts</div>
            <div className="reveal">Boxes &amp; hampers</div>
          </div>
        </Link>

        <Link to="/shop?vibe=playful" className="bento-tile dark" style={{ background: 'var(--ink)' }}>
          <div className="ph bento-fill">
            <PhotoLabel label="Photo — Hot Wheels" color="#C9CCE0" size={28} style={{ paddingBottom: 60 }} />
          </div>
          <div className="bento-foot">
            <div className="bento-t" style={{ fontSize: 24, color: '#fff' }}>Hot Wheels</div>
            <div className="reveal" style={{ color: 'var(--navy-text)' }}>Sets for little racers</div>
          </div>
        </Link>
      </div>
    </section>
  );
}

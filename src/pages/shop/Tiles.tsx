import { Link } from 'react-router-dom';
import { ArrowRight, Gift } from 'lucide-react';

export function BoxTile() {
  return (
    <Link to="/#build" className="tile-link">
      <div>
        <p className="eyebrow" style={{ color: 'var(--pink-light)' }}>CAN'T DECIDE?</p>
        <div className="tile-t">Build your own gift box</div>
        <p className="tile-p">Mix their favourite treats and plushies into one box.</p>
      </div>
      <div className="mini-box" aria-hidden="true">
        <div className="base" />
        <div className="tk t1" style={{ background: '#E8463B' }} />
        <div className="tk t2" style={{ background: '#D9A441' }} />
        <div className="tk t3" style={{ background: '#C68E5E' }} />
        <div className="front" />
      </div>
      <span className="tile-go">Start packing <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" /></span>
    </Link>
  );
}

export function GuideTile({ onPick }: { onPick: () => void }) {
  return (
    <button className="guide-btn" onClick={onPick}>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <p className="eyebrow" style={{ color: '#FFD6E2' }}>GIFT GUIDE</p>
        <div className="guide-t">Sweet gifts under LKR 5,000</div>
        <p className="guide-p">Big smiles, small budget. Tap to filter the shop to our favourite little treats.</p>
        <span className="guide-cta">Show me <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" /></span>
      </div>
      <div className="float" aria-hidden="true">
        <Gift size={110} color="#fff" strokeWidth={1.4} />
      </div>
    </button>
  );
}

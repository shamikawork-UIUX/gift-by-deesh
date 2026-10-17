import { Link } from 'react-router-dom';
import { TeddyBasket } from '../components/Shapes';

export function NotFound() {
  return (
    <section className="container sec-y" style={{ textAlign: 'center' }}>
      <TeddyBasket className="cd-sway" size={160} />
      <h1 className="h2" style={{ marginTop: 16 }}>This page wandered off…</h1>
      <p style={{ color: 'var(--body)', fontSize: 16, margin: '12px 0 24px' }}>Let's get you back to the gifts.</p>
      <Link to="/shop" className="btn btn-pink">Browse gifts</Link>
    </section>
  );
}

import { Gift, MessageCircle } from 'lucide-react';
import { site } from '../../data/site';
import { whatsAppLink } from '../../lib/checkout';

export function CustomBand() {
  const wa = whatsAppLink(site.contacts.gifts.wa, "Hi GiftsByDeesh! I'd love a custom bouquet. Here's what they like:");
  return (
    <section className="custom-band">
      <div className="container custom-band-in">
        <div style={{ maxWidth: 640 }}>
          <p className="eyebrow" style={{ color: 'var(--pink-light)', marginBottom: 12 }}>MADE JUST FOR THEM</p>
          <h2 className="h2" style={{ fontSize: 46 }}>Dreaming up something <span style={{ color: 'var(--pink-light)' }}>custom?</span></h2>
          <p className="custom-band-p">Tell us their favourite chocolates, colours and budget — we'll design a bouquet that's one of a kind.</p>
        </div>
        <div className="custom-band-ctas">
          <a href="#build" className="btn custom-btn" style={{ background: '#fff', color: 'var(--ink)' }}>
            <Gift size={20} aria-hidden="true" />Build your own box
          </a>
          <a href={wa} target="_blank" rel="noopener" className="btn btn-wa custom-btn">
            <MessageCircle size={20} aria-hidden="true" />Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

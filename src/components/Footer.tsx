import { Link } from 'react-router-dom';
import { site } from '../data/site';
import { useSettings } from '../store/catalog';
import { Wordmark } from './Logo';
import { InstagramIcon, TikTokIcon } from './Shapes';
import './Footer.css';

export function Footer({ note }: { note?: string }) {
  const settings = useSettings();
  return (
    <footer className="site-foot">
      <div className="foot-in">
        <div className="foot-brand">
          <Wordmark dark />
          <p>Kinder chocolate bouquets, cuddly teddy bears and playful gifts, thoughtfully wrapped and delivered across Sri Lanka.</p>
          <div className="foot-social">
            <a href={site.instagram.url} target="_blank" rel="noopener" aria-label={`Instagram ${site.instagram.handle}`}><InstagramIcon size={18} /></a>
            <a href={site.tiktok.url} target="_blank" rel="noopener" aria-label={`TikTok ${site.tiktok.handle}`}><TikTokIcon size={18} /></a>
          </div>
        </div>
        <div className="foot-col">
          <strong>Shop Gifts</strong>
          <Link to="/shop?vibe=sweet">Chocolate Bouquets</Link>
          <Link to="/shop?vibe=cuddly">Teddy Bears</Link>
          <Link to="/shop?vibe=sweet">Kinder Gifts</Link>
          <Link to="/shop?vibe=playful">Hot Wheels</Link>
          <Link to="/offers">Offers</Link>
        </div>
        <div className="foot-col">
          <strong>Customer Support</strong>
          <Link to="/#order">How to Order</Link>
          <Link to="/about#faq">Delivery Information</Link>
          <Link to="/about#faq">FAQs</Link>
          <Link to="/about#contact">Contact Us</Link>
        </div>
        <div className="foot-col">
          <strong>Get in Touch</strong>
          <a href={`https://wa.me/${site.contacts.gifts.wa}`} target="_blank" rel="noopener">Gifts: {site.contacts.gifts.number}</a>
          <a href={`https://wa.me/${site.contacts.chocolate.wa}`} target="_blank" rel="noopener">Chocolate: {site.contacts.chocolate.number}</a>
          <span>{settings.shopHours}</span>
        </div>
      </div>
      <div className="foot-base">
        {note && <span>{note} </span>}© {site.year} {site.company}.
      </div>
    </footer>
  );
}

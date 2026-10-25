import { useState } from 'react';
import { Candy, Gift, MapPin, MessageCircle } from 'lucide-react';
import { contactCards } from '../../data/about';
import { site } from '../../data/site';
import { useSettings } from '../../store/catalog';
import { whatsAppLink } from '../../lib/checkout';
import { InstagramIcon, TikTokIcon } from '../../components/Shapes';
import { useTimers } from '../../hooks/useTimers';

export function Contact() {
  const [copied, setCopied] = useState('');
  const later = useTimers();
  const settings = useSettings();

  const copy = async (id: string, number: string) => {
    try { await navigator.clipboard?.writeText(number); } catch { /* clipboard blocked */ }
    setCopied(id);
    later(() => setCopied((c) => (c === id ? '' : c)), 1800);
  };

  return (
    <section id="contact" className="container sec-t sec-b-sm">
      <div className="sec-head" style={{ marginBottom: 32 }}>
        <div>
          <p className="eyebrow">CONTACT</p>
          <h2 className="h2">Say hi — we reply fast</h2>
        </div>
        <div className="open-now"><span className="open-dot" aria-hidden="true" />{settings.shopHours}</div>
      </div>
      <div className="chats">
        {contactCards.map((c) => (
          <div key={c.id} className="chat-card">
            <div className="chat-head">
              <span className="chat-ic" style={{ background: c.tint, color: c.color }}>
                {c.kind === 'gift' ? <Gift size={28} aria-hidden="true" /> : <Candy size={28} aria-hidden="true" />}
              </span>
              <div>
                <h3 className="chat-t">{c.title}</h3>
                <div className="chat-s">{c.sub}</div>
              </div>
            </div>
            <div className="chat-num">{c.number}</div>
            <div className="chat-ctas">
              <a className="wa-btn" href={whatsAppLink(c.wa, c.msg)} target="_blank" rel="noopener">
                <MessageCircle className="bub" size={20} aria-hidden="true" />Chat on WhatsApp
              </a>
              <button className={`cp-btn ${copied === c.id ? 'on' : ''}`} onClick={() => copy(c.id, c.number)}>
                {copied === c.id ? 'Copied!' : 'Copy number'}
                <span className="sr-only"> {c.number}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="info-row">
        <div className="info-card">
          <span className="info-ic" style={{ background: '#E6EEFA', color: '#3B6CC0' }}><MapPin size={22} aria-hidden="true" /></span>
          <div><div className="info-t">Islandwide delivery</div><div className="info-s">Next-day in {settings.cutoffArea} if you order by {settings.cutoffTime}.</div></div>
        </div>
        <a href={site.instagram.url} target="_blank" rel="noopener" className="info-card">
          <span className="info-ic" style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}><InstagramIcon size={22} /></span>
          <div><div className="info-t">{site.instagram.handle}</div><div className="info-s">Behind-the-scenes on Instagram</div></div>
        </a>
        <a href={site.tiktok.url} target="_blank" rel="noopener" className="info-card">
          <span className="info-ic" style={{ background: 'var(--ink)', color: '#fff' }}><TikTokIcon size={22} /></span>
          <div><div className="info-t">{site.tiktok.handle}</div><div className="info-s">Wrapping videos on TikTok</div></div>
        </a>
      </div>
    </section>
  );
}

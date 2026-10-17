import { Check, MessageCircle } from 'lucide-react';

const steps = [
  { n: '1', title: 'Pick a gift', text: 'Browse bouquets, teddies and hampers — each one hand-picked.' },
  { n: '2', title: 'Add to basket', text: 'Add a note for the card and choose your delivery date.' },
  { n: 'wa', title: 'Confirm on WhatsApp', text: 'We confirm details and payment in chat, then deliver islandwide.' },
];

export function Steps() {
  return (
    <section id="order" className="container steps-sec">
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <p className="eyebrow">HOW IT WORKS</p>
        <h2 className="h2">Ordering takes three taps</h2>
      </div>
      <ol className="steps">
        <li className="step-line" aria-hidden="true" />
        {steps.map((s) => (
          <li key={s.title} className="step">
            <div className={`step-n ${s.n === 'wa' ? 'wa' : ''}`}>
              {s.n === 'wa' ? <MessageCircle size={30} aria-hidden="true" /> : s.n}
            </div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="trust">
        {['Hand-picked gifts', 'Beautiful gift wrapping', 'Islandwide delivery'].map((t) => (
          <span key={t}><Check size={18} color="var(--pink)" aria-hidden="true" />{t}</span>
        ))}
      </div>
    </section>
  );
}

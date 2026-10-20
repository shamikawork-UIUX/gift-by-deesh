import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Check, ChevronDown, CreditCard, Gift, Heart, MessageCircle, Minus, Plus, ShoppingBasket, Trash2, X } from 'lucide-react';
import { cartCount, cartTotal, useCart } from '../store/cart';
import { checkoutUrl, deliveryOptions, newOrderRef, recordOrder } from '../lib/checkout';
import { useSettings } from '../store/catalog';
import { flip, kokoPart, money } from '../lib/format';
import { useExit, useFocusTrap } from '../hooks/useDialog';
import { useTimers } from '../hooks/useTimers';
import { Koko } from './PriceBlock';
import { TeddyBasket } from './Shapes';
import './CartDrawer.css';

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  return isOpen ? <Drawer /> : null;
}

function Drawer() {
  const lines = useCart((s) => s.lines);
  const note = useCart((s) => s.note);
  const pay = useCart((s) => s.pay);
  const deliveryDate = useCart((s) => s.deliveryDate);
  const undo = useCart((s) => s.undo);
  const { inc, dec, remove, undoRemove, clearUndo, clear, setDeliveryDate, setNote, setPay, close } = useCart.getState();

  const ref = useRef<HTMLElement>(null);
  const later = useTimers();
  const [closing, requestClose] = useExit(close, 300);
  useFocusTrap(ref, requestClose);

  const [removing, setRemoving] = useState<Record<string, boolean>>({});
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [lastUrl, setLastUrl] = useState('');
  // One reference per basket: re-sending after "Not yet" updates the same saved order.
  const [orderRef, setOrderRef] = useState(newOrderRef);
  const settings = useSettings();
  const [gen, setGen] = useState(0);
  const firstRender = useRef(true);

  const count = cartCount(lines);
  const total = cartTotal(lines);
  const dates = useMemo(() => deliveryOptions(), []);
  const picked = dates.find((d) => d.iso === deliveryDate) ?? dates[0];
  const order = { ref: orderRef, lines, deliveryDate: picked.date, note, pay };
  const url = checkoutUrl(order, settings.orderWhatsApp);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setGen((g) => g + 1);
  }, [lines]);

  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(clearUndo, 4500);
    return () => clearTimeout(t);
  }, [undo, clearUndo]);

  const doRemove = (key: string) => {
    if (removing[key]) return;
    setRemoving((r) => ({ ...r, [key]: true }));
    later(() => {
      remove(key);
      setRemoving((r) => {
        const n = { ...r };
        delete n[key];
        return n;
      });
    }, 320);
  };

  // The basket is only emptied once the customer confirms they pressed send in WhatsApp,
  // so nothing is lost if WhatsApp didn't open or they backed out.
  const send = () => {
    recordOrder(order);
    setSending(true);
    setLastUrl(url);
    later(() => {
      setSending(false);
      setSent(true);
      setOpenDetails({});
    }, 1500);
  };
  const confirmSent = () => {
    clear();
    setOrderRef(newOrderRef());
    requestClose();
  };

  const popCls = flip(gen, 'pa', 'pb');
  const view = sent && lines.length ? 'sent' : lines.length === 0 ? 'empty' : 'full';

  return (
    <div className={`cd-layer ${closing ? 'closing' : ''}`}>
      <button className="cd-back" aria-label="Close basket" tabIndex={-1} onClick={requestClose} />
      <aside ref={ref} className="cdr" role="dialog" aria-modal="true" aria-labelledby="cd-title">
        <div className="cd-head">
          <span className="cd-head-ic"><ShoppingBasket size={22} aria-hidden="true" /></span>
          <div>
            <h2 id="cd-title" className="cd-title">Your basket</h2>
            <div className={`cd-sub ${popCls}`}>
              {count === 0 ? 'Empty for now' : `${count} ${count === 1 ? 'item' : 'items'} · ${money(total)}`}
            </div>
          </div>
          <button className="cd-x" aria-label="Close basket" onClick={requestClose}><X size={16} strokeWidth={2.6} aria-hidden="true" /></button>
        </div>

        {view === 'empty' && (
          <div className="cd-state">
            <TeddyBasket className="cd-sway" />
            <h3>Nothing here yet…</h3>
            <p>Your basket is feeling a little lonely. Let's find something sweet for it.</p>
            <Link to="/shop" className="btn btn-pink" onClick={close}>Browse gifts</Link>
          </div>
        )}

        {view === 'sent' && (
          <div className="cd-state" role="status">
            <div className="sent-ic"><Check size={48} strokeWidth={2.6} aria-hidden="true" /></div>
            <h3>Your order is ready in WhatsApp!</h3>
            <p>Just press send in WhatsApp. We'll reply to confirm availability, delivery and payment.</p>
            <button className="btn btn-ink" onClick={confirmSent}>I've sent it · clear my basket</button>
            <button className="btn btn-outline" onClick={() => setSent(false)}>Not yet · back to my basket</button>
            <a href={lastUrl} target="_blank" rel="noopener" className="cd-retry">WhatsApp didn't open? Try again</a>
          </div>
        )}

        {view === 'full' && (
          <>
            <div className="cd-body">
              <ul className="cd-lines" aria-label="Items in your basket">
                {lines.map((l, i) => {
                  const det = !!openDetails[l.key];
                  const hasDet = !!l.details?.length;
                  return (
                    <li key={l.key} className={`cl ${removing[l.key] ? 'out' : ''}`} style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                      <div className="cl-row">
                        <span className="cl-th" style={{ background: l.tint }}><Gift size={26} aria-hidden="true" /></span>
                        <div className="cl-info">
                          <div className="cl-name">{l.name}</div>
                          <div className="cl-sub">{l.qty > 1 ? `${money(l.price)} each` : l.sub || 'Hand-wrapped with love'}</div>
                          {hasDet && (
                            <button
                              className={`det-btn ${det ? 'on' : ''}`}
                              aria-expanded={det}
                              onClick={() => setOpenDetails((d) => ({ ...d, [l.key]: !det }))}
                            >
                              {det ? 'Hide details' : "See what's inside"}
                              <ChevronDown size={14} strokeWidth={2.6} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                        <button className="cl-del" aria-label={`Remove ${l.name}`} onClick={() => doRemove(l.key)}>
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                      {hasDet && (
                        <div className={`det ${det ? 'on' : ''}`} aria-hidden={!det}>
                          <div><ul>{l.details!.map((d) => <li key={d}>{d}</li>)}</ul></div>
                        </div>
                      )}
                      <div className="cl-foot">
                        <div className="cq">
                          <button aria-label={`One less ${l.name}`} onClick={() => dec(l.key)} disabled={l.qty <= 1}><Minus size={14} strokeWidth={2.8} aria-hidden="true" /></button>
                          <span className="n" aria-label={`Quantity ${l.qty}`}>{l.qty}</span>
                          <button aria-label={`One more ${l.name}`} onClick={() => inc(l.key)}><Plus size={14} strokeWidth={2.8} aria-hidden="true" /></button>
                        </div>
                        <div className="cl-total">{money(l.price * l.qty)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <fieldset className="cd-sec">
                <legend className="cd-lab"><CalendarDays size={16} aria-hidden="true" />When should it arrive?</legend>
                <div className="dchips">
                  {dates.map((d) => (
                    <button key={d.iso} className={`dchip ${d.iso === picked.iso ? 'on' : ''}`} aria-pressed={d.iso === picked.iso} onClick={() => setDeliveryDate(d.iso)}>
                      <span className="w">{d.weekday}</span>
                      <span className="d">{d.day}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="cd-sec">
                <label htmlFor="cd-note" className="cd-lab"><Heart size={16} aria-hidden="true" />Gift note (optional)</label>
                <textarea id="cd-note" className="cd-note" placeholder="Happy birthday! Love you lots." value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
              </div>

              <fieldset className="cd-sec">
                <legend className="cd-lab"><CreditCard size={16} aria-hidden="true" />How would you like to pay?</legend>
                <div className="pchips">
                  <button className={`pchip ${pay === 'full' ? 'on' : ''}`} aria-pressed={pay === 'full'} onClick={() => setPay('full')}>
                    Pay in full<span className="s">Details shared in chat</span>
                  </button>
                  <button className={`pchip ${pay === 'koko' ? 'on' : ''}`} aria-pressed={pay === 'koko'} onClick={() => setPay('koko')}>
                    KOKO instalments<span className="s">3 × {money(kokoPart(total))}, interest-free</span>
                  </button>
                </div>
              </fieldset>
              <p className="cd-fine cd-fine-body">No payment now. We'll confirm availability, delivery fee and payment in the chat.</p>
            </div>

            <div className="cd-foot">
              {undo && (
                <div className="undo" role="status">
                  <span>Removed {undo.line.name}</span>
                  <button onClick={undoRemove}>Undo</button>
                </div>
              )}
              <div className="cd-row"><span>Delivery</span><span>Confirmed on WhatsApp</span></div>
              <div className="cd-row cd-total-row">
                <span>Total</span>
                <span className={`cd-total ${popCls}`}>{money(total)}</span>
              </div>
              <div className="cd-koko"><Koko price={total} /></div>
              <a className="send" href={url} target="_blank" rel="noopener" onClick={send}>
                <MessageCircle size={20} strokeWidth={2.2} aria-hidden="true" />Send order on WhatsApp
              </a>
              <p className="cd-fine">No payment now. We'll confirm availability, delivery fee and payment in the chat.</p>
            </div>
          </>
        )}

        {sending && (
          <div className="sending" role="status">
            <svg aria-hidden="true" width="260" height="200" viewBox="0 0 260 200" style={{ overflow: 'visible' }}>
              <path className="trail" d="M20 180 C 80 150, 120 120, 150 100" stroke="#D6245F" strokeWidth="3" fill="none" strokeLinecap="round" />
              <g className="plane" style={{ transformOrigin: '150px 100px' }}>
                <path d="M110 100 L190 70 L160 130 L148 108 Z" fill="#25D366" />
                <path d="M148 108 L190 70 L140 104 Z" fill="#17A34A" />
                <path d="M148 108 L152 124 L160 130 Z" fill="#128C3E" />
              </g>
            </svg>
            <div className="sending-t">Sending your order…</div>
            <div className="sending-s">Opening WhatsApp</div>
          </div>
        )}
      </aside>
    </div>
  );
}

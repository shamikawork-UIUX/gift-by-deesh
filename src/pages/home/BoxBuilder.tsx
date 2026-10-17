import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Gift, Minus, Plus, X } from 'lucide-react';
import { boxCategories, boxItems, boxSizes, wraps, TAG_MAX, type BoxCategory, type BoxSizeId, type WrapId } from '../../data/boxBuilder';
import { Bow, HEART_PATH, STAR_PATH, ShapeSvg } from '../../components/Shapes';
import { Koko } from '../../components/PriceBlock';
import { useCart, type CartLine } from '../../store/cart';
import { useFly } from '../../store/fly';
import { useTimers } from '../../hooks/useTimers';
import { flip, money, prefersReducedMotion } from '../../lib/format';
import './BoxBuilder.css';

type Phase = 'idle' | 'closing' | 'done';

const itemById = Object.fromEntries(boxItems.map((it) => [it.id, it]));

export function BoxBuilder() {
  const [sizeId, setSizeId] = useState<BoxSizeId>('m');
  const [cat, setCat] = useState<BoxCategory | 'all'>('all');
  const [order, setOrder] = useState<string[]>([]);
  const [wrapId, setWrapId] = useState<WrapId>('blush');
  const [note, setNote] = useState('');
  const [bump, setBump] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [toast, setToast] = useState(0);
  const [flyStyle, setFlyStyle] = useState<{ transform: string; opacity: number; transition: string }>({ transform: 'none', opacity: 1, transition: '' });
  const stageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  const later = useTimers();

  // Phones: while picking goodies the live box is far below, so a sticky mini-box bar
  // mirrors it. It hides again once the real box card is on screen.
  useEffect(() => {
    const controls = controlsRef.current;
    const card = cardRef.current;
    if (!controls || !card) return;
    const mq = window.matchMedia('(max-width: 900px)');
    let controlsIn = false;
    let cardIn = false;
    const update = () => setShowBar(mq.matches && controlsIn && !cardIn);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.target === controls) controlsIn = e.isIntersecting;
          else cardIn = e.intersectionRatio >= 0.2;
        });
        update();
      },
      { threshold: [0, 0.2] },
    );
    io.observe(controls);
    io.observe(card);
    mq.addEventListener('change', update);
    return () => {
      io.disconnect();
      mq.removeEventListener('change', update);
    };
  }, []);

  const reviewBox = () =>
    cardRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });

  const size = boxSizes.find((z) => z.id === sizeId)!;
  const wrap = wraps.find((w) => w.id === wrapId)!;
  const closing = phase === 'closing';
  const count = order.length;
  const full = count >= size.cap;
  const left = size.cap - count;
  const qty: Record<string, number> = {};
  order.forEach((id) => { qty[id] = (qty[id] || 0) + 1; });
  const itemsSum = order.reduce((a, id) => a + itemById[id].price, 0);
  const total = size.price + itemsSum;
  const pop = flip(bump, 'pa', 'pb');

  // Functional updates so rapid taps never read a stale box.
  const change = (fn: (o: string[]) => string[]) => {
    if (closing) return;
    setOrder(fn);
    setBump((b) => b + 1);
    setPhase('idle');
  };
  const addItem = (id: string) => change((o) => (o.length >= size.cap ? o : o.concat(id)));
  const minusItem = (id: string) =>
    change((o) => {
      const i = o.lastIndexOf(id);
      return i < 0 ? o : o.filter((_, j) => j !== i);
    });
  const removeAt = (i: number) => change((o) => o.filter((_, j) => j !== i));

  const addBox = () => {
    if (!count || closing) return;
    const counts: Record<string, number> = {};
    order.forEach((id) => { counts[itemById[id].name] = (counts[itemById[id].name] || 0) + 1; });
    const details = Object.entries(counts).map(([n, c]) => `${n} ×${c}`);
    details.push(`Wrap: ${wrap.label}`);
    if (note.trim()) details.push(`Gift tag: "${note.trim()}"`);
    const line: CartLine = {
      key: `box-${Date.now()}`,
      name: `Custom Gift Box (${size.label})`,
      price: total,
      qty: 1,
      tint: wrap.box,
      details,
      sub: `${count} goodies, hand-packed`,
    };
    const finish = () => {
      setPhase('done');
      setOrder([]);
      setNote('');
      setToast((t) => t + 1);
      later(() => setToast(0), 2800);
    };

    if (prefersReducedMotion()) {
      useCart.getState().add(line);
      finish();
      return;
    }

    setPhase('closing');
    later(() => {
      const st = stageRef.current;
      const basket = useFly.getState().basketEl;
      if (!st || !basket) return;
      const a = st.getBoundingClientRect();
      const c = basket.getBoundingClientRect();
      const dx = Math.round(c.left + c.width / 2 - (a.left + a.width / 2));
      const dy = Math.round(c.top + c.height / 2 - (a.top + a.height / 2));
      setFlyStyle({
        transform: `translate(${dx}px, ${dy}px) rotate(14deg) scale(.08)`,
        opacity: 0.15,
        transition: 'transform .85s cubic-bezier(.55,0,.2,1), opacity .85s ease-in',
      });
    }, 1700);
    later(() => useCart.getState().add(line), 2550);
    later(() => {
      finish();
      setFlyStyle({ transform: 'none', opacity: 1, transition: 'none' });
    }, 2700);
    later(() => setFlyStyle((s) => ({ ...s, transition: '' })), 2760);
  };

  let stageCls = '';
  if (closing) stageCls = 'closing';
  else if (phase === 'done') stageCls = 'popin';
  else if (bump > 0) stageCls = bump % 2 ? 'wa' : 'wb';

  return (
    <section id="build" className="build-sec">
      <div className="container sec-y">
        <div className="sec-head">
          <div>
            <p className="eyebrow">BUILD YOUR OWN</p>
            <h2 className="h2">Pack a gift box, your way</h2>
          </div>
          <p className="sec-lede" style={{ maxWidth: 400 }}>Pick a box, fill it with their favourites and watch it come together. We'll wrap it exactly like this.</p>
        </div>

        <div className="build-wrap">
          <div className="build-controls" ref={controlsRef}>
            <fieldset className="bfield">
              <legend className="bstep"><span className="bnum">1</span>Choose your box</legend>
              <div className="sizes">
                {boxSizes.map((z) => (
                  <button
                    key={z.id}
                    className={`size ${z.id === sizeId ? 'on' : ''}`}
                    aria-pressed={z.id === sizeId}
                    disabled={closing || z.cap < count}
                    onClick={() => { setSizeId(z.id); setBump((b) => b + 1); setPhase('idle'); }}
                  >
                    <span className="size-t">{z.label}</span>
                    <span className="size-s">Fits {z.cap} goodies</span>
                    <span className="size-p">{money(z.price)}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="bfield">
              <div className="bstep-row">
                <legend className="bstep" style={{ margin: 0 }}><span className="bnum">2</span>Fill it with goodies</legend>
                <div className="bcats" role="group" aria-label="Filter goodies">
                  {boxCategories.map((c) => (
                    <button key={c.id} className={`tab ${c.id === cat ? 'on' : ''}`} aria-pressed={c.id === cat} onClick={() => setCat(c.id)}>{c.label}</button>
                  ))}
                </div>
              </div>
              <div className="bgrid">
                {boxItems.filter((it) => cat === 'all' || it.cat === cat).map((it) => {
                  const q = qty[it.id] || 0;
                  return (
                    <div key={it.id} className={`bi ${q ? 'has' : ''}`}>
                      <span className="tok" style={{ background: it.tint }}><ShapeSvg shape={it.shape} c1={it.c1} /></span>
                      <div className="bi-info">
                        <div className="bi-name">{it.name}</div>
                        <div className="bi-price">{money(it.price)}</div>
                      </div>
                      <div className="bi-stp">
                        <button className="stp" aria-label={`Remove one ${it.name}`} disabled={!q || closing} onClick={() => minusItem(it.id)}>
                          <Minus size={16} strokeWidth={2.6} aria-hidden="true" />
                        </button>
                        <span className={q ? pop : ''} aria-live="polite" aria-label={`${q} ${it.name} in box`}>{q}</span>
                        <button className="stp plus" aria-label={`Add ${it.name}`} disabled={full || closing} onClick={() => addItem(it.id)}>
                          <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="bfield">
              <legend className="bstep"><span className="bnum">3</span>Wrap it &amp; add a note</legend>
              <div className="wrap-row">
                <div>
                  <div className="wrap-lab" id="wrap-lab">Wrap colour · <span>{wrap.label}</span></div>
                  <div className="swatches" role="radiogroup" aria-labelledby="wrap-lab">
                    {wraps.map((w) => (
                      <button
                        key={w.id}
                        role="radio"
                        aria-checked={w.id === wrapId}
                        className={`sw ${w.id === wrapId ? 'on' : ''}`}
                        aria-label={`${w.label} wrap`}
                        onClick={() => setWrapId(w.id)}
                        style={{ background: w.box }}
                      />
                    ))}
                  </div>
                </div>
                <div className="note-field">
                  <label htmlFor="box-note" className="wrap-lab">Gift tag message <span>({TAG_MAX - note.length} left)</span></label>
                  <input
                    id="box-note"
                    className="note-in"
                    type="text"
                    placeholder="Happy birthday, Nimmi!"
                    value={note}
                    maxLength={TAG_MAX}
                    onChange={(e) => setNote(e.target.value.slice(0, TAG_MAX))}
                  />
                </div>
              </div>
            </fieldset>
          </div>

          <div className="build-side">
            <div className="box-card" ref={cardRef}>
              <div className="box-card-head">
                <div>
                  <div className="box-card-t">Your gift box</div>
                  <div className="box-card-s">{size.label} box · {wrap.label}</div>
                </div>
                {full && !closing && (
                  <span className="full-chip"><Check size={14} strokeWidth={3} aria-hidden="true" />Box is full!</span>
                )}
              </div>

              <div className="box-area">
                <div ref={stageRef} className="box-fly" style={flyStyle}>
                  <div className={`box-stage ${stageCls}`}>
                    <div className="box-shell" style={{ background: wrap.box }}>
                      <div className="box-tray" style={{ background: wrap.tray, gridTemplateColumns: `repeat(${size.cols}, minmax(0, 1fr))` }}>
                        {Array.from({ length: size.cap }, (_, i) => {
                          const id = order[i];
                          const it = id ? itemById[id] : null;
                          return (
                            <div key={i} className="slot">
                              {it ? (
                                <button key={`${i}-${id}`} className="slot-fill" aria-label={`Take out ${it.name}`} onClick={() => removeAt(i)}>
                                  <span className="tok" style={{ background: it.tint }}><ShapeSvg shape={it.shape} c1={it.c1} /></span>
                                  <span className="x" aria-hidden="true"><X size={12} strokeWidth={3} /></span>
                                </button>
                              ) : (
                                <div className="slot-empty" aria-hidden="true"><Plus size={18} strokeWidth={2.4} /></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {note.trim() && !closing && <div className="tag">{note}</div>}

                    {closing && (
                      <div className="lid" style={{ background: wrap.box }}>
                        <div className="rib-v" style={{ background: wrap.ribbon }} />
                        <div className="rib-h" style={{ background: wrap.ribbon }} />
                        <Bow className="bow" color={wrap.ribbon} />
                        <svg className="bsp b1" aria-hidden="true" viewBox="0 0 24 24" fill="#D6245F"><path d={HEART_PATH} /></svg>
                        <svg className="bsp b2" aria-hidden="true" viewBox="0 0 24 24" fill="#F7C548"><path d={STAR_PATH} /></svg>
                        <svg className="bsp b3" aria-hidden="true" viewBox="0 0 24 24" fill="#F7C548"><path d={STAR_PATH} /></svg>
                        <svg className="bsp b4" aria-hidden="true" viewBox="0 0 24 24" fill="#D6245F"><path d={HEART_PATH} /></svg>
                      </div>
                    )}
                  </div>
                </div>
                {closing && <div className="box-cap" role="status">Wrapping it with love…</div>}
              </div>

              <div className="meter-row">
                <span>{count} of {size.cap} filled</span>
                <span className="muted">{full ? 'Ready to wrap!' : `${left} ${left === 1 ? 'spot' : 'spots'} left`}</span>
              </div>
              <div className="meter" role="progressbar" aria-label="Box filled" aria-valuemin={0} aria-valuemax={size.cap} aria-valuenow={count}>
                <span style={{ width: `${Math.round((count / size.cap) * 100)}%` }} />
              </div>

              <div className="box-sum">
                <div><span>{size.label} box</span><span>{money(size.price)}</span></div>
                <div><span>Goodies ({count})</span><span>{money(itemsSum)}</span></div>
                <div className="box-total"><span>Total</span><span className={`box-total-n ${pop}`}>{money(total)}</span></div>
                <div style={{ textAlign: 'right', marginTop: -2 }}><Koko price={total} /></div>
              </div>

              <button className="add-box" onClick={addBox} disabled={!count || closing}>
                <Gift size={20} aria-hidden="true" />Add box to basket
              </button>
              <div className="box-foot">
                <span>We confirm everything with you on WhatsApp at checkout.</span>
                <button onClick={() => change(() => [])} disabled={!count || closing}>Empty box</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`mbar ${showBar && !closing ? 'show' : ''}`} aria-hidden={!showBar || closing}>
        <div className={`mbar-box ${flip(bump, 'wa', 'wb')}`} style={{ background: wrap.box }}>
          <div className="mbar-tray" style={{ background: wrap.tray, gridTemplateColumns: `repeat(${size.cols}, 18px)` }}>
            {Array.from({ length: size.cap }, (_, i) => {
              const it = order[i] ? itemById[order[i]] : null;
              return it ? (
                <span key={`${i}-${order[i]}`} className="mbar-slot filled" style={{ background: it.tint }}><ShapeSvg shape={it.shape} c1={it.c1} /></span>
              ) : (
                <span key={i} className="mbar-slot" />
              );
            })}
          </div>
        </div>
        <div className="mbar-info">
          <div className="mbar-count">
            {count === 0 ? 'Tap + to fill your box' : full ? 'Box is full!' : `${count} of ${size.cap} goodies`}
          </div>
          <div className={`mbar-total ${pop}`}>{money(total)}</div>
        </div>
        <button className="mbar-go" onClick={reviewBox} tabIndex={showBar ? 0 : -1}>
          {full ? 'Wrap it' : 'Review'}<ChevronDown size={16} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>

      {toast > 0 && (
        <div className="toast" role="status" key={toast}>
          <span className="toast-ic" style={{ background: 'var(--pink)', color: '#fff' }}><Check size={16} strokeWidth={3} aria-hidden="true" /></span>
          <span><strong>Gift box added to basket!</strong> <span className="dim">Build another?</span></span>
        </div>
      )}
    </section>
  );
}

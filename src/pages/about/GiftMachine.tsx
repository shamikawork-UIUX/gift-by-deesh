import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Bike, Package, Pause, Play, Ribbon } from 'lucide-react';
import { machineStages } from '../../data/about';
import { Bow } from '../../components/Shapes';

const stageIcons = [ArrowDownToLine, Package, Ribbon, Bike];

export function GiftMachine() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      const next = stageRef.current + 1;
      if (next > 4) {
        setPlaying(false);
        return;
      }
      setStage(next);
    }, 1500);
    return () => clearInterval(t);
  }, [playing]);

  const togglePlay = () => {
    if (playing) return setPlaying(false);
    if (stage >= 4) setStage(0);
    setPlaying(true);
  };

  const msg = stage === 0 ? 'An empty box, full of potential…' : machineStages[stage - 1].msg;
  const progress = stage <= 1 ? 0 : Math.round(((stage - 1) / 3) * 100);

  return (
    <section className="container sec-y">
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <p className="eyebrow">HOW A GIFT IS MADE</p>
        <h2 className="h2">From our hands to theirs</h2>
        <p className="machine-lede">Tap each step, or press play and watch a gift come together.</p>
      </div>
      <div className="machine">
        <div className={`belt ${playing ? '' : 'still'}`} />
        <div className={`mbox-wrap ${stage >= 4 ? 'go' : ''}`}>
          {stage >= 4 && (
            <>
              <svg className="scooter" aria-hidden="true" viewBox="0 0 290 120">
                <path d="M40 70h150l30-26h30" stroke="#1B1F3B" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M236 44l-10-26h22" stroke="#1B1F3B" strokeWidth="7" fill="none" strokeLinecap="round" />
                <rect x="60" y="62" width="120" height="16" rx="8" fill="#D6245F" />
                <g className="wheel" style={{ transformOrigin: '60px 92px' }}>
                  <circle cx="60" cy="92" r="22" fill="#1B1F3B" /><circle cx="60" cy="92" r="8" fill="#fff" />
                  <path d="M60 72v40M40 92h40" stroke="#5B6080" strokeWidth="3" />
                </g>
                <g className="wheel" style={{ transformOrigin: '240px 92px' }}>
                  <circle cx="240" cy="92" r="22" fill="#1B1F3B" /><circle cx="240" cy="92" r="8" fill="#fff" />
                  <path d="M240 72v40M220 92h40" stroke="#5B6080" strokeWidth="3" />
                </g>
              </svg>
              <svg className="speed" aria-hidden="true" viewBox="0 0 110 60">
                <path d="M10 14h70M0 30h90M20 46h60" stroke="#D6245F" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </>
          )}
          <div className="mbox">
            <div className="tray" />
            {stage >= 1 && (
              <>
                <span className="itm" style={{ left: 14, background: '#E8463B' }} />
                <span className="itm" style={{ left: 62, background: '#D9A441', animationDelay: '.12s' }} />
                <span className="itm" style={{ left: 110, background: '#C68E5E', animationDelay: '.24s' }} />
              </>
            )}
            {stage >= 2 && <div className="paper" />}
            {stage >= 3 && (
              <>
                <div className="rv" />
                <div className="rh" />
                <Bow className="bow" color="var(--pink)" full={false} />
              </>
            )}
          </div>
        </div>
        <div role="status" className="machine-msg">{msg}</div>
        <button className="machine-play" onClick={togglePlay}>
          {playing ? <><Pause size={14} fill="currentColor" aria-hidden="true" />Pause</> : <><Play size={14} fill="currentColor" aria-hidden="true" />{stage >= 4 ? 'Play again' : stage > 0 ? 'Continue' : 'Play'}</>}
        </button>
      </div>
      <div className="stages">
        <div className="prog" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        {machineStages.map((t, i) => {
          const Icon = stageIcons[i];
          const cls = stage === i + 1 ? 'on' : stage > i + 1 ? 'done' : '';
          return (
            <button key={t.label} className={`stage-btn ${cls}`} aria-pressed={stage === i + 1} onClick={() => { setPlaying(false); setStage(i + 1); }}>
              <span className="ic"><Icon size={22} aria-hidden="true" /></span>
              {t.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

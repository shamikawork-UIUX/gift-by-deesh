import { Gift } from 'lucide-react';
import { useFly } from '../store/fly';
import './FlyLayer.css';

/** Renders the tokens currently flying into the header basket. */
export function FlyLayer() {
  const flights = useFly((s) => s.flights);
  return (
    <>
      {flights.map((f) => (
        <div
          key={f.id}
          className="fly-x"
          aria-hidden="true"
          style={{ left: f.sx, top: f.sy, transform: `translateX(${f.moved ? f.dx : 0}px)` }}
        >
          <div className="fly-y" style={{ transform: `translateY(${f.moved ? f.dy : 0}px)` }}>
            <div className="fly-tok" style={{ background: f.tint }}>
              <Gift size={24} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

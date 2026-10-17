const pieces = [
  { k: 'k1', c: '#D6245F', d: 0 },
  { k: 'k2', c: '#FFD84D', d: 0.05 },
  { k: 'k3', c: '#5B8BD9', d: 0.1 },
  { k: 'k4', c: '#25D366', d: 0.02 },
  { k: 'k5', c: '#F2A7BE', d: 0.12 },
  { k: 'k6', c: '#D9A441', d: 0.08 },
];
const extras = [
  { k: 'k3', c: '#FFD84D', d: 0.2 },
  { k: 'k2', c: '#D6245F', d: 0.22 },
];

export function Confetti({ extra = false }: { extra?: boolean }) {
  return (
    <>
      {(extra ? pieces.concat(extras) : pieces).map((p, i) => (
        <span key={i} className={`conf ${p.k}`} style={{ background: p.c, animationDelay: `${p.d}s` }} aria-hidden="true" />
      ))}
    </>
  );
}

import { Link } from 'react-router-dom';

export function EmptyState({ onReset, query }: { onReset: () => void; query?: string }) {
  return (
    <div className="shop-empty">
      <svg className="empty-bear" aria-hidden="true" width="120" height="120" viewBox="0 0 40 40">
        <circle cx="11" cy="12" r="5.5" fill="#D9A77C" />
        <circle cx="29" cy="12" r="5.5" fill="#D9A77C" />
        <circle cx="20" cy="22" r="12" fill="#D9A77C" />
        <ellipse cx="20" cy="27" rx="6" ry="4.5" fill="#F6E3D1" />
        <path d="M14 19.5q1.5-1.4 3 0M23 19.5q1.5-1.4 3 0" stroke="#3B2A22" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M17.5 29q2.5-2 5 0" stroke="#3B2A22" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <ellipse cx="14" cy="23.5" rx="1" ry="1.6" fill="#7FB4E8" />
      </svg>
      <h2>{query ? `No gifts match “${query}”` : 'Nothing here yet…'}</h2>
      <p>{query ? 'Try another word, like “teddy”, “Kinder” or “Hot Wheels”. Or build a box with exactly what they love.' : 'Try a bigger budget or a different occasion. Or build a box that fits exactly.'}</p>
      <div className="shop-empty-ctas">
        <button className="btn btn-pink" onClick={onReset}>Show all gifts</button>
        <Link to="/#build" className="btn btn-outline">Build a box</Link>
      </div>
    </div>
  );
}

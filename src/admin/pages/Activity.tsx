import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { api, type ActivityEntry } from '../lib/api';
import { Button, EmptyState, ErrorState, PageHeader, Skeleton } from '../ui/ui';

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function target(e: ActivityEntry) {
  if (e.entity === 'order' && e.entityId) return `/admin/orders/${e.entityId}`;
  if (e.entity === 'product' && e.entityId && e.action !== 'delete') return `/admin/products/${e.entityId}`;
  if (e.entity === 'settings') return '/admin/settings';
  if (e.entity === 'user') return '/admin/team';
  return null;
}

export function Activity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (before?: number) => {
    setLoading(true);
    try {
      const r = await api<{ entries: ActivityEntry[]; more: boolean }>(`/activity${before ? `?before=${before}` : ''}`);
      setEntries((e) => (before ? [...e, ...r.entries] : r.entries));
      setMore(r.more);
      setError('');
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const days: [string, ActivityEntry[]][] = [];
  for (const e of entries) {
    const k = dayKey(e.at);
    const last = days[days.length - 1];
    if (last && last[0] === k) last[1].push(e); else days.push([k, [e]]);
  }

  return (
    <div className="a-page">
      <PageHeader title="Activity log" subtitle="Who changed what: orders, products, prices, settings and the team. Newest first." />
      {error && <ErrorState message={error} onRetry={() => void load()} />}
      {loading && !entries.length && <Skeleton rows={6} />}
      {!loading && !error && !entries.length && <EmptyState icon={History} title="Nothing yet" text="Changes made in the dashboard appear here." />}
      {days.map(([day, list]) => (
        <section key={day} className="a-log-day" aria-label={day}>
          <h2>{day}</h2>
          <ul className="a-log">
            {list.map((e) => {
              const to = target(e);
              return (
                <li key={e.id}>
                  <time dateTime={e.at}>{time(e.at)}</time>
                  <div>
                    <p>{to ? <Link to={to} className="a-link">{e.summary}</Link> : e.summary}</p>
                    <span className="a-muted a-small">{e.user ?? 'Someone (account removed)'}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {more && <Button onClick={() => void load(entries[entries.length - 1]?.id)} loading={loading}>Show older</Button>}
    </div>
  );
}

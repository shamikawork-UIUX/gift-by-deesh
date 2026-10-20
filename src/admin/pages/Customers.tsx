import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, MessageCircle, SearchX, Users } from 'lucide-react';
import type { Customer } from '../lib/api';
import { useCan } from '../lib/session';
import { useApi } from '../lib/useApi';
import { useDesktop } from '../lib/useMedia';
import { money, phone, timeAgo, waLink } from '../lib/format';
import { Badge, Button, EmptyState, ErrorState, PageHeader, SearchBox, Skeleton, btn } from '../ui/ui';

export function Customers() {
  const can = useCan();
  const desktop = useDesktop();
  const { data, error, loading, reload } = useApi<{ customers: Customer[] }>('/customers');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = q.toLowerCase().trim();
    const digits = t.replace(/\D/g, '');
    return (data?.customers ?? []).filter((c) => !t || c.name.toLowerCase().includes(t) || (digits && c.phone.includes(digits.replace(/^0/, ''))));
  }, [data, q]);
  const showSpend = can('revenue.view');

  return (
    <div className="a-page">
      <PageHeader title="Customers" subtitle="Everyone with a phone number on an order. Add the number to an order to see the customer here." />
      <div className="a-toolbar"><SearchBox value={q} onChange={setQ} label="Search customers" placeholder="Name or phone number" /></div>

      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading && !data && <Skeleton rows={5} />}
      {data && list.length === 0 && (q
        ? <EmptyState icon={SearchX} title={`No customers match “${q}”`} action={<Button onClick={() => setQ('')}>Clear search</Button>} />
        : <EmptyState icon={Users} title="No customers yet" text="When you add a customer's phone number to an order, they appear here with their order history." />)}

      {list.length > 0 && (desktop ? (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead><tr><th scope="col">Customer</th><th scope="col">Phone</th><th scope="col" className="num">Orders</th>{showSpend && <th scope="col" className="num">Spent</th>}<th scope="col">Last order</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.phone}>
                  <td><strong>{c.name || 'No name'}</strong> {c.reminders && <Badge tone="violet"><BellRing size={12} aria-hidden="true" />Reminders</Badge>}</td>
                  <td>{phone(c.phone)}</td>
                  <td className="num">{c.orders}</td>
                  {showSpend && <td className="num">{money(c.spent)}</td>}
                  <td>{timeAgo(c.lastOrder)}</td>
                  <td className="a-row-actions">
                    <Link to={`/admin/orders?status=all&q=${c.phone}`} className={btn('secondary', 'sm')}>Orders</Link>
                    <a href={waLink(c.phone, `Hi ${c.name.split(' ')[0] || ''}! `)} target="_blank" rel="noopener" className={btn('whatsapp', 'sm')}><MessageCircle size={16} aria-hidden="true" />WhatsApp</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="a-cards">
          {list.map((c) => (
            <li key={c.phone} className="a-person">
              <div className="a-row-top"><strong>{c.name || 'No name'}</strong>{c.reminders && <Badge tone="violet">Reminders</Badge>}</div>
              <div className="a-row-sub">{phone(c.phone)}</div>
              <div className="a-row-meta">{c.orders} {c.orders === 1 ? 'order' : 'orders'}{showSpend && ` · ${money(c.spent)}`} · last {timeAgo(c.lastOrder)}</div>
              <div className="a-person-actions">
                <Link to={`/admin/orders?status=all&q=${c.phone}`} className={btn('secondary', 'sm')}>See orders</Link>
                <a href={waLink(c.phone, `Hi ${c.name.split(' ')[0] || ''}! `)} target="_blank" rel="noopener" className={btn('whatsapp', 'sm')}><MessageCircle size={16} aria-hidden="true" />WhatsApp</a>
              </div>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

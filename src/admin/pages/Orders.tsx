import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Download, Globe, Inbox, Phone, Plus, SearchX } from 'lucide-react';
import type { Order, OrderStatus } from '../lib/api';
import { useCan } from '../lib/session';
import { useApi } from '../lib/useApi';
import { useDesktop } from '../lib/useMedia';
import { dayLabel, downloadCsv, isOverdue, itemsSummary, money, phone, statusInfo, timeAgo } from '../lib/format';
import { Badge, Button, EmptyState, ErrorState, FilterPills, PageHeader, SearchBox, Skeleton, StatusBadge, btn } from '../ui/ui';

type Filter = 'active' | OrderStatus | 'all';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'active', label: 'To do' },
  { id: 'new', label: 'New' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

const emptyText: Partial<Record<Filter, string>> = {
  active: 'Nothing waiting. New website orders land here automatically.',
  new: 'No new orders to confirm right now.',
};

export function DeliveryCell({ o }: { o: Order }) {
  const late = isOverdue(o);
  return (
    <span className={late ? 'a-late' : ''}>
      {dayLabel(o.deliveryDate)}
      {late && <Badge tone="red">Overdue</Badge>}
    </span>
  );
}

export function Orders() {
  const can = useCan();
  const desktop = useDesktop();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as Filter) || 'active';
  const q = params.get('q') || '';
  const [text, setText] = useState(q);

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (text === q) return;
      const p = new URLSearchParams(params);
      if (text) p.set('q', text); else p.delete('q');
      setParams(p, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [text, q, params, setParams]);

  const setStatus = (s: Filter) => {
    const p = new URLSearchParams(params);
    if (s === 'active') p.delete('status'); else p.set('status', s);
    setParams(p, { replace: true });
  };

  const path = `/orders?status=${status}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
  const { data, error, loading, reload } = useApi<{ orders: Order[]; counts: Record<string, number> }>(path, { pollMs: 30_000 });
  const orders = data?.orders ?? [];

  const exportCsv = () => downloadCsv(`orders-${status}-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Reference', 'Created', 'Status', 'Customer', 'Phone', 'Address', 'Items', 'Delivery date', 'Payment method', 'Paid', 'Subtotal', 'Delivery fee', 'Total'],
    ...orders.map((o) => [o.ref, o.createdAt, statusInfo[o.status].label, o.customerName, phone(o.customerPhone), o.address, itemsSummary(o), o.deliveryDate ?? '',
      o.payMethod === 'koko' ? 'KOKO' : 'Full', o.paymentStatus === 'paid' ? 'Yes' : 'No', o.subtotal, o.deliveryFee, o.total]),
  ]);

  return (
    <div className="a-page">
      <PageHeader
        title="Orders"
        subtitle="Website orders appear here when a customer sends them on WhatsApp."
        actions={
          <>
            {can('revenue.view') && desktop && orders.length > 0 && <Button icon={Download} onClick={exportCsv}>Export CSV</Button>}
            {can('orders.edit') && <Link to="/admin/orders/new" className={btn('primary')}><Plus size={18} aria-hidden="true" />New order</Link>}
          </>
        }
      />

      <div className="a-toolbar">
        <FilterPills label="Show orders" items={FILTERS.map((f) => ({ ...f, count: data?.counts[f.id] }))} value={status} onChange={setStatus} />
        <SearchBox value={text} onChange={setText} label="Search orders" placeholder="Reference, name, phone or item" />
      </div>

      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading && !data && <Skeleton rows={6} />}

      {data && orders.length === 0 && (
        q
          ? <EmptyState icon={SearchX} title={`No orders match “${q}”`} text="Try the order reference (GBD-…), a phone number or part of the name." action={<Button onClick={() => setText('')}>Clear search</Button>} />
          : <EmptyState icon={Inbox} title="No orders here" text={emptyText[status] ?? 'Try another filter.'} />
      )}

      {orders.length > 0 && (desktop ? (
        <div className="a-table-wrap">
          <table className="a-table">
            <caption className="sr-only">{FILTERS.find((f) => f.id === status)?.label} orders</caption>
            <thead>
              <tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Items</th><th scope="col">Delivery</th><th scope="col">Payment</th><th scope="col" className="num">Total</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.ref} className="a-tr-link" onClick={(e) => { if (!(e.target as HTMLElement).closest('a')) navigate(`/admin/orders/${o.ref}`); }}>
                  <td>
                    <Link to={`/admin/orders/${o.ref}`} className="a-strong-link">{o.ref}</Link>
                    <div className="a-muted a-small">{o.source === 'website' ? 'Website' : 'Added by staff'} · {timeAgo(o.createdAt)}</div>
                  </td>
                  <td>{o.customerName || <span className="a-missing">Details needed</span>}<div className="a-muted a-small">{phone(o.customerPhone)}</div></td>
                  <td className="a-clip">{itemsSummary(o)}</td>
                  <td><DeliveryCell o={o} /></td>
                  <td>{o.payMethod === 'koko' ? 'KOKO' : 'Full'} · {o.paymentStatus === 'paid' ? <Badge tone="green">Paid</Badge> : <span className="a-muted">Unpaid</span>}</td>
                  <td className="num">{money(o.total)}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="a-cards">
          {orders.map((o) => (
            <li key={o.ref}>
              <Link to={`/admin/orders/${o.ref}`} className="a-order-card">
                <div className="a-row-top">
                  <strong>{o.customerName || <span className="a-missing">Customer details needed</span>}</strong>
                  <StatusBadge status={o.status} />
                </div>
                <div className="a-row-sub">{itemsSummary(o)}</div>
                <div className="a-order-card-foot">
                  <span><DeliveryCell o={o} /></span>
                  <strong>{money(o.total)}</strong>
                </div>
                <div className="a-row-meta">
                  {o.source === 'website' ? <Globe size={14} aria-hidden="true" /> : <Phone size={14} aria-hidden="true" />}
                  {o.ref} · {timeAgo(o.createdAt)}{o.paymentStatus === 'paid' && ' · Paid'}
                </div>
                <ChevronRight size={18} aria-hidden="true" className="a-row-chev" />
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

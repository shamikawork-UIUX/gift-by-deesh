import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing, CalendarClock, ChevronRight, ClipboardCheck, Inbox, PackagePlus, Plus, Truck } from 'lucide-react';
import type { Order, OrderStatus } from '../lib/api';
import { useCan, useSession } from '../lib/session';
import { useApi } from '../lib/useApi';
import { itemsSummary, money, phone, timeAgo } from '../lib/format';
import { Card, EmptyState, ErrorState, PageHeader, Skeleton, StatusBadge, btn } from '../ui/ui';
import { calendar } from '../../data/offers';

interface OverviewData {
  today: string;
  counts: Record<OrderStatus, number>;
  awaiting: Order[];
  dueToday: Order[];
  overdue: number;
  revenue: { last7: { s: number; n: number }; month: { s: number; n: number } } | null;
  reminderCounts: Record<string, number>;
}

const greeting = () => {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Colombo' }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/** Next date (from today) each calendar occasion happens, for "coming up" reminders. */
function upcomingOccasions() {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const now = new Date();
  return calendar.map((o) => {
    const m = months.indexOf(o.month);
    let d = new Date(now.getFullYear(), m, Number(o.day) || 1);
    if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(now.getFullYear() + 1, m, Number(o.day) || 1);
    return { ...o, date: d, days: Math.round((d.getTime() - now.getTime()) / 86_400_000) };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function OrderRow({ o }: { o: Order }) {
  return (
    <li>
      <Link to={`/admin/orders/${o.ref}`} className="a-row-link">
        <div className="a-row-main">
          <div className="a-row-top">
            <strong>{o.customerName || 'Customer details needed'}</strong>
            <StatusBadge status={o.status} />
          </div>
          <div className="a-row-sub">{itemsSummary(o)}</div>
          <div className="a-row-meta">{o.ref} · {o.customerPhone ? phone(o.customerPhone) : `sent ${timeAgo(o.createdAt)}`} · {money(o.total)}</div>
        </div>
        <ChevronRight size={18} aria-hidden="true" className="a-row-chev" />
      </Link>
    </li>
  );
}

export function Overview() {
  const can = useCan();
  const user = useSession((s) => s.user)!;
  const { data, error, loading, reload } = useApi<OverviewData>('/overview', { pollMs: 30_000 });

  return (
    <div className="a-page">
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        subtitle="Here's what needs you today."
        actions={can('orders.edit') && <Link to="/admin/orders/new" className={btn('primary')}><Plus size={18} aria-hidden="true" />New order</Link>}
      />

      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading && !data && <Skeleton rows={6} />}

      {data && (
        <>
          {/* What to do next, as big tappable tiles */}
          <div className="a-stats" role="list">
            <Link role="listitem" to="/admin/orders?status=new" className={`a-stat ${data.counts.new ? 'a-stat-hot' : ''}`}>
              <Inbox size={22} aria-hidden="true" />
              <span className="a-stat-n">{data.counts.new}</span>
              <span className="a-stat-l">{data.counts.new === 1 ? 'new order to confirm' : 'new orders to confirm'}</span>
            </Link>
            <Link role="listitem" to="/admin/orders?status=active" className="a-stat">
              <Truck size={22} aria-hidden="true" />
              <span className="a-stat-n">{data.dueToday.length}</span>
              <span className="a-stat-l">{data.dueToday.length === 1 ? 'delivery today' : 'deliveries today'}</span>
            </Link>
            <Link role="listitem" to="/admin/orders?status=active" className="a-stat">
              <ClipboardCheck size={22} aria-hidden="true" />
              <span className="a-stat-n">{data.counts.confirmed + data.counts.preparing}</span>
              <span className="a-stat-l">to prepare</span>
            </Link>
            {data.overdue > 0 && (
              <Link role="listitem" to="/admin/orders?status=active" className="a-stat a-stat-warn">
                <AlertTriangle size={22} aria-hidden="true" />
                <span className="a-stat-n">{data.overdue}</span>
                <span className="a-stat-l">past their delivery date</span>
              </Link>
            )}
          </div>

          <div className="a-grid-2">
            <Card title="Waiting for confirmation" id="ov-new" action={data.counts.new > 0 && <Link to="/admin/orders?status=new" className="a-link">See all {data.counts.new}</Link>}>
              {data.awaiting.length ? (
                <>
                  <p className="a-card-lede">Find each one in WhatsApp by its reference (e.g. <code>{data.awaiting[0].ref}</code>), add the customer's details, then confirm.</p>
                  <ul className="a-rows">{data.awaiting.map((o) => <OrderRow key={o.ref} o={o} />)}</ul>
                </>
              ) : (
                <EmptyState icon={Inbox} title="All caught up" text="New website orders appear here as soon as a customer taps “Send order on WhatsApp”." />
              )}
            </Card>

            <Card title="Deliveries today" id="ov-today">
              {data.dueToday.length ? (
                <ul className="a-rows">{data.dueToday.map((o) => <OrderRow key={o.ref} o={o} />)}</ul>
              ) : (
                <EmptyState icon={CalendarClock} title="Nothing to deliver today" />
              )}
            </Card>
          </div>

          <div className="a-grid-2">
            {data.revenue && (
              <Card title="Sales" id="ov-sales">
                <p className="a-card-lede">Confirmed, in-progress and delivered orders (cancelled ones don't count). Delivery fees included.</p>
                <dl className="a-kpis">
                  <div><dt>Last 7 days</dt><dd>{money(data.revenue.last7.s)}</dd><span>{data.revenue.last7.n} {data.revenue.last7.n === 1 ? 'order' : 'orders'}</span></div>
                  <div><dt>This month</dt><dd>{money(data.revenue.month.s)}</dd><span>{data.revenue.month.n} {data.revenue.month.n === 1 ? 'order' : 'orders'}</span></div>
                </dl>
              </Card>
            )}
            <Card title="Coming up" id="ov-cal" action={<Link to="/admin/reminders" className="a-link">Reminders</Link>}>
              <ul className="a-mini-list">
                {upcomingOccasions().slice(0, 3).map((o) => (
                  <li key={o.id}>
                    <BellRing size={18} aria-hidden="true" style={{ color: o.color }} />
                    <span><strong>{o.name}</strong> · {o.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} <span className="a-muted">({o.days} days)</span></span>
                    <span className="a-muted">{data.reminderCounts[o.id] ?? 0} to remind</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {can('products.edit') && (
            <div className="a-quick">
              <Link to="/admin/products/new" className={btn('secondary')}><PackagePlus size={18} aria-hidden="true" />Add a product</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

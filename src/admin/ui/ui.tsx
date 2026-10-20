import { useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, Loader2, Search, X, type LucideIcon } from 'lucide-react';
import type { OrderStatus } from '../lib/api';
import { statusInfo } from '../lib/format';
import { useExit, useFocusTrap } from '../../hooks/useDialog';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp';

export const btn = (variant: Variant = 'secondary', size: 'md' | 'sm' = 'md', block = false) =>
  `a-btn a-btn-${variant}${size === 'sm' ? ' a-btn-sm' : ''}${block ? ' a-btn-block' : ''}`;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: LucideIcon;
  loading?: boolean;
  block?: boolean;
}

export function Button({ variant = 'secondary', size = 'md', icon: Icon, loading, block, children, disabled, className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={`${btn(variant, size, block)} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Loader2 className="a-spin" size={18} aria-hidden="true" /> : Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, ...rest }: { icon: LucideIcon; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="a-icon-btn" aria-label={label} title={label} {...rest}>
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}

// ---------- badges ----------

export function Badge({ tone = 'grey', children }: { tone?: string; children: ReactNode }) {
  return <span className={`a-badge a-tone-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = statusInfo[status];
  return <span className={`a-badge a-tone-${s.tone}`}><span className="a-dot" aria-hidden="true" />{s.label}</span>;
}

// ---------- layout ----------

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: ReactNode; actions?: ReactNode; back?: string }) {
  const navigate = useNavigate();
  return (
    <header className="a-page-head">
      {back && (
        <button className="a-back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(back))} aria-label="Back">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}
      <div className="a-page-titles">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="a-page-actions">{actions}</div>}
    </header>
  );
}

export function Card({ title, action, children, className = '', id }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section className={`a-card ${className}`} aria-labelledby={title && id ? `${id}-t` : undefined}>
      {(title || action) && (
        <div className="a-card-head">
          {title && <h2 id={id ? `${id}-t` : undefined}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="a-empty">
      <span className="a-empty-ic"><Icon size={28} aria-hidden="true" /></span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="a-error-box" role="alert">
      <AlertTriangle size={20} aria-hidden="true" />
      <div>
        <strong>Couldn't load this</strong>
        <p>{message}</p>
      </div>
      {onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="a-skel" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="a-skel-row" />)}
    </div>
  );
}

export function Notice({ tone = 'info', children, title }: { tone?: 'info' | 'warn' | 'ok'; title?: string; children: ReactNode }) {
  return (
    <div className={`a-notice a-notice-${tone}`}>
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </div>
  );
}

// ---------- form controls ----------

export function Field({ label, hint, error, children, htmlFor, optional }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; htmlFor: string; optional?: boolean }) {
  return (
    <div className={`a-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}{optional && <span className="a-optional"> (optional)</span>}</label>
      {children}
      {error ? <p className="a-field-error" id={`${htmlFor}-err`} role="alert">{error}</p> : hint && <p className="a-hint" id={`${htmlFor}-hint`}>{hint}</p>}
    </div>
  );
}

/** aria-describedby for a control inside <Field>. */
export const describedBy = (id: string, error?: string, hint?: unknown) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="a-toggle-row">
      <div>
        <label htmlFor={id} className="a-toggle-label">{label}</label>
        {description && <p className="a-hint" id={`${id}-d`}>{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        className={`a-switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="a-switch-knob" aria-hidden="true">{checked && <Check size={12} strokeWidth={3} />}</span>
      </button>
    </div>
  );
}

export function ChipGroup<T extends string>({ label, options, value, onChange, multiple = false, error, disabled }: {
  label: string; options: { id: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; multiple?: boolean; error?: string; disabled?: boolean;
}) {
  const id = useId();
  return (
    <fieldset className={`a-field a-fieldset ${error ? 'has-error' : ''}`} aria-describedby={error ? `${id}-err` : undefined}>
      <legend>{label}</legend>
      <div className="a-chips">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className={`a-chip ${on ? 'on' : ''}`}
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onChange(multiple ? (on ? value.filter((v) => v !== o.id) : [...value, o.id]) : [o.id])}
            >
              {on && <Check size={14} strokeWidth={3} aria-hidden="true" />}{o.label}
            </button>
          );
        })}
      </div>
      {error && <p className="a-field-error" id={`${id}-err`} role="alert">{error}</p>}
    </fieldset>
  );
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="a-search" role="search">
      <Search size={18} aria-hidden="true" />
      <input ref={ref} type="search" aria-label={label} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" className="a-search-x" aria-label="Clear search" onClick={() => { onChange(''); ref.current?.focus(); }}>
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Filter pills (status tabs etc.). A row of toggle buttons, scrollable on phones. */
export function FilterPills<T extends string>({ label, items, value, onChange }: { label: string; items: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="a-pills" role="group" aria-label={label}>
      {items.map((it) => (
        <button key={it.id} type="button" className={`a-pill ${value === it.id ? 'on' : ''}`} aria-pressed={value === it.id} onClick={() => onChange(it.id)}>
          {it.label}
          {it.count !== undefined && <span className="a-pill-n">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- dialogs ----------

export function Modal({ title, onClose, children, footer, size = 'md' }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [closing, requestClose] = useExit(onClose, 200);
  useFocusTrap(ref, requestClose);
  const id = useId();
  return (
    <div className={`a-modal-layer ${closing ? 'closing' : ''}`}>
      <button className="a-modal-back" aria-label="Close" tabIndex={-1} onClick={requestClose} />
      <div ref={ref} className={`a-modal a-modal-${size}`} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="a-modal-head">
          <h2 id={id}>{title}</h2>
          <IconButton icon={X} label="Close" onClick={requestClose} />
        </div>
        <div className="a-modal-body">{children}</div>
        {footer && <div className="a-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, children, confirmLabel, tone = 'danger', onConfirm, onClose, busy }: {
  title: string; children: ReactNode; confirmLabel: string; tone?: 'danger' | 'primary'; onConfirm: () => void; onClose: () => void; busy?: boolean;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} data-autofocus>Keep it</Button>
          <Button variant={tone} onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="a-link">{children}</Link>;
}

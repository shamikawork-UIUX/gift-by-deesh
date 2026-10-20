import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { api, type User } from '../lib/api';
import { useSession } from '../lib/session';
import { Button, Field, Notice, describedBy } from '../ui/ui';
import { LogoMark } from '../../components/Logo';

function AuthCard({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  useEffect(() => { document.title = `${title} · GiftsByDeesh Admin`; }, [title]);
  return (
    <main className="a-auth">
      <div className="a-auth-card">
        <div className="a-auth-brand"><LogoMark /><span><strong>GiftsByDeesh</strong><small>Admin</small></span></div>
        <h1>{title}</h1>
        <p className="a-auth-lede">{lede}</p>
        {children}
      </div>
      <a href="/" className="a-auth-back">← Back to the website</a>
    </main>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, error, hint, autoFocus }: {
  id: string; value: string; onChange: (v: string) => void; autoComplete: string; error?: string; hint?: string; autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="a-pw">
      <input
        id={id}
        className="a-input"
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        autoFocus={autoFocus}
        required
      />
      <button type="button" className="a-pw-eye" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow((s) => !s)}>
        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}

const PW_HINT = 'At least 10 characters. A short sentence is easy to remember, e.g. “pink bows on friday”.';

// ---------------------------------------------------------------------------

export function Login() {
  const setUser = useSession((s) => s.setUser);
  const notice = useSession((s) => s.notice);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setBusy(true);
    setError('');
    try {
      const r = await api<{ user: User }>('/login', { method: 'POST', body: { email, password } });
      setUser(r.user);
    } catch (err) {
      setError((err as Error).message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Sign in" lede="Manage orders, products and the shop.">
      {notice && <Notice tone="info">{notice}</Notice>}
      <form onSubmit={submit} noValidate className="a-form">
        <Field label="Email" htmlFor="li-email">
          <input ref={emailRef} id="li-email" className="a-input" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        </Field>
        <Field label="Password" htmlFor="li-pw">
          <PasswordInput id="li-pw" value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
        {error && <p className="a-form-error" role="alert">{error}</p>}
        <Button type="submit" variant="primary" block loading={busy} icon={LockKeyhole}>Sign in</Button>
        <p className="a-hint a-center">Forgot your password? Ask the shop owner to reset it from <em>Team &amp; roles</em>.</p>
      </form>
    </AuthCard>
  );
}

// ---------------------------------------------------------------------------

export function Setup() {
  const setUser = useSession((s) => s.setUser);
  const needsCode = useSession((s) => s.setupNeedsCode);
  const [f, setF] = useState({ name: '', email: '', password: '', setupCode: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api<{ user: User }>('/setup', { method: 'POST', body: f });
      setUser(r.user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Set up the dashboard" lede="Create the owner account. You can add the rest of the team afterwards.">
      <form onSubmit={submit} noValidate className="a-form">
        <Field label="Your name" htmlFor="su-name">
          <input id="su-name" className="a-input" autoComplete="name" value={f.name} onChange={(e) => set('name')(e.target.value)} autoFocus required />
        </Field>
        <Field label="Email" htmlFor="su-email" hint="You'll use this to sign in.">
          <input id="su-email" className="a-input" type="email" autoComplete="username" value={f.email} onChange={(e) => set('email')(e.target.value)} aria-describedby="su-email-hint" required />
        </Field>
        <Field label="Password" htmlFor="su-pw" hint={PW_HINT}>
          <PasswordInput id="su-pw" value={f.password} onChange={set('password')} autoComplete="new-password" hint={PW_HINT} />
        </Field>
        {needsCode && (
          <Field label="Setup code" htmlFor="su-code" hint="Set as SETUP_CODE on the server. Ask whoever installed the website.">
            <input id="su-code" className="a-input" value={f.setupCode} onChange={(e) => set('setupCode')(e.target.value)} aria-describedby="su-code-hint" autoComplete="off" />
          </Field>
        )}
        {error && <p className="a-form-error" role="alert">{error}</p>}
        <Button type="submit" variant="primary" block loading={busy}>Create owner account</Button>
      </form>
    </AuthCard>
  );
}

// ---------------------------------------------------------------------------

/** Shown after signing in with a temporary password (new team member, or after a reset). */
export function ForcePassword() {
  const user = useSession((s) => s.user)!;
  const setUser = useSession((s) => s.setUser);
  const signOut = useSession((s) => s.signOut);
  return (
    <AuthCard title={`Welcome, ${user.name.split(' ')[0]}`} lede="You signed in with a temporary password. Choose your own to continue.">
      <ChangePasswordForm currentLabel="Temporary password" onDone={setUser} />
      <button className="a-link a-center-block" onClick={() => void signOut()}>Sign out</button>
    </AuthCard>
  );
}

export function ChangePasswordForm({ currentLabel = 'Current password', onDone }: { currentLabel?: string; onDone: (u: User) => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [errors, setErrors] = useState<{ again?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== again) { setErrors({ again: "The two new passwords don't match." }); return; }
    setBusy(true);
    setErrors({});
    try {
      const r = await api<{ user: User }>('/account/password', { method: 'POST', body: { current, next } });
      setCurrent(''); setNext(''); setAgain('');
      onDone(r.user);
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="a-form">
      <Field label={currentLabel} htmlFor="cp-cur">
        <PasswordInput id="cp-cur" value={current} onChange={setCurrent} autoComplete="current-password" />
      </Field>
      <Field label="New password" htmlFor="cp-new" hint={PW_HINT}>
        <PasswordInput id="cp-new" value={next} onChange={setNext} autoComplete="new-password" hint={PW_HINT} />
      </Field>
      <Field label="New password again" htmlFor="cp-again" error={errors.again}>
        <PasswordInput id="cp-again" value={again} onChange={setAgain} autoComplete="new-password" error={errors.again} />
      </Field>
      {errors.form && <p className="a-form-error" role="alert">{errors.form}</p>}
      <Button type="submit" variant="primary" block loading={busy}>Save new password</Button>
      <p className="a-hint">Changing your password signs you out on your other devices.</p>
    </form>
  );
}

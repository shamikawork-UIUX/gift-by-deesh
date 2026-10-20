import { useState, type FormEvent } from 'react';
import { Check, Copy, KeyRound, UserPlus } from 'lucide-react';
import { api, type Role, type User } from '../lib/api';
import { roleInfo, useSession } from '../lib/session';
import { useApi } from '../lib/useApi';
import { timeAgo } from '../lib/format';
import { Badge, Button, Card, ConfirmDialog, ErrorState, Field, Modal, Notice, PageHeader, Skeleton, Toggle, describedBy } from '../ui/ui';
import { toast } from '../ui/toast';

const ROLES: Role[] = ['owner', 'manager', 'staff'];
const roleTone: Record<Role, string> = { owner: 'ink', manager: 'blue', staff: 'grey' };

function RolePicker({ value, onChange, name }: { value: Role; onChange: (r: Role) => void; name: string }) {
  return (
    <fieldset className="a-field a-fieldset">
      <legend>Role</legend>
      <div className="a-role-options">
        {ROLES.map((r) => (
          <label key={r} className={`a-role-option ${value === r ? 'on' : ''}`}>
            <input type="radio" name={name} value={r} checked={value === r} onChange={() => onChange(r)} />
            <span><strong>{roleInfo[r].label}</strong><span className="a-hint">{roleInfo[r].desc}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TempPassword({ name, email, password, onClose }: { name: string; email: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `Hi ${name.split(' ')[0]}! Here's your GiftsByDeesh dashboard sign-in:\n${window.location.origin}/admin\nEmail: ${email}\nTemporary password: ${password}\nYou'll choose your own password when you sign in.`;
  return (
    <Modal title="Share these sign-in details" onClose={onClose} footer={<Button variant="primary" onClick={onClose} data-autofocus>Done</Button>}>
      <Notice tone="warn">This password is shown <strong>only once</strong>. Send it privately (e.g. a direct WhatsApp message), not in a group.</Notice>
      <dl className="a-dl a-temp">
        <div><dt>Email</dt><dd>{email}</dd></div>
        <div><dt>Temporary password</dt><dd><code className="a-code-big">{password}</code></dd></div>
      </dl>
      <Button icon={copied ? Check : Copy} onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { toast.error("Couldn't copy. Select the text instead."); } }}>
        {copied ? 'Copied' : 'Copy message to send'}
      </Button>
      <p className="a-hint">{name.split(' ')[0]} will be asked to choose their own password the first time they sign in.</p>
    </Modal>
  );
}

function AddMember({ onClose, onAdded }: { onClose: () => void; onAdded: (u: User, pw: string) => void }) {
  const [f, setF] = useState({ name: '', email: '', role: 'staff' as Role });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api<{ user: User; tempPassword: string }>('/users', { method: 'POST', body: f });
      onAdded(r.user, r.tempPassword);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  return (
    <Modal title="Add a team member" onClose={onClose} size="lg">
      <form onSubmit={submit} className="a-form" noValidate>
        <div className="a-form-2">
          <Field label="Name" htmlFor="tm-name"><input id="tm-name" className="a-input" value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} data-autofocus /></Field>
          <Field label="Email" htmlFor="tm-email" hint="They sign in with this."><input id="tm-email" className="a-input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-describedby={describedBy('tm-email', undefined, true)} /></Field>
        </div>
        <RolePicker value={f.role} onChange={(role) => setF({ ...f, role })} name="tm-role" />
        {error && <p className="a-form-error" role="alert">{error}</p>}
        <div className="a-form-buttons">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy} icon={UserPlus}>Add and get password</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditMember({ user, me, onClose, onSaved, onReset }: { user: User; me: User; onClose: () => void; onSaved: (u: User) => void; onReset: (pw: string) => void }) {
  const [role, setRole] = useState<Role>(user.role);
  const [active, setActive] = useState(user.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const self = user.id === me.id;

  const save = async () => {
    setBusy(true); setError('');
    try {
      const r = await api<{ user: User }>(`/users/${user.id}`, { method: 'PATCH', body: { role, active } });
      onSaved(r.user);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const reset = async () => {
    setBusy(true);
    try {
      const r = await api<{ tempPassword: string }>(`/users/${user.id}/reset-password`, { method: 'POST' });
      onReset(r.tempPassword);
    } catch (e) { setError((e as Error).message); setConfirmReset(false); } finally { setBusy(false); }
  };

  if (confirmReset) {
    return (
      <ConfirmDialog title={`Reset ${user.name}'s password?`} tone="primary" confirmLabel="Reset password" busy={busy} onClose={() => setConfirmReset(false)} onConfirm={() => void reset()}>
        <p>They'll be signed out everywhere and get a new temporary password from you.</p>
      </ConfirmDialog>
    );
  }

  return (
    <Modal title={user.name} onClose={onClose} size="lg"
      footer={!self && <><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => void save()} disabled={role === user.role && active === user.active}>Save</Button></>}>
      <p className="a-muted">{user.email}</p>
      {self ? (
        <Notice>This is you. To keep at least one owner in charge, you can't change your own role or switch off your own account. Change your password in <em>My account</em>.</Notice>
      ) : (
        <>
          <RolePicker value={role} onChange={setRole} name="em-role" />
          <Toggle label="Can sign in" description={active ? 'Account is on.' : 'Switched off: they are signed out and can’t sign in. Their history stays.'} checked={active} onChange={setActive} />
          <div className="a-divider" />
          <Button icon={KeyRound} onClick={() => setConfirmReset(true)}>Reset password</Button>
          <p className="a-hint">Use this if they forgot their password.</p>
        </>
      )}
      {error && <p className="a-form-error" role="alert">{error}</p>}
    </Modal>
  );
}

export function Team() {
  const me = useSession((s) => s.user)!;
  const { data, setData, error, loading, reload } = useApi<{ users: User[] }>('/users');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [temp, setTemp] = useState<{ name: string; email: string; password: string } | null>(null);
  const users = data?.users ?? [];

  return (
    <div className="a-page">
      <PageHeader title="Team & roles" subtitle="Who can sign in, and what each person can do."
        actions={<Button variant="primary" icon={UserPlus} onClick={() => setAdding(true)}>Add member</Button>} />

      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading && !data && <Skeleton rows={4} />}

      {users.length > 0 && (
        <ul className="a-cards">
          {users.map((u) => (
            <li key={u.id}>
              <button className={`a-person a-person-btn ${u.active ? '' : 'is-off'}`} onClick={() => setEditing(u)} aria-label={`Manage ${u.name}`}>
                <span className="a-avatar" aria-hidden="true">{u.name.slice(0, 1).toUpperCase()}</span>
                <span className="a-person-text">
                  <span className="a-row-top"><strong>{u.name}{u.id === me.id && ' (you)'}</strong><Badge tone={roleTone[u.role]}>{roleInfo[u.role].label}</Badge></span>
                  <span className="a-row-sub">{u.email}</span>
                  <span className="a-row-meta">
                    {!u.active ? 'Switched off' : u.mustChangePassword ? 'Hasn’t signed in yet' : u.lastLoginAt ? `Last signed in ${timeAgo(u.lastLoginAt)}` : 'Never signed in'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Card title="What each role can do" id="tm-roles">
        <div className="a-table-wrap">
          <table className="a-table a-role-table">
            <thead><tr><th scope="col">Task</th>{ROLES.map((r) => <th key={r} scope="col">{roleInfo[r].label}</th>)}</tr></thead>
            <tbody>
              {[
                ['See and update orders, message customers', true, true, true],
                ['Add orders by hand', true, true, true],
                ['Cancel or reopen orders', true, true, false],
                ['See sales totals and export orders', true, true, false],
                ['Add and edit products, prices and photos', true, true, false],
                ['Remove or export reminder sign-ups', true, true, false],
                ['Change shop settings (hours, delivery, coupon)', true, true, false],
                ['See the activity log', true, true, false],
                ['Add team members and change roles', true, false, false],
              ].map(([task, ...yes]) => (
                <tr key={task as string}>
                  <th scope="row">{task}</th>
                  {(yes as boolean[]).map((y, i) => <td key={i} className="a-center">{y ? <><Check size={18} aria-hidden="true" className="a-yes" /><span className="sr-only">Yes</span></> : <span className="a-muted" aria-label="No">—</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {adding && <AddMember onClose={() => setAdding(false)} onAdded={(u, pw) => {
        setAdding(false);
        setData((d) => d && { users: [...d.users, u] });
        setTemp({ name: u.name, email: u.email, password: pw });
        toast.ok(`${u.name} added as ${roleInfo[u.role].label.toLowerCase()}`);
      }} />}
      {editing && <EditMember user={editing} me={me} onClose={() => setEditing(null)}
        onSaved={(u) => { setEditing(null); setData((d) => d && { users: d.users.map((x) => (x.id === u.id ? u : x)) }); toast.ok(`${u.name} updated`); }}
        onReset={(pw) => { const u = editing; setEditing(null); setTemp({ name: u.name, email: u.email, password: pw }); void reload(true); }} />}
      {temp && <TempPassword {...temp} onClose={() => setTemp(null)} />}
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { LogOut } from 'lucide-react';
import { api, type User } from '../lib/api';
import { roleInfo, useSession } from '../lib/session';
import { Badge, Button, Card, Field, PageHeader } from '../ui/ui';
import { toast } from '../ui/toast';
import { ChangePasswordForm } from './Auth';

export function Account() {
  const user = useSession((s) => s.user)!;
  const setUser = useSession((s) => s.setUser);
  const signOut = useSession((s) => s.signOut);
  const [name, setName] = useState(user.name);
  const [busy, setBusy] = useState(false);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ user: User }>('/account', { method: 'PATCH', body: { name } });
      setUser(r.user);
      toast.ok('Name saved');
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="a-page a-page-task-desktop">
      <PageHeader title="My account" subtitle={<>{user.email} · <Badge tone="ink">{roleInfo[user.role].label}</Badge></>} />
      <div className="a-grid-2">
        <Card title="Your name" id="ac-name">
          <form onSubmit={saveName} className="a-form">
            <Field label="Name" htmlFor="ac-n" hint="Shown to the team in order history and the activity log.">
              <input id="ac-n" className="a-input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-describedby="ac-n-hint" />
            </Field>
            <div className="a-form-buttons"><Button type="submit" variant="primary" loading={busy} disabled={!name.trim() || name === user.name}>Save name</Button></div>
          </form>
        </Card>
        <Card title="Your role" id="ac-role">
          <p><strong>{roleInfo[user.role].label}.</strong> {roleInfo[user.role].desc}</p>
          <p className="a-hint">Only the owner can change roles.</p>
        </Card>
      </div>
      <Card title="Change password" id="ac-pw">
        <div className="a-narrow"><ChangePasswordForm onDone={(u) => { setUser(u); toast.ok('Password changed'); }} /></div>
      </Card>
      <Button icon={LogOut} onClick={() => void signOut()}>Sign out</Button>
    </div>
  );
}

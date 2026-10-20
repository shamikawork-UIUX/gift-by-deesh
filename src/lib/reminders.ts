// Reminder sign-ups live here so the backend can be swapped (e.g. for Mailchimp / Brevo) in one place.
// Today: saved to our own database through server/index.mjs (POST /api/reminders).

export type ReminderChannel = 'email' | 'whatsapp';

export interface ReminderRequest {
  channel: ReminderChannel;
  /** Email address, or the 9 digits after +94 */
  contact: string;
  /** Occasion ids from `calendar` in src/data/offers.ts */
  occasions: string[];
}

/** What this device remembers, so "Reminder set" survives a reload and can be cancelled. */
export interface SavedReminders {
  channel: ReminderChannel;
  contact: string;
  occasions: string[];
}

const KEY = 'gbd-reminders';

export function loadSaved(): SavedReminders | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedReminders) : null;
  } catch {
    return null;
  }
}

function store(s: SavedReminders) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: UI still works for this visit */ }
}

async function post(path: string, body: ReminderRequest): Promise<string[]> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error("We couldn't reach our server. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { occasions?: string[]; error?: string };
  if (!res.ok) throw new Error(data.error || "We couldn't save that just now. Please try again.");
  return data.occasions ?? body.occasions;
}

/** Saves the sign-up and returns every occasion this contact is now signed up for. */
export async function saveReminder(req: ReminderRequest): Promise<string[]> {
  const occasions = await post('/api/reminders', req);
  store({ channel: req.channel, contact: req.contact, occasions });
  return occasions;
}

export async function cancelReminder(saved: SavedReminders, occasion: string): Promise<string[]> {
  const occasions = await post('/api/reminders/cancel', { channel: saved.channel, contact: saved.contact, occasions: [occasion] });
  store({ ...saved, occasions });
  return occasions;
}

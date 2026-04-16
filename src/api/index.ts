import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.ts';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not set in environment variables.');
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production';

// --- AUTH MIDDLEWARE ---
const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requirePersonAuth = (req: any, res: any, next: any) => {
  const personToken = req.cookies.person_token;
  const adminToken = req.cookies.admin_token;

  if (personToken) {
    try {
      const decoded = jwt.verify(personToken, JWT_SECRET) as { id: number; name: string; type: string };
      if (decoded.type !== 'person') throw new Error('Not a person token');
      req.person = decoded;
      return next();
    } catch (err) {
      // fall through
    }
  }

  if (adminToken) {
    try {
      const decoded = jwt.verify(adminToken, JWT_SECRET) as { id: number; username: string };
      const admin = db.prepare('SELECT person_id FROM admin_users WHERE id = ?').get(decoded.id) as { person_id: number } | undefined;
      if (admin?.person_id) {
        req.person = { id: admin.person_id, name: decoded.username, type: 'person' };
        return next();
      }
    } catch (err) {
      // fall through
    }
  }

  res.status(401).json({ error: 'Unauthorized' });
};

// --- RATE LIMITING ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window`
  message: { error: 'Zu viele Login-Versuche. Bitte in 15 Minuten erneut versuchen.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false
});

// --- SCHEMAS ---
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const eventSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  date: z.string().min(1, 'Datum ist erforderlich'),
  location: z.string().min(1, 'Ort ist erforderlich'),
  meeting_point: z.string().optional().nullable(),
  response_deadline: z.string().optional().nullable()
});

const personSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  username: z.string().optional().nullable(),
  email: z.string().email('Ungültige E-Mail Adresse').optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable()
});

const inviteSchema = z.object({
  person_id: z.number()
});

const bulkInviteSchema = z.object({
  person_ids: z.array(z.number())
});

const respondSchema = z.object({
  status: z.enum(['yes', 'no', 'maybe']),
  comment: z.string().optional().nullable(),
  guests_count: z.number().min(0).max(10).optional().default(0)
});

const settingsSchema = z.object({
  username: z.string().min(1, 'Benutzername ist erforderlich'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional()
});

const setupProfileSchema = z.object({
  username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen lang sein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
});

const registrationRequestSchema = z.object({
  name: z.string().min(2, 'Name ist zu kurz'),
  email: z.string().email('Ungültige E-Mail Adresse').optional().or(z.literal(''))
});

const registerWithCodeSchema = z.object({
  code: z.string().min(1, 'Code ist erforderlich'),
  username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen lang sein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
});

// --- AUTH ROUTES ---
const authRouter = Router();
authRouter.post('/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('admin_token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: isProd ? 'lax' : 'none' 
    });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Ungültige Eingabedaten' });
  }
});
authRouter.post('/logout', (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: true,
    sameSite: isProd ? 'lax' : 'none'
  });
  res.json({ success: true });
});
authRouter.get('/check', requireAuth, (req: any, res) => {
  res.json({ user: req.admin });
});
apiRouter.use('/auth', authRouter);

// --- ADMIN ROUTES ---
const adminRouter = Router();
adminRouter.use(requireAuth);

// Events
adminRouter.get('/events', (req, res) => {
  const events = db.prepare(`
    SELECT 
      e.*,
      COUNT(i.id) as total_invites,
      COUNT(CASE WHEN i.status = 'yes' THEN 1 END) as yes_count
    FROM events e
    LEFT JOIN invitees i ON e.id = i.event_id
    GROUP BY e.id
    ORDER BY e.date ASC
  `).all();
  res.json(events);
});
adminRouter.post('/events', (req, res) => {
  try {
    const { title, description, date, location, meeting_point, response_deadline } = eventSchema.parse(req.body);
    
    const eventDate = new Date(date);
    const now = new Date();
    
    if (eventDate < now) {
      return res.status(400).json({ error: 'Das Event-Datum darf nicht in der Vergangenheit liegen' });
    }
    
    if (response_deadline) {
      const deadlineDate = new Date(response_deadline);
      if (deadlineDate < now) {
        return res.status(400).json({ error: 'Die Antwortfrist darf nicht in der Vergangenheit liegen' });
      }
      if (deadlineDate > eventDate) {
        return res.status(400).json({ error: 'Die Antwortfrist darf nicht nach dem Event-Datum liegen' });
      }
    }

    const stmt = db.prepare('INSERT INTO events (title, description, date, location, meeting_point, response_deadline) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(title, description || null, date, location, meeting_point || null, response_deadline || null);
    res.json({ id: info.lastInsertRowid });
  } catch (e: any) {
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});
adminRouter.get('/events/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});
adminRouter.put('/events/:id', (req, res) => {
  try {
    const { title, description, date, location, meeting_point, response_deadline } = eventSchema.parse(req.body);
    const stmt = db.prepare('UPDATE events SET title = ?, description = ?, date = ?, location = ?, meeting_point = ?, response_deadline = ? WHERE id = ?');
    stmt.run(title, description || null, date, location, meeting_point || null, response_deadline || null, req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});
adminRouter.delete('/events/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Event Invites
adminRouter.get('/events/:id/invites', (req, res) => {
  const invites = db.prepare(`
    SELECT i.*, p.name as current_name 
    FROM invitees i 
    LEFT JOIN persons p ON i.person_id = p.id 
    WHERE i.event_id = ?
  `).all(req.params.id);
  res.json(invites);
});

// Invitation Steps
adminRouter.get('/events/:id/invitation-steps', (req, res) => {
  const steps = db.prepare('SELECT * FROM event_invitation_steps WHERE event_id = ? ORDER BY scheduled_at ASC').all(req.params.id);
  res.json(steps);
});

adminRouter.post('/events/:id/invitation-steps', (req, res) => {
  try {
    const { name, message, scheduled_at } = req.body;
    const stmt = db.prepare('INSERT INTO event_invitation_steps (event_id, name, message, scheduled_at) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.params.id, name, message, scheduled_at || null);
    res.json({ id: info.lastInsertRowid });
  } catch (e: any) {
    res.status(400).json({ error: 'Fehler beim Erstellen des Einladungsschritts' });
  }
});

adminRouter.put('/events/:id/invitation-steps/:stepId', (req, res) => {
  try {
    const { name, message, scheduled_at } = req.body;
    const stmt = db.prepare('UPDATE event_invitation_steps SET name = ?, message = ?, scheduled_at = ? WHERE id = ? AND event_id = ?');
    stmt.run(name, message, scheduled_at || null, req.params.stepId, req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: 'Fehler beim Aktualisieren des Einladungsschritts' });
  }
});

adminRouter.delete('/events/:id/invitation-steps/:stepId', (req, res) => {
  db.prepare('DELETE FROM event_invitation_steps WHERE id = ? AND event_id = ?').run(req.params.stepId, req.params.id);
  res.json({ success: true });
});

adminRouter.post('/events/:id/invitation-steps/:stepId/trigger', (req, res) => {
  try {
    const step = db.prepare('SELECT * FROM event_invitation_steps WHERE id = ? AND event_id = ?').get(req.params.stepId, req.params.id) as any;
    if (!step) return res.status(404).json({ error: 'Schritt nicht gefunden' });

    // Logic to send invitations to all invitees of this event
    const invitees = db.prepare('SELECT p.id, p.password_hash FROM invitees i JOIN persons p ON i.person_id = p.id WHERE i.event_id = ?').all(req.params.id) as any[];
    const event = db.prepare('SELECT title FROM events WHERE id = ?').get(req.params.id) as any;

    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_type, user_id, title, message, link)
      VALUES ('person', ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const invitee of invitees) {
        if (invitee.password_hash) {
          insertNotif.run(invitee.id, step.name, step.message, `/events/${req.params.id}`);
        }
      }
      db.prepare('UPDATE event_invitation_steps SET sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.stepId);
    })();

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: 'Fehler beim Auslösen des Einladungsschritts' });
  }
});

adminRouter.put('/events/:id/archive', (req, res) => {
  db.prepare('UPDATE events SET is_archived = ? WHERE id = ?').run(req.body.is_archived ? 1 : 0, req.params.id);
  res.json({ success: true });
});

adminRouter.post('/events/:id/invites', (req, res) => {
  try {
    const { person_id } = inviteSchema.parse(req.body);
    const person = db.prepare('SELECT name, password_hash FROM persons WHERE id = ?').get(person_id) as any;
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const token = crypto.randomBytes(16).toString('hex');
    const stmt = db.prepare('INSERT INTO invitees (event_id, person_id, name_snapshot, token) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.params.id, person_id, person.name, token);

    // Create notification for person ONLY if they have a profile
    if (person.password_hash) {
      const event = db.prepare('SELECT title FROM events WHERE id = ?').get(req.params.id) as any;
      db.prepare(`
        INSERT INTO notifications (user_type, user_id, title, message, link)
        VALUES ('person', ?, ?, ?, ?)
      `).run(person_id, 'Neue Einladung', `Du wurdest zu "${event.title}" eingeladen.`, `/invite/${token}`);
    }

    res.json({ id: info.lastInsertRowid, token, has_profile: !!person.password_hash });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Person ist bereits eingeladen' });
    }
    res.status(400).json({ error: 'Ungültige Eingabedaten' });
  }
});
adminRouter.post('/events/:id/invites/bulk', (req, res) => {
  try {
    const { person_ids } = bulkInviteSchema.parse(req.body);
    const eventId = req.params.id;

    const insert = db.prepare('INSERT INTO invitees (event_id, person_id, name_snapshot, token) VALUES (?, ?, ?, ?)');
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_type, user_id, title, message, link)
      VALUES ('person', ?, ?, ?, ?)
    `);
    let addedCount = 0;
    const noProfileNames: string[] = [];

    const event = db.prepare('SELECT title FROM events WHERE id = ?').get(eventId) as any;

    db.transaction(() => {
      for (const person_id of person_ids) {
        const existing = db.prepare('SELECT 1 FROM invitees WHERE event_id = ? AND person_id = ?').get(eventId, person_id);
        if (!existing) {
          const person = db.prepare('SELECT name, password_hash FROM persons WHERE id = ?').get(person_id) as any;
          if (person) {
            const token = crypto.randomBytes(16).toString('hex');
            insert.run(eventId, person_id, person.name, token);
            if (person.password_hash) {
              insertNotif.run(person_id, 'Neue Einladung', `Du wurdest zu "${event.title}" eingeladen.`, `/invite/${token}`);
            } else {
              noProfileNames.push(person.name);
            }
            addedCount++;
          }
        }
      }
    })();

    res.json({ success: true, count: addedCount, no_profile_names: noProfileNames });
  } catch (e: any) {
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});

adminRouter.post('/events/:id/invites/:inviteId/resend', (req, res) => {
  try {
    const invitee = db.prepare(`
      SELECT i.*, e.title, p.password_hash
      FROM invitees i 
      JOIN events e ON i.event_id = e.id 
      JOIN persons p ON i.person_id = p.id
      WHERE i.id = ? AND i.event_id = ?
    `).get(req.params.inviteId, req.params.id) as any;

    if (!invitee) return res.status(404).json({ error: 'Einladung nicht gefunden' });

    if (!invitee.password_hash) {
      return res.status(400).json({ error: 'Person hat noch kein Profil. Bitte Link kopieren und persönlich senden.' });
    }

    db.prepare(`
      INSERT INTO notifications (user_type, user_id, title, message, link)
      VALUES ('person', ?, ?, ?, ?)
    `).run(invitee.person_id, 'Erinnerung: Einladung', `Du bist noch zu "${invitee.title}" eingeladen.`, `/invite/${invitee.token}`);

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: 'Fehler beim erneuten Senden' });
  }
});

adminRouter.delete('/events/:id/invites/:inviteId', (req, res) => {
  db.prepare('DELETE FROM invitees WHERE id = ? AND event_id = ?').run(req.params.inviteId, req.params.id);
  res.json({ success: true });
});

adminRouter.put('/events/:id/invites/:inviteId/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['yes', 'no', 'maybe', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Ungültiger Status' });
    }
    db.prepare('UPDATE invitees SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ? AND event_id = ?').run(status, req.params.inviteId, req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: 'Fehler beim Aktualisieren des Status' });
  }
});

// Persons
adminRouter.get('/persons', (req, res) => {
  const persons = db.prepare('SELECT id, name, username, email, notes, created_at FROM persons ORDER BY name ASC').all();
  res.json(persons);
});
adminRouter.post('/persons', (req, res) => {
  try {
    const { name, username, email, notes } = personSchema.parse(req.body);
    const stmt = db.prepare('INSERT INTO persons (name, username, email, notes) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, username || null, email || null, notes || null);
    res.json({ id: info.lastInsertRowid });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Benutzername oder E-Mail bereits vergeben' });
    }
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});
adminRouter.put('/persons/:id', (req, res) => {
  try {
    const { name, username, email, notes } = personSchema.parse(req.body);
    const stmt = db.prepare('UPDATE persons SET name = ?, username = ?, email = ?, notes = ? WHERE id = ?');
    stmt.run(name, username || null, email || null, notes || null, req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Benutzername oder E-Mail bereits vergeben' });
    }
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});
adminRouter.delete('/persons/:id', (req, res) => {
  db.prepare('DELETE FROM persons WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Stats
adminRouter.get('/stats', (req, res) => {
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get() as any;
  const totalPersons = db.prepare('SELECT COUNT(*) as count FROM persons').get() as any;
  const totalInvites = db.prepare('SELECT COUNT(*) as count FROM invitees').get() as any;
  
  const eventStats = db.prepare(`
    SELECT 
      e.id, 
      e.title, 
      e.date,
      COUNT(i.id) as total_invites,
      COUNT(CASE WHEN i.status = 'yes' THEN 1 END) as yes_count,
      COUNT(CASE WHEN i.status = 'no' THEN 1 END) as no_count,
      COUNT(CASE WHEN i.status = 'maybe' THEN 1 END) as maybe_count,
      COUNT(CASE WHEN i.status = 'pending' OR (i.id IS NOT NULL AND i.status IS NULL) THEN 1 END) as pending_count
    FROM events e
    LEFT JOIN invitees i ON e.id = i.event_id
    GROUP BY e.id
    ORDER BY e.date DESC
  `).all() as any[];

  const eventBreakdown = eventStats.map(e => ({
    ...e,
    yes_pct: e.total_invites > 0 ? (e.yes_count / e.total_invites) * 100 : 0,
    no_pct: e.total_invites > 0 ? (e.no_count / e.total_invites) * 100 : 0,
    maybe_pct: e.total_invites > 0 ? (e.maybe_count / e.total_invites) * 100 : 0,
    pending_pct: e.total_invites > 0 ? (e.pending_count / e.total_invites) * 100 : 0
  }));

  const archivedEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE is_archived = 1').get() as any;
  const pendingRequests = db.prepare("SELECT COUNT(*) as count FROM registration_requests WHERE status = 'pending'").get() as any;

  res.json({
    events: totalEvents.count,
    archived_events: archivedEvents.count,
    archived_pct: totalEvents.count > 0 ? (archivedEvents.count / totalEvents.count) * 100 : 0,
    persons: totalPersons.count,
    invites: totalInvites.count,
    pending_requests: pendingRequests.count,
    eventBreakdown
  });
});

// Notifications
adminRouter.get('/notifications', (req, res) => {
  const notifs = db.prepare("SELECT * FROM notifications WHERE user_type = 'admin' ORDER BY created_at DESC LIMIT 50").all();
  res.json(notifs);
});

// Registration Requests
adminRouter.get('/registration-requests', (req, res) => {
  const requests = db.prepare('SELECT * FROM registration_requests ORDER BY created_at DESC').all();
  res.json(requests);
});

adminRouter.put('/registration-requests/:id/approve', (req, res) => {
  try {
    const code = crypto.randomBytes(8).toString('hex').toUpperCase();
    db.prepare("UPDATE registration_requests SET status = 'approved', code = ? WHERE id = ?").run(code, req.params.id);
    
    // Notify the user if we had a way (for now just in DB)
    const request = db.prepare('SELECT * FROM registration_requests WHERE id = ?').get(req.params.id) as any;
    
    res.json({ success: true, code });
  } catch (e: any) {
    res.status(400).json({ error: 'Fehler beim Genehmigen' });
  }
});

adminRouter.put('/registration-requests/:id/reject', (req, res) => {
  db.prepare("UPDATE registration_requests SET status = 'rejected' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

adminRouter.delete('/registration-requests/:id', (req, res) => {
  db.prepare('DELETE FROM registration_requests WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

adminRouter.put('/notifications/:id/read', (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_type = 'admin'").run(req.params.id);
  res.json({ success: true });
});

adminRouter.put('/notifications/read-all', (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_type = 'admin'").run();
  res.json({ success: true });
});

// Settings
adminRouter.get('/settings', (req: any, res) => {
  const user = db.prepare('SELECT username FROM admin_users WHERE id = ?').get(req.admin.id) as any;
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  res.json({ username: user.username });
});

adminRouter.put('/settings', (req: any, res) => {
  try {
    const { username, currentPassword, newPassword } = settingsSchema.parse(req.body);
    
    const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.admin.id) as any;
    if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Aktuelles Passwort wird benötigt' });
      }
      if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
        return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
      }
      
      const newHash = bcrypt.hashSync(newPassword, 10);
      db.prepare('UPDATE admin_users SET username = ?, password_hash = ? WHERE id = ?')
        .run(username, newHash, req.admin.id);
    } else {
      db.prepare('UPDATE admin_users SET username = ? WHERE id = ?')
        .run(username, req.admin.id);
    }

    // Keep persons table in sync if username changed
    if (username !== user.username && user.person_id) {
      db.prepare('UPDATE persons SET name = ? WHERE id = ?').run(username, user.person_id);
    }

    const token = jwt.sign({ id: req.admin.id, username: username }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('admin_token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: isProd ? 'lax' : 'none' 
    });

    res.json({ success: true });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Benutzername ist bereits vergeben' });
    }
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});

apiRouter.use('/admin', adminRouter);

// --- PUBLIC ROUTES ---
const publicRouter = Router();

publicRouter.post('/registration-request', (req, res) => {
  try {
    const { name, email } = registrationRequestSchema.parse(req.body);
    db.prepare("INSERT INTO registration_requests (name, email) VALUES (?, ?)").run(name, email || null);
    
    // Notify admin
    db.prepare(`
      INSERT INTO notifications (user_type, title, message, link)
      VALUES ('admin', 'Neue Registrierungsanfrage', ?, '/registration-requests')
    `).run(`${name} möchte Mitglied werden.`);

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});

publicRouter.post('/register', (req, res) => {
  try {
    const { code, username, password } = registerWithCodeSchema.parse(req.body);
    
    const request = db.prepare("SELECT * FROM registration_requests WHERE code = ? AND status = 'approved'").get(code) as any;
    if (!request) {
      return res.status(400).json({ error: 'Ungültiger oder nicht genehmigter Registrierungscode' });
    }

    const hash = bcrypt.hashSync(password, 10);
    
    db.transaction(() => {
      // Create person
      const info = db.prepare('INSERT INTO persons (name, username, email, password_hash) VALUES (?, ?, ?, ?)').run(request.name, username, request.email, hash);
      const personId = info.lastInsertRowid;
      
      // Mark request as used (or delete it)
      db.prepare('DELETE FROM registration_requests WHERE id = ?').run(request.id);
      
      // Notify admin about new sign up
      db.prepare(`
        INSERT INTO notifications (user_type, title, message, link)
        VALUES ('admin', 'Neues Mitglied registriert', ?, '/persons')
      `).run(`${request.name} (@${username}) hat sich erfolgreich registriert.`);
    })();

    res.json({ success: true });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Benutzername ist bereits vergeben' });
    }
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});

publicRouter.post('/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const person = db.prepare('SELECT * FROM persons WHERE username = ? OR name = ?').get(username, username) as any;
    if (!person || !person.password_hash || !bcrypt.compareSync(password, person.password_hash)) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    const token = jwt.sign({ id: person.id, name: person.name, type: 'person' }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('person_token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: isProd ? 'lax' : 'none' 
    });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Ungültige Eingabedaten' });
  }
});

publicRouter.post('/logout', (req, res) => {
  res.clearCookie('person_token', {
    httpOnly: true,
    secure: true,
    sameSite: isProd ? 'lax' : 'none'
  });
  res.json({ success: true });
});

publicRouter.get('/check', requirePersonAuth, (req: any, res) => {
  const isAdmin = !!req.cookies.admin_token;
  res.json({ user: req.person, isAdmin });
});

publicRouter.get('/dashboard', requirePersonAuth, (req: any, res) => {
  const personId = req.person.id;
  const invitations = db.prepare(`
    SELECT i.*, e.title, e.date, e.location, e.description, e.response_deadline, e.meeting_point
    FROM invitees i
    JOIN events e ON i.event_id = e.id
    WHERE i.person_id = ?
    ORDER BY e.date ASC
  `).all(personId);
  res.json(invitations);
});

publicRouter.get('/invite/:token', (req, res) => {
  const invitee = db.prepare(`
    SELECT i.*, p.password_hash as has_profile, p.username as suggested_username
    FROM invitees i 
    JOIN persons p ON i.person_id = p.id
    WHERE i.token = ?
  `).get(req.params.token) as any;
  
  if (!invitee) return res.status(404).json({ error: 'Einladung nicht gefunden' });

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(invitee.event_id) as any;
  if (!event) return res.status(404).json({ error: 'Event nicht gefunden' });

  // Get other participants
  const participants = db.prepare(`
    SELECT p.name, i.status, i.guests_count
    FROM invitees i
    JOIN persons p ON i.person_id = p.id
    WHERE i.event_id = ? AND i.id != ? AND i.status IS NOT NULL AND i.status != 'pending'
    ORDER BY 
      CASE i.status 
        WHEN 'yes' THEN 1 
        WHEN 'maybe' THEN 2 
        WHEN 'no' THEN 3 
        ELSE 4 
      END,
      p.name ASC
  `).all(event.id, invitee.id);

  res.json({ 
    invitee: { ...invitee, has_profile: !!invitee.has_profile }, 
    aktion: event,
    participants
  });
});

publicRouter.post('/invite/:token/setup-profile', (req, res) => {
  try {
    const { username, password } = setupProfileSchema.parse(req.body);
    const invitee = db.prepare('SELECT person_id FROM invitees WHERE token = ?').get(req.params.token) as any;
    if (!invitee || !invitee.person_id) return res.status(404).json({ error: 'Einladung nicht gefunden' });

    const person = db.prepare('SELECT * FROM persons WHERE id = ?').get(invitee.person_id) as any;
    if (person.password_hash) return res.status(400).json({ error: 'Profil bereits erstellt' });

    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE persons SET username = ?, password_hash = ? WHERE id = ?').run(username, hash, invitee.person_id);

    // Auto login after setup
    const token = jwt.sign({ id: person.id, name: person.name, type: 'person' }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('person_token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: isProd ? 'lax' : 'none' 
    });

    res.json({ success: true });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Benutzername wird bereits verwendet' });
    }
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});

publicRouter.get('/notifications', requirePersonAuth, (req: any, res) => {
  const notifs = db.prepare("SELECT * FROM notifications WHERE user_type = 'person' AND user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.person.id);
  res.json(notifs);
});

publicRouter.put('/notifications/:id/read', requirePersonAuth, (req: any, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_type = 'person' AND user_id = ?").run(req.params.id, req.person.id);
  res.json({ success: true });
});

publicRouter.put('/notifications/read-all', requirePersonAuth, (req: any, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE user_type = 'person' AND user_id = ?").run(req.person.id);
  res.json({ success: true });
});

publicRouter.post('/invite/:token/respond', (req, res) => {
  try {
    const { status, comment, guests_count } = respondSchema.parse(req.body);

    // Check deadline
    const invitee = db.prepare('SELECT event_id FROM invitees WHERE token = ?').get(req.params.token) as any;
    if (!invitee) return res.status(404).json({ error: 'Einladung nicht gefunden' });
    
    const event = db.prepare('SELECT response_deadline FROM events WHERE id = ?').get(invitee.event_id) as any;
    if (event.response_deadline && new Date() > new Date(event.response_deadline)) {
      return res.status(400).json({ error: 'Die Antwortfrist ist bereits abgelaufen.' });
    }

    const stmt = db.prepare('UPDATE invitees SET status = ?, comment = ?, guests_count = ?, responded_at = CURRENT_TIMESTAMP WHERE token = ?');
    const info = stmt.run(status, comment || null, guests_count || 0, req.params.token);
    
    if (info.changes === 0) return res.status(404).json({ error: 'Einladung nicht gefunden' });
    
    // Create notification for admin
    const inviteeDetails = db.prepare(`
      SELECT i.name_snapshot, e.title, e.id as event_id
      FROM invitees i JOIN events e ON i.event_id = e.id
      WHERE i.token = ?
    `).get(req.params.token) as any;

    if (inviteeDetails) {
      let statusText = status === 'yes' ? 'zugesagt' : status === 'no' ? 'abgesagt' : 'mit "Vielleicht" geantwortet';
      db.prepare(`
        INSERT INTO notifications (user_type, title, message, link)
        VALUES ('admin', ?, ?, ?)
      `).run(
        'Neue Antwort',
        `${inviteeDetails.name_snapshot} hat für "${inviteeDetails.title}" ${statusText}.`,
        `/events/${inviteeDetails.event_id}`
      );
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});

apiRouter.use('/public', publicRouter);

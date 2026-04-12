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
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- RATE LIMITING ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window`
  message: { error: 'Zu viele Login-Versuche. Bitte in 15 Minuten erneut versuchen.' },
  standardHeaders: true,
  legacyHeaders: false,
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
  notes: z.string().optional().nullable()
});

const inviteSchema = z.object({
  person_id: z.number()
});

const respondSchema = z.object({
  status: z.enum(['yes', 'no', 'maybe']),
  comment: z.string().optional().nullable(),
  guests_count: z.number().min(0).max(10).optional().default(0)
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
  const events = db.prepare('SELECT * FROM events ORDER BY date DESC').all();
  res.json(events);
});
adminRouter.post('/events', (req, res) => {
  try {
    const { title, description, date, location, meeting_point, response_deadline } = eventSchema.parse(req.body);
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
adminRouter.post('/events/:id/invites', (req, res) => {
  try {
    const { person_id } = inviteSchema.parse(req.body);
    const person = db.prepare('SELECT name FROM persons WHERE id = ?').get(person_id) as any;
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const token = crypto.randomBytes(16).toString('hex');
    const stmt = db.prepare('INSERT INTO invitees (event_id, person_id, name_snapshot, token) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.params.id, person_id, person.name, token);
    res.json({ id: info.lastInsertRowid, token });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Person ist bereits eingeladen' });
    }
    res.status(400).json({ error: 'Ungültige Eingabedaten' });
  }
});
adminRouter.delete('/events/:id/invites/:inviteId', (req, res) => {
  db.prepare('DELETE FROM invitees WHERE id = ? AND event_id = ?').run(req.params.inviteId, req.params.id);
  res.json({ success: true });
});

// Persons
adminRouter.get('/persons', (req, res) => {
  const persons = db.prepare('SELECT * FROM persons ORDER BY name ASC').all();
  res.json(persons);
});
adminRouter.post('/persons', (req, res) => {
  try {
    const { name, notes } = personSchema.parse(req.body);
    const stmt = db.prepare('INSERT INTO persons (name, notes) VALUES (?, ?)');
    const info = stmt.run(name, notes || null);
    res.json({ id: info.lastInsertRowid });
  } catch (e: any) {
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});
adminRouter.put('/persons/:id', (req, res) => {
  try {
    const { name, notes } = personSchema.parse(req.body);
    const stmt = db.prepare('UPDATE persons SET name = ?, notes = ? WHERE id = ?');
    stmt.run(name, notes || null, req.params.id);
    res.json({ success: true });
  } catch (e: any) {
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
  res.json({
    events: totalEvents.count,
    persons: totalPersons.count,
    invites: totalInvites.count
  });
});

apiRouter.use('/admin', adminRouter);

// --- PUBLIC ROUTES ---
const publicRouter = Router();
publicRouter.get('/invite/:token', (req, res) => {
  const invitee = db.prepare(`
    SELECT * FROM invitees WHERE token = ?
  `).get(req.params.token) as any;
  
  if (!invitee) return res.status(404).json({ error: 'Einladung nicht gefunden' });

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(invitee.event_id);
  if (!event) return res.status(404).json({ error: 'Event nicht gefunden' });

  res.json({ invitee, event });
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
    
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.errors?.[0]?.message || 'Ungültige Eingabedaten' });
  }
});

apiRouter.use('/public', publicRouter);

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index.ts';
import { loginSchema } from '../schemas.ts';
import { loginLimiter, requireAuth, JWT_SECRET, isProd } from '../middleware.ts';

export const authRouter = Router();
authRouter.post('/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;
    
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(429).json({ error: 'Account ist vorübergehend gesperrt. Bitte später erneut versuchen.' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= 5) {
        const lockedUntil = new Date(Date.now() + 30 * 60000).toISOString();
        db.prepare('UPDATE admin_users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lockedUntil, user.id);
        return res.status(429).json({ error: 'Zu viele Fehlversuche. Account ist nun für 30 Minuten gesperrt.' });
      } else {
        db.prepare('UPDATE admin_users SET failed_login_attempts = ? WHERE id = ?').run(attempts, user.id);
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }
    }

    // Success - Reset counters
    db.prepare('UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

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

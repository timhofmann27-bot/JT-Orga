import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'data.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    meeting_point TEXT,
    response_deadline TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invitees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    person_id INTEGER,
    name_snapshot TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'yes', 'no', 'maybe'
    comment TEXT,
    guests_count INTEGER DEFAULT 0,
    responded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE SET NULL,
    UNIQUE(event_id, person_id)
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_type TEXT NOT NULL,
    user_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id TEXT PRIMARY KEY,
    user_type TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    public_key BLOB NOT NULL,
    counter INTEGER NOT NULL,
    transports TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS webauthn_challenges (
    user_type TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    challenge TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_type, user_id)
  );

  CREATE TABLE IF NOT EXISTS event_invitation_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_at DATETIME,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );
`);

// Add meeting_point column if it doesn't exist (migration)
try {
  db.exec('ALTER TABLE events ADD COLUMN meeting_point TEXT');
} catch (e: any) {
  if (!e.message.includes('duplicate column name')) {
    console.error('Error adding meeting_point column:', e);
  }
}

// Add is_archived column if it doesn't exist (migration)
try {
  db.exec('ALTER TABLE events ADD COLUMN is_archived INTEGER DEFAULT 0');
} catch (e: any) {
  if (!e.message.includes('duplicate column name')) {
    console.error('Error adding is_archived column:', e);
  }
}

// Add email and password_hash to persons (migration)
try {
  db.exec('ALTER TABLE persons ADD COLUMN email TEXT UNIQUE');
} catch (e: any) {
  if (!e.message.includes('duplicate column name')) {
    console.error('Error adding email column:', e);
  }
}

try {
  db.exec('ALTER TABLE persons ADD COLUMN password_hash TEXT');
} catch (e: any) {
  if (!e.message.includes('duplicate column name')) {
    console.error('Error adding password_hash column:', e);
  }
}

// Create default admins if not exists
const defaultAdmins = [
  { username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin123' },
  { username: 'admin2', password: 'admin2_password' },
  { username: 'admin3', password: 'admin3_password' }
];

for (const admin of defaultAdmins) {
  const exists = db.prepare('SELECT 1 FROM admin_users WHERE username = ?').get(admin.username);
  if (!exists) {
    const hash = bcrypt.hashSync(admin.password, 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(admin.username, hash);
    console.log(`Admin created: ${admin.username}`);
  }
}

// Sync all admins to persons table so they can be invited
const allAdmins = db.prepare('SELECT username FROM admin_users').all() as {username: string}[];
for (const admin of allAdmins) {
  const personExists = db.prepare('SELECT 1 FROM persons WHERE name = ?').get(admin.username);
  if (!personExists) {
    db.prepare('INSERT INTO persons (name, notes) VALUES (?, ?)').run(admin.username, 'Admin Account');
  }
}

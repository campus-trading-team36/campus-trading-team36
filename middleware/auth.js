// Auth middleware - token-based sessions with expiry and persistence

const fs = require('fs');
const path = require('path');
const { store } = require('../models/db');
const { randomToken } = require('../utils/security');

const SESSION_FILE = path.join(__dirname, '../sessions.json');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// token -> { userId, createdAt, lastSeen }
let sessions = {};

// load persisted sessions on boot so users survive a restart
try {
  if (fs.existsSync(SESSION_FILE)) {
    const raw = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    if (raw && typeof raw === 'object') sessions = raw;
  }
} catch (e) {
  console.warn('[Auth] could not load sessions, starting fresh');
  sessions = {};
}

let saveTimer = null;
function persistSessions() {
  // debounce - don't write the file on every request
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const tmp = SESSION_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(sessions), 'utf8');
      fs.renameSync(tmp, SESSION_FILE);
    } catch (e) {
      console.error('[Auth] session persist failed:', e.message);
    }
  }, 500);
}

function pruneExpired() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  let changed = false;
  for (const tok of Object.keys(sessions)) {
    if (sessions[tok].lastSeen < cutoff) {
      delete sessions[tok];
      changed = true;
    }
  }
  if (changed) persistSessions();
}
// background sweep
setInterval(pruneExpired, 60 * 60 * 1000).unref();

function createSession(userId) {
  const token = randomToken(32);
  const now = Date.now();
  sessions[token] = { userId, createdAt: now, lastSeen: now };
  persistSessions();
  return token;
}

function removeSession(token) {
  if (sessions[token]) {
    delete sessions[token];
    persistSessions();
  }
}

// kick a user off every device - used when their password changes or they get banned
function removeUserSessions(userId) {
  let changed = false;
  for (const tok of Object.keys(sessions)) {
    if (sessions[tok].userId === userId) {
      delete sessions[tok];
      changed = true;
    }
  }
  if (changed) persistSessions();
}

// flush sessions immediately (used on graceful shutdown)
function flushSessions() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  try {
    const tmp = SESSION_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(sessions), 'utf8');
    fs.renameSync(tmp, SESSION_FILE);
  } catch (e) {
    console.error('[Auth] flushSessions failed:', e.message);
  }
}

function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  return authHeader.replace(/^Bearer\s+/i, '').trim();
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }

  const session = sessions[token];
  if (!session) {
    return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
  }

  // expire stale sessions
  if (Date.now() - session.lastSeen > SESSION_TTL_MS) {
    delete sessions[token];
    persistSessions();
    return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
  }

  const user = store.users.find(u => u.id === session.userId);
  if (!user) {
    delete sessions[token];
    persistSessions();
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  // banned users lose access immediately
  if (user.banned) {
    delete sessions[token];
    persistSessions();
    return res.status(403).json({ success: false, message: 'This account has been suspended' });
  }

  // bump last-seen so active users keep their session
  session.lastSeen = Date.now();
  persistSessions();

  req.user = user;
  req.token = token;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  });
}

module.exports = {
  sessions, createSession, removeSession, removeUserSessions,
  requireAuth, requireAdmin, extractToken, flushSessions
};

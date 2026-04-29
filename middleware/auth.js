// 登录认证中间件
// session 用 token 存在内存里，重启时从 sessions.json 恢复

const fs = require('fs');
const path = require('path');
const { store } = require('../models/db');
const { randomToken } = require('../utils/security');

const SESSION_FILE = path.join(__dirname, '../sessions.json');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

// token -> { userId, createdAt, lastSeen }
let sessions = {};

// 启动时把磁盘上的 session 读回来，重启不会把所有人踢出去
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
  // 节流：每次请求都写一次太频繁
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
    const s = sessions[tok];
    // 老 session 可能没 lastSeen 字段，用 createdAt 兜底
    const seen = s.lastSeen || s.createdAt || 0;
    if (seen < cutoff) {
      delete sessions[tok];
      changed = true;
    }
  }
  if (changed) persistSessions();
}
// 每小时跑一次清理
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

// 把某个用户的所有 session 全删了（改密码或被封号时用）
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

// 立刻把 session 写到磁盘（关服务器前调一下）
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

  // 太久没活动的 session 算过期
  const lastSeen = session.lastSeen || session.createdAt || 0;
  if (Date.now() - lastSeen > SESSION_TTL_MS) {
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

  // 被封号的用户立刻断开
  if (user.banned) {
    delete sessions[token];
    persistSessions();
    return res.status(403).json({ success: false, message: 'This account has been suspended' });
  }

  // 更新一下活动时间，活跃用户的 session 不会过期
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

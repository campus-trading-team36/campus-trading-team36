// Auth middleware - token-based sessions stored in memory

const { store } = require('../models/db');

const sessions = {}; // token -> { userId, createdAt }

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function createSession(userId) {
  const token = generateToken();
  sessions[token] = { userId, createdAt: Date.now() };
  return token;
}

function removeSession(token) {
  delete sessions[token];
}

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const session = sessions[token];
  if (!session) {
    return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
  }

  const user = store.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  req.user = user;
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

module.exports = { sessions, createSession, removeSession, requireAuth, requireAdmin };

// shared input validators / sanitisers

const config = require('../config');

const USERNAME_RE = /^[a-zA-Z0-9_\-\u4e00-\u9fa5]{2,20}$/;

// reject control chars, return trimmed string within len limits
function cleanString(v, max) {
  if (v === undefined || v === null) return '';
  let s = String(v).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
  if (max && s.length > max) s = s.slice(0, max);
  return s;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 100) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const domain = email.split('@')[1].toLowerCase();
  return config.emailDomains.includes(domain);
}

function isValidUsername(name) {
  return typeof name === 'string' && USERNAME_RE.test(name);
}

function isStrongEnoughPassword(pwd) {
  // student-level rule: at least 6 chars, must include letter and digit
  if (typeof pwd !== 'string') return false;
  if (pwd.length < 6 || pwd.length > 64) return false;
  return /[A-Za-z]/.test(pwd) && /\d/.test(pwd);
}

function clampInt(v, min, max, def) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return def;
  return Math.min(Math.max(n, min), max);
}

function clampFloat(v, min, max) {
  const n = Number(v);
  if (isNaN(n)) return null;
  return Math.min(Math.max(n, min), max);
}

// strip script tags / iframe etc from user-provided text (defence in depth)
function stripUnsafe(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// is this request running in dev mode (used to expose helpful debug info)
function isDevMode() {
  const env = (process.env.NODE_ENV || '').toLowerCase();
  return env !== 'production';
}

module.exports = {
  cleanString,
  isValidEmail,
  isValidUsername,
  isStrongEnoughPassword,
  clampInt,
  clampFloat,
  stripUnsafe,
  isDevMode
};

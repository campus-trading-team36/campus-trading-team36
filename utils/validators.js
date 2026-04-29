// \u5404\u79cd\u8f93\u5165\u6821\u9a8c\u548c\u6e05\u6d17\u7684\u5de5\u5177\u51fd\u6570

const config = require('../config');

const USERNAME_RE = /^[a-zA-Z0-9_\-\u4e00-\u9fa5]{2,20}$/;

// \u53bb\u6389\u63a7\u5236\u5b57\u7b26\uff0ctrim\uff0c\u622a\u65ad\u5230 max \u957f\u5ea6
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
  // 简单规则：至少 6 位，得有字母也得有数字
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

// 把用户输入里的 script / iframe / on... 这些危险东西去掉（防 XSS 多一层保险）
function stripUnsafe(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// 是不是开发模式（开发模式下接口会带一些方便调试的信息）
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

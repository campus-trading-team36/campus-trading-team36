// password hashing using node's built-in crypto (PBKDF2)
// no extra dependency needed

const crypto = require('crypto');

const ITERATIONS = 100000;
const KEY_LEN = 32;
const DIGEST = 'sha256';
const SALT_LEN = 16;

// hash a plaintext password, returns "iterations:salt:hash" string
function hashPassword(plain) {
  if (!plain || typeof plain !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(SALT_LEN).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `${ITERATIONS}:${salt}:${hash}`;
}

// check if a stored hash matches a plaintext password (timing-safe)
function verifyPassword(plain, stored) {
  if (!plain || !stored || typeof stored !== 'string') return false;

  // legacy plaintext fallback (so old data still works during migration)
  if (!stored.includes(':')) {
    return plain === stored;
  }

  const parts = stored.split(':');
  if (parts.length !== 3) return false;

  const iterations = parseInt(parts[0], 10);
  const salt = parts[1];
  const expected = parts[2];
  if (!iterations || !salt || !expected) return false;

  try {
    const candidate = crypto.pbkdf2Sync(plain, salt, iterations, KEY_LEN, DIGEST).toString('hex');
    const a = Buffer.from(candidate, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

// returns true if value looks like a hashed password (not plaintext)
function isHashed(stored) {
  return typeof stored === 'string' && stored.split(':').length === 3;
}

// secure random token (used for session ids)
function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { hashPassword, verifyPassword, isHashed, randomToken };

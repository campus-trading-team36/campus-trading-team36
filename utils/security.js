// 密码哈希用 Node 自带的 crypto（PBKDF2）
// 不用装额外的库

const crypto = require('crypto');

const ITERATIONS = 100000;
const KEY_LEN = 32;
const DIGEST = 'sha256';
const SALT_LEN = 16;

// 把明文密码哈希成 "iterations:salt:hash" 这个格式
function hashPassword(plain) {
  if (!plain || typeof plain !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(SALT_LEN).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `${ITERATIONS}:${salt}:${hash}`;
}

// 校验密码（用 timingSafeEqual 防时序攻击）
function verifyPassword(plain, stored) {
  if (!plain || !stored || typeof stored !== 'string') return false;

  // 兼容老的明文密码（迁移过来的数据）
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

// 判断这个值是不是已经哈希过的（不是明文）
function isHashed(stored) {
  return typeof stored === 'string' && stored.split(':').length === 3;
}

// 生成 session token 的随机字符串
function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { hashPassword, verifyPassword, isHashed, randomToken };

// 用户相关业务逻辑

const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');
const { createSession, removeSession, removeUserSessions } = require('../middleware/auth');
const { hashPassword, verifyPassword, isHashed } = require('../utils/security');
const {
  cleanString, isValidEmail, isValidUsername, isStrongEnoughPassword, isDevMode
} = require('../utils/validators');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 定期清理过期的验证码
function pruneExpiredCodes() {
  const now = Date.now();
  const before = store.verifyCodes.length;
  store.verifyCodes = store.verifyCodes.filter(v => v.expiresAt > now);
  if (store.verifyCodes.length !== before) save();
}
setInterval(pruneExpiredCodes, 30 * 60 * 1000).unref();

// purpose: 'register' 注册用，'reset' 找回密码用
function sendVerification(email, purpose) {
  email = (email || '').toLowerCase().trim();
  if (!isValidEmail(email)) {
    return { success: false, message: 'Please use your university email (@liverpool.ac.uk)' };
  }
  purpose = purpose === 'reset' ? 'reset' : 'register';

  if (purpose === 'reset' && !store.users.find(u => u.email === email)) {
    // 不告诉外人这个邮箱有没有注册过
    return { success: true, message: 'If that email is registered, a reset code has been sent' };
  }

  // 限频：30秒内只能发一次
  const recent = store.verifyCodes.find(v =>
    v.email === email && v.purpose === purpose && (Date.now() - (v.issuedAt || 0)) < 30 * 1000
  );
  if (recent) {
    return { success: false, message: 'Please wait before requesting a new code' };
  }

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 分钟过期

  // 旧的同邮箱+用途的验证码先删掉
  for (let i = store.verifyCodes.length - 1; i >= 0; i--) {
    if (store.verifyCodes[i].email === email && store.verifyCodes[i].purpose === purpose) {
      store.verifyCodes.splice(i, 1);
    }
  }

  store.verifyCodes.push({ email, code, expiresAt, issuedAt: Date.now(), attempts: 0, purpose });
  save();

  console.log(`[Email Verification] ${purpose} ${email} -> code: ${code}`);

  // 开发/演示模式直接把验证码返回给前端方便测试，生产环境不会
  const out = { success: true, message: 'Verification code sent' };
  if (isDevMode()) out.code = code;
  return out;
}

function register(username, email, password, verifyCode) {
  email = (email || '').toLowerCase().trim();
  username = cleanString(username, 20);
  password = String(password || '');

  if (!username || !email || !password) {
    return { success: false, message: 'All fields are required' };
  }
  if (!isValidUsername(username)) {
    return { success: false, message: 'Username must be 2-20 characters (letters, numbers, _, -)' };
  }
  if (!isStrongEnoughPassword(password)) {
    return { success: false, message: 'Password must be 6-64 chars and contain a letter and a number' };
  }
  if (!isValidEmail(email)) {
    return { success: false, message: 'Please use your university email' };
  }

  if (store.users.find(u => u.email === email)) {
    return { success: false, message: 'This email is already registered' };
  }
  if (store.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: 'Username is taken' };
  }

  // check verify code (purpose=register)
  const record = store.verifyCodes.find(v => v.email === email && v.purpose === 'register');
  if (!record) return { success: false, message: 'Please request a verification code first' };
  if (Date.now() > record.expiresAt) {
    store.verifyCodes.splice(store.verifyCodes.indexOf(record), 1);
    save();
    return { success: false, message: 'Verification code expired, please request a new one' };
  }

  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    store.verifyCodes.splice(store.verifyCodes.indexOf(record), 1);
    save();
    return { success: false, message: 'Too many failed attempts, please request a new code' };
  }
  if (record.code !== String(verifyCode || '').trim()) {
    save();
    return { success: false, message: 'Invalid verification code' };
  }

  store.verifyCodes.splice(store.verifyCodes.indexOf(record), 1);

  const newUser = {
    id: uuidv4(),
    username,
    email,
    password: hashPassword(password),
    role: 'user',
    verified: true,
    banned: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: null
  };

  store.users.push(newUser);
  save();

  const token = createSession(newUser.id);
  return {
    success: true,
    message: 'Registration successful',
    data: { token, user: { id: newUser.id, username, email, role: 'user' } }
  };
}

function login(email, password) {
  if (!email || !password) {
    return { success: false, message: 'Email and password are required' };
  }
  email = String(email).toLowerCase().trim();
  password = String(password);

  const user = store.users.find(u => u.email === email);
  if (!user) return { success: false, message: 'Invalid email or password' };

  if (user.banned) {
    return { success: false, message: 'This account has been suspended. Contact admin for help.' };
  }

  if (!verifyPassword(password, user.password)) {
    return { success: false, message: 'Invalid email or password' };
  }

  // 老用户密码可能是明文，登录成功时顺便升级成哈希
  if (!isHashed(user.password)) {
    user.password = hashPassword(password);
  }
  user.lastLoginAt = new Date().toISOString();
  save();

  const token = createSession(user.id);
  return {
    success: true,
    message: 'Login successful',
    data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } }
  };
}

function logout(token) {
  removeSession(String(token || '').replace(/^Bearer\s+/i, '').trim());
  return { success: true, message: 'Logged out' };
}

function getProfile(userId) {
  const user = store.users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'User not found' };
  return {
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || null
    }
  };
}

// change password while logged in - requires current password
function changePassword(userId, currentPassword, newPassword) {
  const user = store.users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'User not found' };
  if (!currentPassword || !newPassword) return { success: false, message: 'Current and new passwords are required' };
  if (!verifyPassword(String(currentPassword), user.password)) {
    return { success: false, message: 'Current password is incorrect' };
  }
  if (!isStrongEnoughPassword(newPassword)) {
    return { success: false, message: 'New password must be 6-64 chars and contain a letter and a number' };
  }
  if (String(currentPassword) === String(newPassword)) {
    return { success: false, message: 'New password must be different from the current one' };
  }
  user.password = hashPassword(String(newPassword));
  save();
  // 改完密码强制所有设备重新登录
  removeUserSessions(userId);
  return { success: true, message: 'Password changed. Please log in again.' };
}

// 用户忘记密码时用验证码重设
function resetPassword(email, code, newPassword) {
  email = (email || '').toLowerCase().trim();
  if (!isValidEmail(email)) return { success: false, message: 'Invalid email' };
  if (!isStrongEnoughPassword(newPassword)) {
    return { success: false, message: 'New password must be 6-64 chars and contain a letter and a number' };
  }

  const user = store.users.find(u => u.email === email);
  // 邮箱存不存在都返回一样的报错，防止枚举
  const generic = { success: false, message: 'Invalid email or reset code' };
  if (!user) return generic;

  const record = store.verifyCodes.find(v => v.email === email && v.purpose === 'reset');
  if (!record) return generic;
  if (Date.now() > record.expiresAt) {
    store.verifyCodes.splice(store.verifyCodes.indexOf(record), 1);
    save();
    return { success: false, message: 'Reset code expired, please request a new one' };
  }

  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    store.verifyCodes.splice(store.verifyCodes.indexOf(record), 1);
    save();
    return { success: false, message: 'Too many failed attempts, please request a new code' };
  }
  if (record.code !== String(code || '').trim()) {
    save();
    return generic;
  }

  store.verifyCodes.splice(store.verifyCodes.indexOf(record), 1);
  user.password = hashPassword(String(newPassword));
  save();
  // 重设完密码踢掉所有 session
  removeUserSessions(user.id);

  return { success: true, message: 'Password reset successful, please log in' };
}

module.exports = {
  sendVerification, register, login, logout, getProfile,
  changePassword, resetPassword
};

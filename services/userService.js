// user business logic

const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');
const config = require('../config');
const { createSession, removeSession } = require('../middleware/auth');

function isUniversityEmail(email) {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase();
  return config.emailDomains.includes(domain);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// send verification code
// for demo the code is returned in the response body so testers can copy it
function sendVerification(email) {
  // BUG-01 fix: normalise to lowercase so ABC@liverpool.ac.uk == abc@liverpool.ac.uk
  email = (email || '').toLowerCase().trim();
  if (!isUniversityEmail(email)) {
    return { success: false, message: 'Please use your university email (@liverpool.ac.uk)' };
  }

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

  // remove old code for this email if any
  const idx = store.verifyCodes.findIndex(v => v.email === email);
  if (idx !== -1) store.verifyCodes.splice(idx, 1);

  store.verifyCodes.push({ email, code, expiresAt });
  save();

  console.log(`[Email Verification] ${email} -> code: ${code}`);
  // in real project you'd send an actual email here (nodemailer etc.)

  return { success: true, message: 'Verification code sent', code };
}

function register(username, email, password, verifyCode) {
  // normalise email - same fix as sendVerification
  email = (email || '').toLowerCase().trim();
  username = (username || '').trim();
  if (!username || !email || !password) {
    return { success: false, message: 'All fields are required' };
  }
  if (username.length < 2 || username.length > 20) {
    return { success: false, message: 'Username must be 2-20 characters' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters' };
  }
  if (!isUniversityEmail(email)) {
    return { success: false, message: 'Please use your university email' };
  }

  if (store.users.find(u => u.email === email)) {
    return { success: false, message: 'This email is already registered' };
  }
  if (store.users.find(u => u.username === username)) {
    return { success: false, message: 'Username is taken' };
  }

  // check verify code
  const record = store.verifyCodes.find(v => v.email === email && v.code === verifyCode);
  if (!record) return { success: false, message: 'Invalid verification code' };
  if (Date.now() > record.expiresAt) return { success: false, message: 'Verification code expired' };

  // remove used code
  store.verifyCodes.splice(store.verifyCodes.indexOf(record), 1);

  const newUser = {
    id: uuidv4(),
    username,
    email,
    password, // TODO: use bcrypt in production
    role: 'user',
    verified: true,
    createdAt: new Date().toISOString()
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
  // lowercase email so Admin@Liverpool.ac.uk still logs in
  email = email.toLowerCase().trim();
  const user = store.users.find(u => u.email === email && u.password === password);
  if (!user) return { success: false, message: 'Invalid email or password' };

  const token = createSession(user.id);
  return {
    success: true,
    message: 'Login successful',
    data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } }
  };
}

function logout(token) {
  removeSession(token.replace('Bearer ', '').trim());
  return { success: true, message: 'Logged out' };
}

function getProfile(userId) {
  const user = store.users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'User not found' };
  return {
    success: true,
    data: { id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt }
  };
}

module.exports = { sendVerification, register, login, logout, getProfile };

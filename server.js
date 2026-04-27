// app entry - express server with all middleware wired up

// load .env first so process.env is populated before config reads it
require('./utils/loadEnv')();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

require('./models/db');

const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const favoriteRoutes = require('./routes/favorite');
const messageRoutes = require('./routes/message');
const reportRoutes = require('./routes/report');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/review');

const securityHeaders = require('./middleware/securityHeaders');
const logger = require('./middleware/logger');
const { makeLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { flushSessions } = require('./middleware/auth');
const { flushAllSync } = require('./utils/atomicWrite');
const { flushPendingViews } = require('./services/productService');

const app = express();

// trust proxy when running behind a real load balancer (heroku/render etc.)
app.set('trust proxy', 1);
// drop the express fingerprint header
app.disable('x-powered-by');

// CORS - allow configured origins or open in dev
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;
app.use(cors({ origin: corsOrigins, credentials: false }));

app.use(securityHeaders);
app.use(logger);

// body parser with size limit (DoS protection)
app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.jsonBodyLimit }));

// global rate limit (per IP) - generous so normal use is unaffected
app.use('/api/', makeLimiter({ windowMs: 60 * 1000, max: 200 }));

// stricter rate limit for auth-sensitive endpoints
const authLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many login/registration attempts, please wait a minute'
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize, files: config.maxImagesPerProduct },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(null, false);
    // also check declared mimetype
    if (file.mimetype && !file.mimetype.startsWith('image/')) return cb(null, false);
    cb(null, true);
  }
});

const { requireAuth } = require('./middleware/auth');

// upload limiter - stop a logged-in user spamming uploads
const uploadLimiter = makeLimiter({ windowMs: 60 * 1000, max: 30, message: 'Upload rate too high, please slow down' });

app.post('/api/upload', requireAuth, uploadLimiter, (req, res, next) => {
  upload.array('images', config.maxImagesPerProduct)(req, res, (err) => {
    if (err) return next(err);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid image files uploaded' });
    }
    const urls = req.files.map(f => '/uploads/' + f.filename);
    res.json({ success: true, urls });
  });
});

app.use(express.static(path.join(__dirname, 'public')));

// scope auth limiter to login/register/reset paths only
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);
app.use('/api/user/verify', authLimiter);
app.use('/api/user/forgot', authLimiter);
app.use('/api/user/reset', authLimiter);

app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/review', reviewRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
});

// SPA fallback - any non-api GET serves the frontend
app.get('*', (req, res, next) => {
  if (req.path.indexOf('/api/') === 0) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, config.host, () => {
  console.log('=================================');
  console.log(' Campus Trading Platform');
  console.log(` http://localhost:${config.port}`);
  console.log('=================================');
  console.log(` Admin email: ${config.admin.email}`);
  if ((process.env.ADMIN_PASSWORD || '') === '') {
    console.log(' Admin password: admin123 (default - change ADMIN_PASSWORD in production)');
  }
  console.log(` Moderation: ${config.moderationEnabled ? 'on (new listings need admin approval)' : 'off'}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================');
});

// keep the connection alive long enough for slow requests but not forever
server.keepAliveTimeout = 65 * 1000;
server.headersTimeout = 70 * 1000;

// graceful shutdown so the JSON file isn't half-written on Ctrl+C
let shuttingDown = false;
function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[Server] received ${sig}, shutting down...`);

  server.close(() => {
    try { flushPendingViews(); } catch (e) { console.error('[Shutdown] flushPendingViews:', e.message); }
    try { flushAllSync(); }    catch (e) { console.error('[Shutdown] flushAllSync:', e.message); }
    try { flushSessions(); }   catch (e) { console.error('[Shutdown] flushSessions:', e.message); }
    console.log('[Server] clean shutdown complete');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('[Server] force exit after timeout');
    process.exit(1);
  }, 10 * 1000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// last line of defence so an async crash doesn't kill the server silently
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
});

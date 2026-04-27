// express app factory - separated from server.js so tests can import without binding a port

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

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;
app.use(cors({ origin: corsOrigins, credentials: false }));

app.use(securityHeaders);
// skip access logging during tests
if (process.env.NODE_ENV !== 'test') app.use(logger);

app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.jsonBodyLimit }));

// rate limiting is disabled under NODE_ENV=test so test runs aren't throttled
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', makeLimiter({ windowMs: 60 * 1000, max: 200 }));
  const authLimiter = makeLimiter({ windowMs: 60 * 1000, max: 10, message: 'Too many login/registration attempts, please wait a minute' });
  app.use('/api/user/login', authLimiter);
  app.use('/api/user/register', authLimiter);
  app.use('/api/user/verify', authLimiter);
  app.use('/api/user/forgot', authLimiter);
  app.use('/api/user/reset', authLimiter);
}

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
    if (file.mimetype && !file.mimetype.startsWith('image/')) return cb(null, false);
    cb(null, true);
  }
});

const { requireAuth } = require('./middleware/auth');
const uploadLimiter = process.env.NODE_ENV !== 'test'
  ? makeLimiter({ windowMs: 60 * 1000, max: 30, message: 'Upload rate too high, please slow down' })
  : (req, res, next) => next();

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

app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/review', reviewRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: Math.round(process.uptime()) });
});

app.get('*', (req, res, next) => {
  if (req.path.indexOf('/api/') === 0) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;

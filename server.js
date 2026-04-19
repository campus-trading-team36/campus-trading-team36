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

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

const { requireAuth } = require('./middleware/auth');

app.post('/api/upload', requireAuth, upload.array('images', config.maxImagesPerProduct), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  const urls = req.files.map(f => '/uploads/' + f.filename);
  res.json({ success: true, urls });
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(config.port, config.host, () => {
  console.log('=================================');
  console.log(' Campus Trading Platform');
  console.log(` http://localhost:${config.port}`);
  console.log('=================================');
  console.log(' Admin: admin@liverpool.ac.uk / admin123');
  console.log('=================================');
});

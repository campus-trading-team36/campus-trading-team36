// data store - JSON file-backed, with atomic writes and migration on load

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { hashPassword, isHashed } = require('../utils/security');
const { enqueueSave, writeSyncAtomic } = require('../utils/atomicWrite');

const DATA_FILE = path.join(__dirname, '../data.json');

const defaults = {
  users: [],
  products: [],
  messages: [],
  reports: [],
  favorites: [],
  verifyCodes: [],
  reviews: [],
  browsingHistory: [],
  cart: [],
  adminLog: []
};

let store;
if (fs.existsSync(DATA_FILE)) {
  try {
    store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    for (const key of Object.keys(defaults)) {
      if (!store[key]) store[key] = [];
    }
    // migrate old products to new schema
    let migrated = 0;
    for (const p of store.products) {
      if (!p.images) { p.images = p.image ? [p.image] : []; migrated++; }
      if (!p.condition) { p.condition = 'good'; migrated++; }
      if (!p.tags) { p.tags = []; migrated++; }
      if (!p.brand) p.brand = '';
      if (!p.purchaseDate) p.purchaseDate = '';
      if (!p.defects) p.defects = '';
      if (!p.location) p.location = '';
      if (p.viewCount === undefined) p.viewCount = 0;
    }
    if (migrated > 0) { console.log('[DB] Migrated', store.products.length, 'products to new schema'); }
    // migrate plaintext passwords to hashed (one-time, idempotent)
    let pwMigrated = 0;
    for (const u of store.users) {
      if (u.password && !isHashed(u.password)) {
        u.password = hashPassword(u.password);
        pwMigrated++;
      }
    }
    if (pwMigrated > 0) console.log(`[DB] Hashed ${pwMigrated} legacy plaintext passwords`);
    // ensure new user fields exist on legacy data
    for (const u of store.users) {
      if (u.banned === undefined) u.banned = false;
      if (u.lastLoginAt === undefined) u.lastLoginAt = null;
    }
    console.log('[DB] Loaded data from', DATA_FILE);
  } catch (e) {
    console.warn('[DB] Could not read data file, starting fresh:', e.message);
    store = JSON.parse(JSON.stringify(defaults));
  }
} else {
  store = JSON.parse(JSON.stringify(defaults));
}

// async save - safe under concurrent calls (queued)
function save() {
  enqueueSave(DATA_FILE, () => JSON.stringify(store, null, 2));
}

// sync save - only used for first-time init
function saveSync() {
  writeSyncAtomic(DATA_FILE, JSON.stringify(store, null, 2));
}

// seed admin + sample products on first run
if (!store.users.find(u => u.id === 'admin-001')) {
  const now = new Date().toISOString();

  store.users.push({
    id: 'admin-001',
    username: config.admin.username,
    email: config.admin.email.toLowerCase(),
    password: hashPassword(config.admin.password),
    role: 'admin',
    verified: true,
    createdAt: now
  });

  const sampleProducts = [
    {
      title: 'Dell XPS 13 Laptop',
      description: 'Used for 1 year, good condition. Battery lasts about 4 hours. Comes with original charger and carry bag.',
      price: 280, category: 'Electronics',
      images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop'],
      condition: 'good', brand: 'Dell', location: 'Carnatic Halls', tags: ['laptop', 'computer']
    },
    {
      title: 'Sony WH-1000XM4 Headphones',
      description: 'Noise-cancelling headphones, barely used. Comes with case and cables. Bought for £280.',
      price: 120, category: 'Electronics',
      images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop'],
      condition: 'like-new', brand: 'Sony', location: 'Greenbank', tags: ['headphones', 'audio']
    },
    {
      title: 'ACFI101 Accounting Textbook',
      description: 'UoL official module book. Some highlighting on pages but overall clean and complete.',
      price: 25, category: 'Books',
      images: ['https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=600&fit=crop'],
      condition: 'good', brand: '', location: 'Crown Place', tags: ['accounting', 'ACFI101']
    },
    {
      title: 'Introduction to Python Textbook',
      description: 'Programming textbook, COMP101. Clean copy with no annotations.',
      price: 20, category: 'Books',
      images: ['https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=600&fit=crop'],
      condition: 'like-new', brand: '', location: 'Vine Court', tags: ['python', 'programming', 'COMP101']
    },
    {
      title: 'Nike Air Max 270 Size 42',
      description: 'Worn a few times, like new condition. Original box included.',
      price: 55, category: 'Clothing',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop'],
      condition: 'like-new', brand: 'Nike', location: 'Carnatic Halls', tags: ['shoes', 'nike', 'trainers']
    },
    {
      title: 'Adidas Waterproof Backpack 30L',
      description: '30L capacity, laptop compartment, used 2 semesters. Still great condition.',
      price: 22, category: 'Clothing',
      images: ['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&h=600&fit=crop'],
      condition: 'good', brand: 'Adidas', location: 'Greenbank', tags: ['backpack', 'bag']
    },
    {
      title: 'IKEA FORSÅ Desk Lamp',
      description: 'White desk lamp, adjustable arm. Works perfectly, selling because moving out of halls.',
      price: 12, category: 'Furniture',
      images: ['https://images.unsplash.com/photo-1534189668023-c54d7305a752?w=800&h=600&fit=crop'],
      condition: 'good', brand: 'IKEA', location: 'Crown Place', tags: ['lamp', 'desk', 'ikea']
    },
    {
      title: 'Mini Fridge 40L',
      description: 'Perfect for student room. Runs quietly, keeps drinks cold. Moving out sale.',
      price: 45, category: 'Furniture',
      images: ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&h=600&fit=crop'],
      condition: 'fair', brand: '', location: 'Vine Court', tags: ['fridge', 'kitchen']
    },
    {
      title: 'Yoga Mat + Resistance Bands',
      description: 'Purple yoga mat 6mm thick plus set of 5 resistance bands. Used one semester only.',
      price: 18, category: 'Sports',
      images: ['https://images.unsplash.com/photo-1601925228717-b8b673b3e52e?w=800&h=600&fit=crop'],
      condition: 'good', brand: '', location: 'Greenbank', tags: ['yoga', 'fitness', 'gym']
    },
    {
      title: 'Casio fx-991EX Calculator',
      description: 'Required for engineering/maths modules. Fully functional with fresh batteries.',
      price: 15, category: 'Stationery',
      images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop'],
      condition: 'good', brand: 'Casio', location: 'Carnatic Halls', tags: ['calculator', 'maths', 'engineering']
    }
  ];

  for (const p of sampleProducts) {
    store.products.push({
      id: uuidv4(),
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      images: p.images,
      image: p.images[0],
      condition: p.condition,
      brand: p.brand || '',
      purchaseDate: '',
      defects: '',
      location: p.location,
      tags: p.tags,
      sellerId: 'admin-001',
      sellerName: config.admin.username,
      status: 'approved',
      viewCount: 0,
      createdAt: now
    });
  }

  saveSync();
  console.log('[DB] Database initialised with seed data');
}

module.exports = { store, save };

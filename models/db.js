// data layer - SQLite-backed (better-sqlite3) with in-memory caches
// the cached arrays keep the legacy `store + save()` API working,
// while real persistence goes through SQL transactions.

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const config = require('../config');
const { hashPassword, isHashed } = require('../utils/security');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '../data.db');
const LEGACY_JSON = path.join(__dirname, '../data.json');

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// ---------- schema ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    verified INTEGER NOT NULL DEFAULT 0,
    banned INTEGER NOT NULL DEFAULT 0,
    lastLoginAt TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    images TEXT,
    image TEXT,
    condition TEXT DEFAULT 'good',
    brand TEXT DEFAULT '',
    purchaseDate TEXT DEFAULT '',
    defects TEXT DEFAULT '',
    location TEXT DEFAULT '',
    tags TEXT,
    sellerId TEXT NOT NULL,
    sellerName TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    viewCount INTEGER NOT NULL DEFAULT 0,
    rejectReason TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_products_seller ON products(sellerId);
  CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    senderId TEXT NOT NULL,
    senderName TEXT,
    receiverId TEXT NOT NULL,
    receiverName TEXT,
    content TEXT NOT NULL,
    productId TEXT,
    productTitle TEXT,
    createdAt TEXT NOT NULL,
    isRead INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId);
  CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiverId);

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporterId TEXT NOT NULL,
    reporterName TEXT,
    targetId TEXT NOT NULL,
    targetType TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    handledAt TEXT,
    handledBy TEXT
  );

  CREATE TABLE IF NOT EXISTS favorites (
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    addedAt TEXT NOT NULL,
    PRIMARY KEY (userId, productId)
  );

  CREATE TABLE IF NOT EXISTS verify_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expiresAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    sellerId TEXT NOT NULL,
    buyerId TEXT NOT NULL,
    buyerName TEXT,
    rating INTEGER NOT NULL,
    comment TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(sellerId);
  CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(productId);

  CREATE TABLE IF NOT EXISTS browsing_history (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    viewedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_history_user ON browsing_history(userId);

  CREATE TABLE IF NOT EXISTS cart (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    note TEXT,
    addedAt TEXT NOT NULL,
    UNIQUE(userId, productId)
  );
  CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(userId);

  CREATE TABLE IF NOT EXISTS admin_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actorId TEXT,
    actorName TEXT,
    action TEXT,
    targetType TEXT,
    targetId TEXT,
    detail TEXT,
    at TEXT NOT NULL
  );
`);

// ---------- row <-> object converters ----------
// products store images & tags as JSON strings in SQL; we materialise arrays for service code
function rowToProduct(r) {
  if (!r) return null;
  return {
    ...r,
    verified: undefined,
    images: r.images ? JSON.parse(r.images) : [],
    tags: r.tags ? JSON.parse(r.tags) : [],
    viewCount: r.viewCount || 0
  };
}
function rowToUser(r) {
  if (!r) return null;
  return {
    ...r,
    verified: !!r.verified,
    banned: !!r.banned
  };
}
function rowToMessage(r) {
  if (!r) return null;
  return { ...r, isRead: !!r.isRead };
}

// ---------- load everything into in-memory arrays ----------
function loadAll() {
  return {
    users: db.prepare('SELECT * FROM users').all().map(rowToUser),
    products: db.prepare('SELECT * FROM products').all().map(rowToProduct),
    messages: db.prepare('SELECT * FROM messages').all().map(rowToMessage),
    reports: db.prepare('SELECT * FROM reports').all(),
    favorites: db.prepare('SELECT * FROM favorites').all(),
    verifyCodes: db.prepare('SELECT * FROM verify_codes').all(),
    reviews: db.prepare('SELECT * FROM reviews').all(),
    browsingHistory: db.prepare('SELECT * FROM browsing_history').all(),
    cart: db.prepare('SELECT * FROM cart').all(),
    adminLog: db.prepare('SELECT * FROM admin_log ORDER BY id ASC').all().map(r => {
      const { id, ...rest } = r; return rest;
    })
  };
}

// ---------- one-time migration from legacy data.json ----------
function migrateFromJson() {
  if (!fs.existsSync(LEGACY_JSON)) return false;
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return false; // already migrated

  let json;
  try { json = JSON.parse(fs.readFileSync(LEGACY_JSON, 'utf8')); }
  catch (e) { console.warn('[DB] legacy data.json unreadable:', e.message); return false; }

  console.log('[DB] migrating data.json -> SQLite ...');
  const tx = db.transaction(() => {
    for (const u of (json.users || [])) {
      db.prepare(`INSERT OR IGNORE INTO users
        (id, username, email, password, role, verified, banned, lastLoginAt, createdAt)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(
        u.id, u.username, (u.email || '').toLowerCase(),
        isHashed(u.password) ? u.password : hashPassword(u.password || ''),
        u.role || 'user', u.verified ? 1 : 0, u.banned ? 1 : 0,
        u.lastLoginAt || null, u.createdAt || new Date().toISOString()
      );
    }
    for (const p of (json.products || [])) {
      db.prepare(`INSERT OR IGNORE INTO products
        (id,title,description,price,category,images,image,condition,brand,purchaseDate,defects,location,tags,sellerId,sellerName,status,viewCount,rejectReason,createdAt,updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        p.id, p.title, p.description || '', p.price, p.category || '',
        JSON.stringify(p.images || (p.image ? [p.image] : [])),
        (p.images && p.images[0]) || p.image || '',
        p.condition || 'good', p.brand || '', p.purchaseDate || '',
        p.defects || '', p.location || '', JSON.stringify(p.tags || []),
        p.sellerId, p.sellerName || '', p.status || 'pending',
        p.viewCount || 0, p.rejectReason || null,
        p.createdAt || new Date().toISOString(), p.updatedAt || null
      );
    }
    for (const f of (json.favorites || [])) {
      db.prepare('INSERT OR IGNORE INTO favorites (userId,productId,addedAt) VALUES (?,?,?)')
        .run(f.userId, f.productId, f.addedAt || new Date().toISOString());
    }
    for (const m of (json.messages || [])) {
      db.prepare(`INSERT OR IGNORE INTO messages
        (id,senderId,senderName,receiverId,receiverName,content,productId,productTitle,createdAt,isRead)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
        m.id, m.senderId, m.senderName || '', m.receiverId, m.receiverName || '',
        m.content, m.productId || null, m.productTitle || null,
        m.createdAt || new Date().toISOString(), (m.isRead || m.read) ? 1 : 0
      );
    }
    for (const r of (json.reports || [])) {
      db.prepare(`INSERT OR IGNORE INTO reports
        (id,reporterId,reporterName,targetId,targetType,reason,status,createdAt,handledAt,handledBy)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
        r.id, r.reporterId, r.reporterName || '', r.targetId, r.targetType,
        r.reason || '', r.status || 'pending',
        r.createdAt || new Date().toISOString(), r.handledAt || null, r.handledBy || null
      );
    }
    for (const v of (json.verifyCodes || [])) {
      db.prepare('INSERT OR REPLACE INTO verify_codes (email,code,expiresAt) VALUES (?,?,?)')
        .run(v.email, v.code, v.expiresAt);
    }
    for (const r of (json.reviews || [])) {
      db.prepare(`INSERT OR IGNORE INTO reviews
        (id,productId,sellerId,buyerId,buyerName,rating,comment,createdAt)
        VALUES (?,?,?,?,?,?,?,?)`).run(
        r.id, r.productId, r.sellerId, r.buyerId, r.buyerName || '',
        r.rating, r.comment || '', r.createdAt || new Date().toISOString()
      );
    }
    for (const h of (json.browsingHistory || [])) {
      db.prepare('INSERT OR IGNORE INTO browsing_history (id,userId,productId,viewedAt) VALUES (?,?,?,?)')
        .run(h.id || uuidv4(), h.userId, h.productId, h.viewedAt || new Date().toISOString());
    }
    for (const c of (json.cart || [])) {
      db.prepare('INSERT OR IGNORE INTO cart (id,userId,productId,note,addedAt) VALUES (?,?,?,?,?)')
        .run(c.id || uuidv4(), c.userId, c.productId, c.note || '', c.addedAt || new Date().toISOString());
    }
    for (const l of (json.adminLog || [])) {
      db.prepare(`INSERT INTO admin_log (actorId,actorName,action,targetType,targetId,detail,at)
        VALUES (?,?,?,?,?,?,?)`).run(
        l.actorId, l.actorName || '', l.action, l.targetType, l.targetId, l.detail || '', l.at
      );
    }
  });
  tx();
  // archive the legacy file so we don't re-import next boot
  try { fs.renameSync(LEGACY_JSON, LEGACY_JSON + '.imported'); } catch {}
  console.log('[DB] migration complete, legacy file archived');
  return true;
}
migrateFromJson();

// store is mutated in-place so other modules' references stay valid
const store = loadAll();
function reload() {
  const fresh = loadAll();
  for (const k of Object.keys(store)) delete store[k];
  Object.assign(store, fresh);
  return store;
}

// ---------- save: full snapshot persisted in one transaction ----------
// not the most write-efficient, but consistent & atomic; for this dataset
// scale (hundreds of rows) it runs in well under 10ms.
const saveTx = db.transaction(() => {
  db.exec('DELETE FROM users; DELETE FROM products; DELETE FROM messages; DELETE FROM reports; DELETE FROM favorites; DELETE FROM verify_codes; DELETE FROM reviews; DELETE FROM browsing_history; DELETE FROM cart; DELETE FROM admin_log;');

  const insUser = db.prepare(`INSERT INTO users
    (id,username,email,password,role,verified,banned,lastLoginAt,createdAt)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  for (const u of store.users) {
    insUser.run(u.id, u.username, u.email, u.password, u.role || 'user',
      u.verified ? 1 : 0, u.banned ? 1 : 0, u.lastLoginAt || null, u.createdAt);
  }

  const insProd = db.prepare(`INSERT INTO products
    (id,title,description,price,category,images,image,condition,brand,purchaseDate,defects,location,tags,sellerId,sellerName,status,viewCount,rejectReason,createdAt,updatedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const p of store.products) {
    insProd.run(p.id, p.title, p.description || '', p.price, p.category || '',
      JSON.stringify(p.images || []), p.image || (p.images && p.images[0]) || '',
      p.condition || 'good', p.brand || '', p.purchaseDate || '',
      p.defects || '', p.location || '', JSON.stringify(p.tags || []),
      p.sellerId, p.sellerName || '', p.status || 'pending',
      p.viewCount || 0, p.rejectReason || null,
      p.createdAt, p.updatedAt || null);
  }

  const insMsg = db.prepare(`INSERT INTO messages
    (id,senderId,senderName,receiverId,receiverName,content,productId,productTitle,createdAt,isRead)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  for (const m of store.messages) {
    insMsg.run(m.id, m.senderId, m.senderName || '', m.receiverId, m.receiverName || '',
      m.content, m.productId || null, m.productTitle || null, m.createdAt, m.isRead ? 1 : 0);
  }

  const insRep = db.prepare(`INSERT INTO reports
    (id,reporterId,reporterName,targetId,targetType,reason,status,createdAt,handledAt,handledBy)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  for (const r of store.reports) {
    insRep.run(r.id, r.reporterId, r.reporterName || '', r.targetId, r.targetType,
      r.reason || '', r.status || 'pending', r.createdAt, r.handledAt || null, r.handledBy || null);
  }

  const insFav = db.prepare('INSERT INTO favorites (userId,productId,addedAt) VALUES (?,?,?)');
  for (const f of store.favorites) insFav.run(f.userId, f.productId, f.addedAt);

  const insVc = db.prepare('INSERT INTO verify_codes (email,code,expiresAt) VALUES (?,?,?)');
  for (const v of store.verifyCodes) insVc.run(v.email, v.code, v.expiresAt);

  const insRev = db.prepare(`INSERT INTO reviews
    (id,productId,sellerId,buyerId,buyerName,rating,comment,createdAt)
    VALUES (?,?,?,?,?,?,?,?)`);
  for (const r of store.reviews) {
    insRev.run(r.id, r.productId, r.sellerId, r.buyerId, r.buyerName || '',
      r.rating, r.comment || '', r.createdAt);
  }

  const insHis = db.prepare('INSERT INTO browsing_history (id,userId,productId,viewedAt) VALUES (?,?,?,?)');
  for (const h of store.browsingHistory) insHis.run(h.id || uuidv4(), h.userId, h.productId, h.viewedAt);

  const insCart = db.prepare('INSERT INTO cart (id,userId,productId,note,addedAt) VALUES (?,?,?,?,?)');
  for (const c of store.cart) insCart.run(c.id || uuidv4(), c.userId, c.productId, c.note || '', c.addedAt);

  const insLog = db.prepare(`INSERT INTO admin_log (actorId,actorName,action,targetType,targetId,detail,at)
    VALUES (?,?,?,?,?,?,?)`);
  for (const l of store.adminLog) {
    insLog.run(l.actorId, l.actorName || '', l.action, l.targetType, l.targetId, l.detail || '', l.at);
  }
});

let pendingSave = null;
function save() {
  // debounce: collapse rapid back-to-back saves into a single transaction
  if (pendingSave) return;
  pendingSave = setImmediate(() => {
    pendingSave = null;
    try { saveTx(); }
    catch (e) { console.error('[DB] save failed:', e.message); }
  });
}

function saveSync() {
  if (pendingSave) { clearImmediate(pendingSave); pendingSave = null; }
  saveTx();
}

// ---------- seed admin + sample products on first run ----------
if (!store.users.find(u => u.id === 'admin-001')) {
  const now = new Date().toISOString();

  store.users.push({
    id: 'admin-001',
    username: config.admin.username,
    email: config.admin.email.toLowerCase(),
    password: hashPassword(config.admin.password),
    role: 'admin',
    verified: true,
    banned: false,
    lastLoginAt: null,
    createdAt: now
  });

  const sampleProducts = [
    { title: 'Dell XPS 13 Laptop', description: 'Used for 1 year, good condition. Battery lasts about 4 hours. Comes with original charger and carry bag.', price: 280, category: 'Electronics', images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop'], condition: 'good', brand: 'Dell', location: 'Carnatic Halls', tags: ['laptop', 'computer'] },
    { title: 'Sony WH-1000XM4 Headphones', description: 'Noise-cancelling headphones, barely used. Comes with case and cables. Bought for £280.', price: 120, category: 'Electronics', images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop'], condition: 'like-new', brand: 'Sony', location: 'Greenbank', tags: ['headphones', 'audio'] },
    { title: 'ACFI101 Accounting Textbook', description: 'UoL official module book. Some highlighting on pages but overall clean and complete.', price: 25, category: 'Books', images: ['https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=600&fit=crop'], condition: 'good', brand: '', location: 'Crown Place', tags: ['accounting', 'ACFI101'] },
    { title: 'Introduction to Python Textbook', description: 'Programming textbook, COMP101. Clean copy with no annotations.', price: 20, category: 'Books', images: ['https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=600&fit=crop'], condition: 'like-new', brand: '', location: 'Vine Court', tags: ['python', 'programming', 'COMP101'] },
    { title: 'Nike Air Max 270 Size 42', description: 'Worn a few times, like new condition. Original box included.', price: 55, category: 'Clothing', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop'], condition: 'like-new', brand: 'Nike', location: 'Carnatic Halls', tags: ['shoes', 'nike', 'trainers'] },
    { title: 'Adidas Waterproof Backpack 30L', description: '30L capacity, laptop compartment, used 2 semesters. Still great condition.', price: 22, category: 'Clothing', images: ['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&h=600&fit=crop'], condition: 'good', brand: 'Adidas', location: 'Greenbank', tags: ['backpack', 'bag'] },
    { title: 'IKEA FORSÅ Desk Lamp', description: 'White desk lamp, adjustable arm. Works perfectly, selling because moving out of halls.', price: 12, category: 'Furniture', images: ['https://images.unsplash.com/photo-1534189668023-c54d7305a752?w=800&h=600&fit=crop'], condition: 'good', brand: 'IKEA', location: 'Crown Place', tags: ['lamp', 'desk', 'ikea'] },
    { title: 'Mini Fridge 40L', description: 'Perfect for student room. Runs quietly, keeps drinks cold. Moving out sale.', price: 45, category: 'Furniture', images: ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&h=600&fit=crop'], condition: 'fair', brand: '', location: 'Vine Court', tags: ['fridge', 'kitchen'] },
    { title: 'Yoga Mat + Resistance Bands', description: 'Purple yoga mat 6mm thick plus set of 5 resistance bands. Used one semester only.', price: 18, category: 'Sports', images: ['https://images.unsplash.com/photo-1601925228717-b8b673b3e52e?w=800&h=600&fit=crop'], condition: 'good', brand: '', location: 'Greenbank', tags: ['yoga', 'fitness', 'gym'] },
    { title: 'Casio fx-991EX Calculator', description: 'Required for engineering/maths modules. Fully functional with fresh batteries.', price: 15, category: 'Stationery', images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop'], condition: 'good', brand: 'Casio', location: 'Carnatic Halls', tags: ['calculator', 'maths', 'engineering'] }
  ];

  for (const p of sampleProducts) {
    store.products.push({
      id: uuidv4(),
      title: p.title, description: p.description, price: p.price, category: p.category,
      images: p.images, image: p.images[0],
      condition: p.condition, brand: p.brand || '', purchaseDate: '', defects: '',
      location: p.location, tags: p.tags,
      sellerId: 'admin-001', sellerName: config.admin.username,
      status: 'approved', viewCount: 0,
      createdAt: now
    });
  }

  saveSync();
  console.log('[DB] SQLite initialised with seed data:', DB_FILE);
} else {
  console.log('[DB] SQLite loaded from', DB_FILE);
}

module.exports = { store, save, saveSync, db, _reload: reload };

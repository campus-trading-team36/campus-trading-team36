const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
  cart: []
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
    console.log('[DB] Loaded data from', DATA_FILE);
  } catch (e) {
    console.warn('[DB] Could not read data file, starting fresh');
    store = { ...defaults };
  }
} else {
  store = { ...defaults };
}

function save() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Save failed:', e.message);
  }
}

if (!store.users.find(u => u.id === 'admin-001')) {
  const now = new Date().toISOString();

  store.users.push({
    id: 'admin-001',
    username: 'admin',
    email: 'admin@liverpool.ac.uk',
    password: 'admin123',
    role: 'admin',
    verified: true,
    createdAt: now
  });

  const sampleProducts = [
    {
      title: 'Dell XPS 13 Laptop',
      description: 'Used for 1 year, good condition. Battery lasts about 4 hours. Comes with original charger and carry bag.',
      price: 280, category: 'Electronics',
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop'],
      condition: 'good', brand: 'Dell', location: 'Carnatic Halls', tags: ['laptop', 'computer']
    },
    {
      title: 'Sony WH-1000XM4 Headphones',
      description: 'Noise-cancelling headphones, barely used. Comes with case and cables. Bought for £280.',
      price: 120, category: 'Electronics',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop'],
      condition: 'like-new', brand: 'Sony', location: 'Greenbank', tags: ['headphones', 'audio']
    },
    {
      title: 'ACFI101 Accounting Textbook',
      description: 'UoL official module book. Some highlighting on pages but overall clean and complete.',
      price: 25, category: 'Books',
      images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop'],
      condition: 'good', brand: '', location: 'Crown Place', tags: ['accounting', 'ACFI101']
    },
    {
      title: 'Introduction to Python Textbook',
      description: 'Programming textbook, COMP101. Clean copy with no annotations.',
      price: 20, category: 'Books',
      images: ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop'],
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
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop'],
      condition: 'good', brand: 'Adidas', location: 'Greenbank', tags: ['backpack', 'bag']
    },
    {
      title: 'IKEA FORSÅ Desk Lamp',
      description: 'White desk lamp, adjustable arm. Works perfectly, selling because moving out of halls.',
      price: 12, category: 'Furniture',
      images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=600&fit=crop'],
      condition: 'good', brand: 'IKEA', location: 'Crown Place', tags: ['lamp', 'desk', 'ikea']
    },
    {
      title: 'Mini Fridge 40L',
      description: 'Perfect for student room. Runs quietly, keeps drinks cold. Moving out sale.',
      price: 45, category: 'Furniture',
      images: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&h=600&fit=crop'],
      condition: 'fair', brand: '', location: 'Vine Court', tags: ['fridge', 'kitchen']
    },
    {
      title: 'Yoga Mat + Resistance Bands',
      description: 'Purple yoga mat 6mm thick plus set of 5 resistance bands. Used one semester only.',
      price: 18, category: 'Sports',
      images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop'],
      condition: 'good', brand: '', location: 'Greenbank', tags: ['yoga', 'fitness', 'gym']
    },
    {
      title: 'Casio fx-991EX Calculator',
      description: 'Required for engineering/maths modules. Fully functional with fresh batteries.',
      price: 15, category: 'Stationery',
      images: ['https://images.unsplash.com/photo-1564939558297-fc396f18e5c7?w=800&h=600&fit=crop'],
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
      sellerName: 'admin',
      status: 'approved',
      viewCount: 0,
      createdAt: now
    });
  }

  save();
  console.log('[DB] Database initialised with seed data');
}

module.exports = { store, save };

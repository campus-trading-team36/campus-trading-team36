// product business logic

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');
const config = require('../config');
const { cleanString, clampInt, clampFloat, stripUnsafe } = require('../utils/validators');

const VALID_CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Furniture', 'Sports', 'Stationery', 'Other'];
const VALID_CONDITIONS = ['new', 'like-new', 'good', 'fair'];
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// in-memory pending view-count increments, flushed every 30s
// stops the JSON file being rewritten on every detail page view
const pendingViewBumps = new Map(); // productId -> count
let viewFlushTimer = null;
function scheduleViewFlush() {
  if (viewFlushTimer) return;
  viewFlushTimer = setTimeout(() => {
    viewFlushTimer = null;
    if (pendingViewBumps.size === 0) return;
    let changed = false;
    for (const [id, n] of pendingViewBumps.entries()) {
      const p = store.products.find(x => x.id === id);
      if (p) { p.viewCount = (p.viewCount || 0) + n; changed = true; }
    }
    pendingViewBumps.clear();
    if (changed) save();
  }, 30 * 1000).unref();
}

// remove on-disk image files for the given product (best effort)
function cleanupImages(product) {
  if (!product || !Array.isArray(product.images)) return;
  for (const url of product.images) {
    if (typeof url !== 'string') continue;
    if (!url.startsWith('/uploads/')) continue;
    const fileName = path.basename(url);
    // basic safety check - no traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) continue;
    const full = path.join(UPLOADS_DIR, fileName);
    fs.unlink(full, err => {
      if (err && err.code !== 'ENOENT') {
        console.warn('[Cleanup] could not delete', full, ':', err.message);
      }
    });
  }
}

function getProducts(query) {
  let result = store.products.filter(p => p.status === 'approved');

  if (query.category && query.category !== 'All') {
    result = result.filter(p => p.category === query.category);
  }

  if (query.keyword) {
    const kw = String(query.keyword).toLowerCase().slice(0, 100);
    result = result.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.description.toLowerCase().includes(kw) ||
      (p.brand && p.brand.toLowerCase().includes(kw)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(kw)))
    );
  }

  if (query.minPrice !== undefined && query.minPrice !== '') {
    const v = clampFloat(query.minPrice, 0, 999999);
    if (v !== null) result = result.filter(p => p.price >= v);
  }
  if (query.maxPrice !== undefined && query.maxPrice !== '') {
    const v = clampFloat(query.maxPrice, 0, 999999);
    if (v !== null) result = result.filter(p => p.price <= v);
  }
  if (query.condition) result = result.filter(p => p.condition === query.condition);
  if (query.location) {
    const loc = String(query.location).toLowerCase();
    result = result.filter(p => p.location && p.location.toLowerCase().includes(loc));
  }

  if (query.sort === 'price_asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (query.sort === 'price_desc') {
    result.sort((a, b) => b.price - a.price);
  } else if (query.sort === 'popular') {
    result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  } else {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // optional pagination - clients that don't pass page/limit get the full list (back-compat)
  const total = result.length;
  if (query.page !== undefined || query.limit !== undefined) {
    const page = clampInt(query.page, 1, 10000, 1);
    const limit = clampInt(query.limit, 1, 100, 24);
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);
    return { success: true, data: result, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  return { success: true, data: result, meta: { total } };
}

function getProductById(id, viewerId) {
  const product = store.products.find(p => p.id === id);
  if (!product) return { success: false, message: 'Product not found' };
  // bump view count off the hot path - batched and flushed every 30s
  if (!viewerId || viewerId !== product.sellerId) {
    pendingViewBumps.set(id, (pendingViewBumps.get(id) || 0) + 1);
    scheduleViewFlush();
    // expose the in-flight count so the response matches what users see
    return {
      success: true,
      data: { ...product, viewCount: (product.viewCount || 0) + (pendingViewBumps.get(id) || 0) }
    };
  }
  return { success: true, data: product };
}

// flush pending view counts now (called on graceful shutdown)
function flushPendingViews() {
  if (pendingViewBumps.size === 0) return;
  for (const [id, n] of pendingViewBumps.entries()) {
    const p = store.products.find(x => x.id === id);
    if (p) p.viewCount = (p.viewCount || 0) + n;
  }
  pendingViewBumps.clear();
  save();
}

function createProduct(userId, userName, data) {
  const title = cleanString(data.title, 100);
  if (!title || title.length < 2) {
    return { success: false, message: 'Title is required (2-100 characters)' };
  }
  const description = stripUnsafe(cleanString(data.description, 2000));

  const price = clampFloat(data.price, 0.01, 99999);
  if (price === null || price < 1) {
    return { success: false, message: 'Price must be between £1 and £99,999' };
  }

  let images = [];
  if (Array.isArray(data.images) && data.images.length > 0) {
    images = data.images.filter(v => typeof v === 'string' && v.length < 500).slice(0, config.maxImagesPerProduct);
  } else if (typeof data.image === 'string' && data.image.length < 500) {
    images = [data.image];
  }
  if (images.length === 0) {
    images = [`https://picsum.photos/seed/${Date.now()}/800/600`];
  }

  let tags = [];
  if (Array.isArray(data.tags)) {
    tags = data.tags.map(t => cleanString(t, 30)).filter(Boolean);
  } else if (typeof data.tags === 'string' && data.tags.trim()) {
    tags = data.tags.split(',').map(t => cleanString(t, 30)).filter(Boolean);
  }
  // dedupe + cap
  tags = [...new Set(tags)].slice(0, 10);

  const product = {
    id: uuidv4(),
    title,
    description,
    price: Math.round(price * 100) / 100,
    category: VALID_CATEGORIES.includes(data.category) ? data.category : 'Other',
    images,
    image: images[0],
    condition: VALID_CONDITIONS.includes(data.condition) ? data.condition : 'good',
    brand: cleanString(data.brand, 50),
    purchaseDate: cleanString(data.purchaseDate, 20),
    defects: stripUnsafe(cleanString(data.defects, 500)),
    location: cleanString(data.location, 100),
    tags,
    sellerId: userId,
    sellerName: userName,
    // moderation: new listings start as pending unless disabled
    status: config.moderationEnabled ? 'pending' : 'approved',
    viewCount: 0,
    createdAt: new Date().toISOString()
  };

  store.products.push(product);
  save();

  return {
    success: true,
    message: config.moderationEnabled
      ? 'Product submitted for review. It will appear once an admin approves it.'
      : 'Product listed successfully',
    data: product
  };
}

function updateProduct(productId, userId, data) {
  const product = store.products.find(p => p.id === productId);
  if (!product) return { success: false, message: 'Product not found' };

  if (product.sellerId !== userId) {
    return { success: false, message: 'You can only edit your own listings' };
  }
  if (product.status === 'sold') {
    return { success: false, message: 'Sold listings cannot be edited' };
  }
  if (product.status === 'removed') {
    return { success: false, message: 'This listing was removed by an admin and cannot be edited' };
  }

  // track if a "material" field changed - those re-trigger moderation
  let materialChange = false;

  if (data.title !== undefined) {
    const t = cleanString(data.title, 100);
    if (!t || t.length < 2) return { success: false, message: 'Title must be 2-100 characters' };
    if (t !== product.title) materialChange = true;
    product.title = t;
  }
  if (data.description !== undefined) {
    const desc = stripUnsafe(cleanString(data.description, 2000));
    if (desc !== product.description) materialChange = true;
    product.description = desc;
  }
  if (data.price !== undefined) {
    const price = clampFloat(data.price, 0.01, 99999);
    if (price === null || price < 1) return { success: false, message: 'Price must be between £1 and £99,999' };
    const rounded = Math.round(price * 100) / 100;
    if (rounded !== product.price) materialChange = true;
    product.price = rounded;
  }
  if (data.category && VALID_CATEGORIES.includes(data.category)) product.category = data.category;
  if (data.condition && VALID_CONDITIONS.includes(data.condition)) product.condition = data.condition;
  if (data.brand !== undefined) product.brand = cleanString(data.brand, 50);
  if (data.purchaseDate !== undefined) product.purchaseDate = cleanString(data.purchaseDate, 20);
  if (data.defects !== undefined) product.defects = stripUnsafe(cleanString(data.defects, 500));
  if (data.location !== undefined) product.location = cleanString(data.location, 100);

  // images: if user supplies new set, the old uploaded files should be cleaned
  if (Array.isArray(data.images) && data.images.length > 0) {
    const newImages = data.images.filter(v => typeof v === 'string' && v.length < 500).slice(0, config.maxImagesPerProduct);
    const removed = (product.images || []).filter(url => !newImages.includes(url));
    if (removed.length > 0) { cleanupImages({ images: removed }); materialChange = true; }
    if (JSON.stringify(newImages) !== JSON.stringify(product.images)) materialChange = true;
    product.images = newImages;
    product.image = newImages[0];
  } else if (typeof data.image === 'string' && data.image.length < 500) {
    if (product.image && product.image !== data.image) { cleanupImages({ images: [product.image] }); materialChange = true; }
    product.images = [data.image];
    product.image = data.image;
  }

  if (data.tags !== undefined) {
    let tags = [];
    if (Array.isArray(data.tags)) tags = data.tags.map(t => cleanString(t, 30)).filter(Boolean);
    else if (typeof data.tags === 'string') tags = data.tags.split(',').map(t => cleanString(t, 30)).filter(Boolean);
    product.tags = [...new Set(tags)].slice(0, 10);
  }

  product.updatedAt = new Date().toISOString();
  // re-trigger moderation only when something material changed
  // (price tweaks/spelling fixes shouldn't keep dropping listings out of the grid)
  const reReview = config.moderationEnabled && materialChange && product.status === 'approved';
  if (reReview) {
    product.status = 'pending';
  }

  save();
  return {
    success: true,
    message: reReview ? 'Product updated and re-submitted for review' : 'Product updated',
    data: product
  };
}

function deleteProduct(productId, user) {
  const idx = store.products.findIndex(p => p.id === productId);
  if (idx === -1) return { success: false, message: 'Product not found' };

  const product = store.products[idx];
  if (product.sellerId !== user.id && user.role !== 'admin') {
    return { success: false, message: 'No permission to delete this product' };
  }

  store.products.splice(idx, 1);

  for (let i = store.favorites.length - 1; i >= 0; i--) {
    if (store.favorites[i].productId === productId) store.favorites.splice(i, 1);
  }
  for (let i = store.cart.length - 1; i >= 0; i--) {
    if (store.cart[i].productId === productId) store.cart.splice(i, 1);
  }
  for (let i = store.browsingHistory.length - 1; i >= 0; i--) {
    if (store.browsingHistory[i].productId === productId) store.browsingHistory.splice(i, 1);
  }

  // remove uploaded image files so they don't pile up
  cleanupImages(product);

  save();
  return { success: true, message: 'Product deleted' };
}

function getUserListings(userId) {
  const result = store.products
    .filter(p => p.sellerId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, data: result };
}

function markAsSold(productId, userId) {
  const product = store.products.find(p => p.id === productId);
  if (!product) return { success: false, message: 'Product not found' };
  if (product.sellerId !== userId) return { success: false, message: 'You can only manage your own listings' };
  if (product.status !== 'approved') return { success: false, message: 'Only approved products can be marked as sold' };

  product.status = 'sold';
  product.soldAt = new Date().toISOString();

  // remove this sold product from everyone's cart so they don't get stuck
  for (let i = store.cart.length - 1; i >= 0; i--) {
    if (store.cart[i].productId === productId) store.cart.splice(i, 1);
  }

  save();
  return { success: true, message: 'Product marked as sold', data: product };
}

function getUserStats(userId) {
  const mine = store.products.filter(p => p.sellerId === userId);
  const favCount = store.favorites.filter(f => f.userId === userId).length;
  const cartCount = store.cart.filter(c => c.userId === userId).length;
  const historyCount = store.browsingHistory.filter(h => h.userId === userId).length;
  return {
    success: true,
    data: {
      total: mine.length,
      approved: mine.filter(p => p.status === 'approved').length,
      pending: mine.filter(p => p.status === 'pending').length,
      sold: mine.filter(p => p.status === 'sold').length,
      favourites: favCount,
      cart: cartCount,
      history: historyCount
    }
  };
}

module.exports = {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getUserListings, markAsSold, getUserStats, flushPendingViews
};

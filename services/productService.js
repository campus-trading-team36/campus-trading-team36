const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');

const VALID_CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Furniture', 'Sports', 'Stationery', 'Other'];
const VALID_CONDITIONS = ['new', 'like-new', 'good', 'fair'];

function getProducts(query) {
  let result = store.products.filter(p => p.status === 'approved');

  if (query.category && query.category !== 'All') {
    result = result.filter(p => p.category === query.category);
  }

  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.description.toLowerCase().includes(kw) ||
      (p.brand && p.brand.toLowerCase().includes(kw)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(kw)))
    );
  }

  if (query.minPrice) result = result.filter(p => p.price >= Number(query.minPrice));
  if (query.maxPrice) result = result.filter(p => p.price <= Number(query.maxPrice));
  if (query.condition) result = result.filter(p => p.condition === query.condition);
  if (query.location) result = result.filter(p => p.location && p.location.toLowerCase().includes(query.location.toLowerCase()));

  if (query.sort === 'price_asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (query.sort === 'price_desc') {
    result.sort((a, b) => b.price - a.price);
  } else if (query.sort === 'popular') {
    result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  } else {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return { success: true, data: result };
}

function getProductById(id) {
  const product = store.products.find(p => p.id === id);
  if (!product) return { success: false, message: 'Product not found' };
  product.viewCount = (product.viewCount || 0) + 1;
  save();
  return { success: true, data: product };
}

function createProduct(userId, userName, data) {
  if (!data.title || !data.price) {
    return { success: false, message: 'Title and price are required' };
  }
  if (data.title.length > 100) {
    return { success: false, message: 'Title too long (max 100 characters)' };
  }

  const price = Number(data.price);
  if (isNaN(price) || price < 1 || price > 99999) {
    return { success: false, message: 'Price must be between £1 and £99,999' };
  }

  let images = [];
  if (Array.isArray(data.images) && data.images.length > 0) {
    images = data.images.filter(Boolean).slice(0, 5);
  } else if (data.image) {
    images = [data.image];
  }
  if (images.length === 0) {
    images = [`https://picsum.photos/seed/${Date.now()}/800/600`];
  }

  let tags = [];
  if (Array.isArray(data.tags)) {
    tags = data.tags.filter(Boolean);
  } else if (typeof data.tags === 'string' && data.tags.trim()) {
    tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  const product = {
    id: uuidv4(),
    title: data.title.trim(),
    description: (data.description || '').trim(),
    price,
    category: VALID_CATEGORIES.includes(data.category) ? data.category : 'Other',
    images,
    image: images[0],
    condition: VALID_CONDITIONS.includes(data.condition) ? data.condition : 'good',
    brand: (data.brand || '').trim(),
    purchaseDate: data.purchaseDate || '',
    defects: (data.defects || '').trim(),
    location: (data.location || '').trim(),
    tags,
    sellerId: userId,
    sellerName: userName,
    status: 'approved',
    viewCount: 0,
    createdAt: new Date().toISOString()
  };

  store.products.push(product);
  save();

  return { success: true, message: 'Product listed successfully', data: product };
}

function updateProduct(productId, userId, data) {
  const product = store.products.find(p => p.id === productId);
  if (!product) return { success: false, message: 'Product not found' };

  if (product.sellerId !== userId) {
    return { success: false, message: 'You can only edit your own listings' };
  }

  if (data.title !== undefined) product.title = data.title.trim();
  if (data.description !== undefined) product.description = data.description.trim();
  if (data.price !== undefined) {
    const price = Number(data.price);
    if (isNaN(price) || price < 1) return { success: false, message: 'Invalid price' };
    product.price = price;
  }
  if (data.category && VALID_CATEGORIES.includes(data.category)) product.category = data.category;
  if (data.condition && VALID_CONDITIONS.includes(data.condition)) product.condition = data.condition;
  if (data.brand !== undefined) product.brand = data.brand.trim();
  if (data.purchaseDate !== undefined) product.purchaseDate = data.purchaseDate;
  if (data.defects !== undefined) product.defects = data.defects.trim();
  if (data.location !== undefined) product.location = data.location.trim();

  if (Array.isArray(data.images) && data.images.length > 0) {
    product.images = data.images.filter(Boolean).slice(0, 5);
    product.image = product.images[0];
  } else if (data.image) {
    product.images = [data.image];
    product.image = data.image;
  }

  if (data.tags !== undefined) {
    if (Array.isArray(data.tags)) {
      product.tags = data.tags.filter(Boolean);
    } else if (typeof data.tags === 'string') {
      product.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  product.updatedAt = new Date().toISOString();

  save();
  return { success: true, message: 'Product updated', data: product };
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

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getUserListings, markAsSold, getUserStats };

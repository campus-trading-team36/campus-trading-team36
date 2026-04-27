// product controller

const productService = require('../services/productService');
const { store, save } = require('../models/db');
const { sessions, extractToken } = require('../middleware/auth');

function list(req, res) {
  const result = productService.getProducts(req.query);
  res.json(result);
}

function detail(req, res) {
  // pass current viewer (if any) so we don't bump the seller's own viewCount
  let viewerId = null;
  const tok = extractToken(req);
  if (tok && sessions[tok]) viewerId = sessions[tok].userId;

  const result = productService.getProductById(req.params.id, viewerId);
  res.status(result.success ? 200 : 404).json(result);
}

function create(req, res) {
  const result = productService.createProduct(req.user.id, req.user.username, req.body);
  res.status(result.success ? 201 : 400).json(result);
}

function update(req, res) {
  const result = productService.updateProduct(req.params.id, req.user.id, req.body);
  if (!result.success) {
    let code = 400;
    if (result.message.includes('only edit')) code = 403;
    else if (result.message.includes('not found')) code = 404;
    return res.status(code).json(result);
  }
  res.json(result);
}

function remove(req, res) {
  const result = productService.deleteProduct(req.params.id, req.user);
  if (!result.success) {
    const code = result.message.includes('No permission') ? 403 : 404;
    return res.status(code).json(result);
  }
  res.json(result);
}

function myListings(req, res) {
  const result = productService.getUserListings(req.user.id);
  res.json(result);
}

// favourites
function addFavorite(req, res) {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

  const product = store.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  if (product.status !== 'approved') {
    return res.status(400).json({ success: false, message: 'Only approved products can be added to favourites' });
  }
  if (product.sellerId === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot favourite your own listing' });
  }

  if (store.favorites.find(f => f.userId === req.user.id && f.productId === productId)) {
    return res.status(409).json({ success: false, message: 'Already in favourites' });
  }

  store.favorites.push({ userId: req.user.id, productId, addedAt: new Date().toISOString() });
  save();
  res.status(201).json({ success: true, message: 'Added to favourites' });
}

function removeFavorite(req, res) {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });
  const idx = store.favorites.findIndex(f => f.userId === req.user.id && f.productId === productId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not in favourites' });
  store.favorites.splice(idx, 1);
  save();
  res.json({ success: true, message: 'Removed from favourites' });
}

function getFavorites(req, res) {
  const favs = store.favorites.filter(f => f.userId === req.user.id);
  const items = favs.map(fav => {
    const product = store.products.find(p => p.id === fav.productId);
    return product ? { ...product, addedAt: fav.addedAt } : null;
  }).filter(Boolean);
  // keep sold products in favourites list (show SOLD badge) so users see why they can't buy
  res.json({ success: true, data: items });
}

function markSold(req, res) {
  const result = productService.markAsSold(req.params.id, req.user.id);
  if (!result.success) {
    const code = result.message.includes('only manage') ? 403 :
      (result.message.includes('not found') ? 404 : 400);
    return res.status(code).json(result);
  }
  res.json(result);
}

function getStats(req, res) {
  const result = productService.getUserStats(req.user.id);
  res.json(result);
}

module.exports = { list, detail, create, update, remove, myListings, markSold, getStats, addFavorite, removeFavorite, getFavorites };

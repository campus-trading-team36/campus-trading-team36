const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');

function addToCart(userId, productId, note) {
  const product = store.products.find(p => p.id === productId);
  if (!product) return { success: false, message: 'Product not found' };
  if (product.status !== 'approved') return { success: false, message: 'Product is not available' };
  if (product.sellerId === userId) return { success: false, message: 'You cannot add your own product to cart' };

  const existing = store.cart.find(c => c.userId === userId && c.productId === productId);
  if (existing) {
    if (note !== undefined) existing.note = note;
    save();
    return { success: true, message: 'Cart updated' };
  }

  store.cart.push({
    id: uuidv4(),
    userId,
    productId,
    note: (note || '').trim(),
    addedAt: new Date().toISOString()
  });
  save();
  return { success: true, message: 'Added to cart' };
}

function removeFromCart(userId, productId) {
  const idx = store.cart.findIndex(c => c.userId === userId && c.productId === productId);
  if (idx === -1) return { success: false, message: 'Not in cart' };
  store.cart.splice(idx, 1);
  save();
  return { success: true, message: 'Removed from cart' };
}

function getCart(userId) {
  const items = store.cart
    .filter(c => c.userId === userId)
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .map(c => {
      const product = store.products.find(p => p.id === c.productId);
      return product ? { ...product, addedAt: c.addedAt, note: c.note } : null;
    })
    .filter(Boolean);
  return { success: true, data: items };
}

function clearCart(userId) {
  store.cart = store.cart.filter(c => c.userId !== userId);
  save();
  return { success: true, message: 'Cart cleared' };
}

module.exports = { addToCart, removeFromCart, getCart, clearCart };

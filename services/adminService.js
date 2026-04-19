// admin service

const { store, save } = require('../models/db');

function getPendingProducts() {
  const result = store.products
    .filter(p => p.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, data: result };
}

function reviewProduct(productId, action, reason) {
  const product = store.products.find(p => p.id === productId);
  if (!product) return { success: false, message: 'Product not found' };

  if (action === 'approve') {
    product.status = 'approved';
    product.rejectReason = undefined;
  } else if (action === 'reject') {
    product.status = 'rejected';
    product.rejectReason = reason || 'Does not meet guidelines';
  } else {
    return { success: false, message: "Action must be 'approve' or 'reject'" };
  }

  save();
  return { success: true, message: `Product ${action}d`, data: product };
}

function getAllUsers() {
  const result = store.users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    verified: u.verified,
    createdAt: u.createdAt
  }));
  return { success: true, data: result };
}

function getStats() {
  return {
    success: true,
    data: {
      totalUsers: store.users.length,
      totalProducts: store.products.length,
      pendingProducts: store.products.filter(p => p.status === 'pending').length,
      approvedProducts: store.products.filter(p => p.status === 'approved').length,
      soldProducts: store.products.filter(p => p.status === 'sold').length,
      pendingReports: store.reports.filter(r => r.status === 'pending').length,
      totalMessages: store.messages.length
    }
  };
}

function getAllProducts() {
  const result = store.products
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, data: result };
}

module.exports = { getPendingProducts, reviewProduct, getAllUsers, getStats, getAllProducts };

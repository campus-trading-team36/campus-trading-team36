const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');

function recordView(userId, productId) {
  // skip phantom entries - product must actually exist
  if (!store.products.find(p => p.id === productId)) return;
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const recent = store.browsingHistory.find(
    h => h.userId === userId && h.productId === productId && h.viewedAt > thirtyMinsAgo
  );
  if (recent) {
    // refresh the timestamp so the user sees the most recent view first
    recent.viewedAt = new Date().toISOString();
    save();
    return;
  }

  store.browsingHistory.push({
    id: uuidv4(),
    userId,
    productId,
    viewedAt: new Date().toISOString()
  });

  if (store.browsingHistory.filter(h => h.userId === userId).length > 100) {
    const userHistory = store.browsingHistory
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
    const toKeep = new Set(userHistory.slice(0, 50).map(h => h.id));
    store.browsingHistory = store.browsingHistory.filter(h => h.userId !== userId || toKeep.has(h.id));
  }

  save();
}

function getBrowsingHistory(userId, limit = 30) {
  const history = store.browsingHistory
    .filter(h => h.userId === userId)
    .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
    .slice(0, limit);

  const items = history.map(h => {
    const product = store.products.find(p => p.id === h.productId);
    return product ? { ...product, viewedAt: h.viewedAt, historyId: h.id } : null;
  }).filter(Boolean);

  return { success: true, data: items };
}

function clearHistory(userId) {
  store.browsingHistory = store.browsingHistory.filter(h => h.userId !== userId);
  save();
  return { success: true, message: 'History cleared' };
}

module.exports = { recordView, getBrowsingHistory, clearHistory };

// 管理员后台相关业务逻辑

const { store, save } = require('../models/db');
const { removeUserSessions } = require('../middleware/auth');

// 记一下管理员都做了啥，方便追溯
function logAction(actorId, actorName, action, targetType, targetId, detail) {
  if (!store.adminLog) store.adminLog = [];
  store.adminLog.push({
    actorId, actorName, action, targetType, targetId,
    detail: detail || '',
    at: new Date().toISOString()
  });
  // 只留最近 500 条，不然 log 会越来越大
  if (store.adminLog.length > 500) {
    store.adminLog.splice(0, store.adminLog.length - 500);
  }
}

function getPendingProducts() {
  const result = store.products
    .filter(p => p.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, data: result };
}

function reviewProduct(productId, action, reason, actor) {
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

  if (actor) logAction(actor.id, actor.username, action, 'product', productId, reason || '');
  save();
  return { success: true, message: action === 'approve' ? 'Product approved' : 'Product rejected', data: product };
}

function getAllUsers() {
  const result = store.users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    verified: u.verified,
    banned: !!u.banned,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt || null
  }));
  return { success: true, data: result };
}

// 封号/解封：被封的用户不能登录也不能收私信
function setUserBanned(targetId, banned, actor) {
  const user = store.users.find(u => u.id === targetId);
  if (!user) return { success: false, message: 'User not found' };
  if (user.role === 'admin') return { success: false, message: 'Cannot ban an admin' };
  user.banned = !!banned;
  if (banned) removeUserSessions(targetId);
  if (actor) logAction(actor.id, actor.username, banned ? 'ban' : 'unban', 'user', targetId, user.username);
  save();
  return { success: true, message: banned ? 'User banned' : 'User unbanned', data: { id: user.id, banned: user.banned } };
}

// 改用户角色，自己不能把自己降级
function setUserRole(targetId, role, actor) {
  const validRoles = ['user', 'admin'];
  if (!validRoles.includes(role)) return { success: false, message: 'Invalid role' };
  const user = store.users.find(u => u.id === targetId);
  if (!user) return { success: false, message: 'User not found' };
  if (actor && actor.id === targetId && role !== 'admin') {
    return { success: false, message: 'You cannot demote yourself' };
  }
  if (user.id === 'admin-001' && role !== 'admin') {
    return { success: false, message: 'The seed admin cannot be demoted' };
  }
  user.role = role;
  if (actor) logAction(actor.id, actor.username, 'setRole:' + role, 'user', targetId, user.username);
  save();
  return { success: true, message: `Role set to ${role}`, data: { id: user.id, role } };
}

// 真删一个用户，他的所有数据也一起清掉，慎用
function deleteUser(targetId, actor) {
  const idx = store.users.findIndex(u => u.id === targetId);
  if (idx === -1) return { success: false, message: 'User not found' };
  const user = store.users[idx];
  if (user.role === 'admin') return { success: false, message: 'Cannot delete an admin account' };

  store.users.splice(idx, 1);
  // 关联数据全清掉
  store.products = store.products.filter(p => p.sellerId !== targetId);
  store.favorites = store.favorites.filter(f => f.userId !== targetId);
  store.cart = store.cart.filter(c => c.userId !== targetId);
  store.browsingHistory = store.browsingHistory.filter(h => h.userId !== targetId);
  store.reviews = store.reviews.filter(r => r.buyerId !== targetId && r.sellerId !== targetId);
  // 消息和举报留下来做审计，但发送/接收人显示为 [deleted]
  for (const m of store.messages) {
    if (m.senderId === targetId) m.senderName = '[deleted]';
    if (m.receiverId === targetId) m.receiverName = '[deleted]';
  }

  removeUserSessions(targetId);
  if (actor) logAction(actor.id, actor.username, 'delete', 'user', targetId, user.username);
  save();
  return { success: true, message: 'User deleted' };
}

function getStats() {
  return {
    success: true,
    data: {
      totalUsers: store.users.length,
      bannedUsers: store.users.filter(u => u.banned).length,
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
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, data: result };
}

function getAuditLog(limit) {
  const log = store.adminLog || [];
  const n = Math.max(1, Math.min(parseInt(limit, 10) || 100, 500));
  return { success: true, data: log.slice(-n).reverse() };
}

module.exports = {
  getPendingProducts, reviewProduct, getAllUsers, getStats, getAllProducts,
  setUserBanned, setUserRole, deleteUser, getAuditLog
};

// 站内信相关业务逻辑

const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');
const { cleanString, stripUnsafe, clampInt } = require('../utils/validators');

function sendMessage(senderId, senderName, receiverId, content, productId) {
  if (!receiverId || !content) {
    return { success: false, message: 'Receiver and content are required' };
  }
  const text = stripUnsafe(cleanString(content, 500));
  if (!text) {
    return { success: false, message: 'Message content is empty' };
  }
  if (senderId === receiverId) {
    return { success: false, message: 'Cannot send message to yourself' };
  }

  const receiver = store.users.find(u => u.id === receiverId);
  if (!receiver) return { success: false, message: 'Receiver not found' };
  if (receiver.banned) return { success: false, message: 'This user can no longer receive messages' };

  // 已经被删的商品不允许再发消息
  if (productId) {
    const p = store.products.find(x => x.id === productId);
    if (!p) return { success: false, message: 'Referenced product not found' };
  }

  const msg = {
    id: uuidv4(),
    senderId,
    senderName,
    receiverId,
    receiverName: receiver.username,
    content: text,
    productId: productId || null,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  store.messages.push(msg);
  save();

  return { success: true, message: 'Message sent', data: msg };
}

function getConversations(userId) {
  // 一次性建好用户查找表，比每条消息 .find 一次快很多
  const userMap = new Map();
  for (const u of store.users) userMap.set(u.id, u.username);

  const convMap = {};
  for (const msg of store.messages) {
    if (msg.senderId !== userId && msg.receiverId !== userId) continue;
    const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const otherName = userMap.get(otherId) || (msg.senderId === userId ? msg.receiverName : msg.senderName) || 'Unknown';

    if (!convMap[otherId]) {
      convMap[otherId] = { partnerId: otherId, partnerName: otherName, lastMessage: msg, unreadCount: 0 };
    } else {
      // 用最新的名字（万一对方改过用户名）
      convMap[otherId].partnerName = otherName;
    }

    if (new Date(msg.createdAt) > new Date(convMap[otherId].lastMessage.createdAt)) {
      convMap[otherId].lastMessage = msg;
    }

    if (msg.receiverId === userId && !msg.isRead) {
      convMap[otherId].unreadCount++;
    }
  }

  const result = Object.values(convMap);
  result.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
  return { success: true, data: result };
}

function getChatHistory(userId, partnerId, opts) {
  if (!partnerId) return { success: false, message: 'partnerId required' };
  // 检查对方是真实存在的用户，避免别人用伪造的 id 探别人的消息
  if (!store.users.find(u => u.id === partnerId)) {
    return { success: false, message: 'Partner not found' };
  }

  const limit = clampInt((opts && opts.limit) || 200, 1, 500, 200);

  let history = store.messages.filter(m =>
    (m.senderId === userId && m.receiverId === partnerId) ||
    (m.senderId === partnerId && m.receiverId === userId)
  );

  // 把发给我的消息标成已读（我自己发的就不动）
  let changed = false;
  for (const msg of history) {
    if (msg.receiverId === userId && !msg.isRead) {
      msg.isRead = true;
      changed = true;
    }
  }
  if (changed) save();

  history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  // 太老的聊天记录就不返回了，免得一次返回太多
  if (history.length > limit) history = history.slice(history.length - limit);

  return { success: true, data: history };
}

function getUnreadCount(userId) {
  let count = 0;
  for (const m of store.messages) {
    if (m.receiverId === userId && !m.isRead) count++;
  }
  return { success: true, data: { unread: count } };
}

// 一次把跟某个人的全部未读都标成已读（打开聊天页时用）
function markConversationRead(userId, partnerId) {
  if (!partnerId) return { success: false, message: 'partnerId required' };
  if (!store.users.find(u => u.id === partnerId)) {
    return { success: false, message: 'Partner not found' };
  }
  let changed = 0;
  for (const m of store.messages) {
    if (m.senderId === partnerId && m.receiverId === userId && !m.isRead) {
      m.isRead = true;
      changed++;
    }
  }
  if (changed) save();
  return { success: true, message: `${changed} message(s) marked read`, data: { changed } };
}

module.exports = {
  sendMessage, getConversations, getChatHistory, getUnreadCount, markConversationRead
};

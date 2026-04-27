// message service

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

  // refuse messaging about a deleted/removed product
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
    read: false,
    createdAt: new Date().toISOString()
  };

  store.messages.push(msg);
  save();

  return { success: true, message: 'Message sent', data: msg };
}

function getConversations(userId) {
  // build a single user lookup map up front - much faster than .find per message
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
      // keep partner name fresh in case it was renamed
      convMap[otherId].partnerName = otherName;
    }

    if (new Date(msg.createdAt) > new Date(convMap[otherId].lastMessage.createdAt)) {
      convMap[otherId].lastMessage = msg;
    }

    if (msg.receiverId === userId && !msg.read) {
      convMap[otherId].unreadCount++;
    }
  }

  const result = Object.values(convMap);
  result.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
  return { success: true, data: result };
}

function getChatHistory(userId, partnerId, opts) {
  if (!partnerId) return { success: false, message: 'partnerId required' };
  // make sure partner is real - prevents crafted ids fishing for messages
  if (!store.users.find(u => u.id === partnerId)) {
    return { success: false, message: 'Partner not found' };
  }

  const limit = clampInt((opts && opts.limit) || 200, 1, 500, 200);

  let history = store.messages.filter(m =>
    (m.senderId === userId && m.receiverId === partnerId) ||
    (m.senderId === partnerId && m.receiverId === userId)
  );

  // mark messages as read (only those addressed to me)
  let changed = false;
  for (const msg of history) {
    if (msg.receiverId === userId && !msg.read) {
      msg.read = true;
      changed = true;
    }
  }
  if (changed) save();

  history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  // keep the last `limit` messages so old chats don't blow up the response
  if (history.length > limit) history = history.slice(history.length - limit);

  return { success: true, data: history };
}

function getUnreadCount(userId) {
  let count = 0;
  for (const m of store.messages) {
    if (m.receiverId === userId && !m.read) count++;
  }
  return { success: true, data: { unread: count } };
}

// mark every message from a given partner as read - used when opening a conversation
function markConversationRead(userId, partnerId) {
  if (!partnerId) return { success: false, message: 'partnerId required' };
  if (!store.users.find(u => u.id === partnerId)) {
    return { success: false, message: 'Partner not found' };
  }
  let changed = 0;
  for (const m of store.messages) {
    if (m.senderId === partnerId && m.receiverId === userId && !m.read) {
      m.read = true;
      changed++;
    }
  }
  if (changed) save();
  return { success: true, message: `${changed} message(s) marked read`, data: { changed } };
}

module.exports = {
  sendMessage, getConversations, getChatHistory, getUnreadCount, markConversationRead
};

// message service

const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');

function sendMessage(senderId, senderName, receiverId, content, productId) {
  if (!receiverId || !content) {
    return { success: false, message: 'Receiver and content are required' };
  }
  if (content.length > 500) {
    return { success: false, message: 'Message too long (max 500 characters)' };
  }
  if (senderId === receiverId) {
    return { success: false, message: 'Cannot send message to yourself' };
  }

  const receiver = store.users.find(u => u.id === receiverId);
  if (!receiver) return { success: false, message: 'Receiver not found' };

  const msg = {
    id: uuidv4(),
    senderId,
    senderName,
    receiverId,
    receiverName: receiver.username,
    content: content.trim(),
    productId: productId || null,
    read: false,
    createdAt: new Date().toISOString()
  };

  store.messages.push(msg);
  save();

  return { success: true, message: 'Message sent', data: msg };
}

function getConversations(userId) {
  const related = store.messages.filter(m => m.senderId === userId || m.receiverId === userId);

  const convMap = {};
  related.forEach(msg => {
    const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const otherName = msg.senderId === userId ? msg.receiverName : msg.senderName;

    if (!convMap[otherId]) {
      convMap[otherId] = { partnerId: otherId, partnerName: otherName, lastMessage: msg, unreadCount: 0 };
    }

    if (new Date(msg.createdAt) > new Date(convMap[otherId].lastMessage.createdAt)) {
      convMap[otherId].lastMessage = msg;
    }

    if (msg.receiverId === userId && !msg.read) {
      convMap[otherId].unreadCount++;
    }
  });

  const result = Object.values(convMap);
  result.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
  return { success: true, data: result };
}

function getChatHistory(userId, partnerId) {
  const history = store.messages.filter(m =>
    (m.senderId === userId && m.receiverId === partnerId) ||
    (m.senderId === partnerId && m.receiverId === userId)
  );

  // mark messages as read
  let changed = false;
  history.forEach(msg => {
    if (msg.receiverId === userId && !msg.read) {
      msg.read = true;
      changed = true;
    }
  });
  if (changed) save();

  history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return { success: true, data: history };
}

module.exports = { sendMessage, getConversations, getChatHistory };

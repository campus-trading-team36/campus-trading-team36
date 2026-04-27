// Message controller - handles messaging endpoints

const messageService = require("../services/messageService");

// POST /api/messages/send
function send(req, res) {
  const { receiverId, content, productId } = req.body;
  const result = messageService.sendMessage(
    req.user.id,
    req.user.username,
    receiverId,
    content,
    productId
  );
  const status = result.success ? 201 : 400;
  res.status(status).json(result);
}

// GET /api/messages/conversations
function conversations(req, res) {
  const result = messageService.getConversations(req.user.id);
  res.json(result);
}

// GET /api/messages/chat/:partnerId?limit=200
function chatHistory(req, res) {
  const result = messageService.getChatHistory(req.user.id, req.params.partnerId, { limit: req.query.limit });
  const status = result.success ? 200 : (result.message && result.message.includes('not found') ? 404 : 400);
  res.status(status).json(result);
}

// GET /api/messages/unread
function unread(req, res) {
  const result = messageService.getUnreadCount(req.user.id);
  res.json(result);
}

// POST /api/messages/read/:partnerId - mark a whole conversation as read in one go
function markRead(req, res) {
  const result = messageService.markConversationRead(req.user.id, req.params.partnerId);
  const status = result.success ? 200 : (result.message && result.message.includes('not found') ? 404 : 400);
  res.status(status).json(result);
}

module.exports = {
  send,
  conversations,
  chatHistory,
  unread,
  markRead
};

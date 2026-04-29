// 站内信相关接口的 controller

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

// POST /api/messages/read/:partnerId - 一次把和某人的对话全标记成已读
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

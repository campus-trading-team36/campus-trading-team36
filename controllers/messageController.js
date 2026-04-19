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

// GET /api/messages/chat/:partnerId
function chatHistory(req, res) {
  const result = messageService.getChatHistory(req.user.id, req.params.partnerId);
  res.json(result);
}

module.exports = {
  send,
  conversations,
  chatHistory
};

const express = require("express");
const router = express.Router();
const msgCtrl = require("../controllers/messageController");
const { requireAuth } = require("../middleware/auth");

router.post("/send", requireAuth, msgCtrl.send);
router.get("/conversations", requireAuth, msgCtrl.conversations);
router.get("/chat/:partnerId", requireAuth, msgCtrl.chatHistory);

module.exports = router;

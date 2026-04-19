const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productController");
const { requireAuth } = require("../middleware/auth");

// Public routes
router.get("/", productCtrl.list);
router.get("/:id", productCtrl.detail);

// Protected routes
router.post("/", requireAuth, productCtrl.create);
router.put("/:id", requireAuth, productCtrl.update);
router.put("/:id/sold", requireAuth, productCtrl.markSold);
router.delete("/:id", requireAuth, productCtrl.remove);

module.exports = router;

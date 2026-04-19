const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/auth");

// All admin routes require admin role
router.get("/stats", requireAdmin, adminCtrl.stats);
router.get("/products/pending", requireAdmin, adminCtrl.pendingProducts);
router.get("/products/all", requireAdmin, adminCtrl.allProducts);
router.post("/products/:id/review", requireAdmin, adminCtrl.reviewProduct);
router.get("/users", requireAdmin, adminCtrl.allUsers);
router.get("/reports", requireAdmin, adminCtrl.allReports);
router.post("/reports/:id/handle", requireAdmin, adminCtrl.handleReport);

module.exports = router;

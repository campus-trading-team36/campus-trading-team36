const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/auth");

// All admin routes require admin role
router.get("/stats", requireAdmin, adminCtrl.stats);
router.get("/log", requireAdmin, adminCtrl.auditLog);

router.get("/products/pending", requireAdmin, adminCtrl.pendingProducts);
router.get("/products/all", requireAdmin, adminCtrl.allProducts);
router.post("/products/:id/review", requireAdmin, adminCtrl.reviewProduct);

router.get("/users", requireAdmin, adminCtrl.allUsers);
router.post("/users/:id/ban", requireAdmin, adminCtrl.banUser);
router.post("/users/:id/role", requireAdmin, adminCtrl.setUserRole);
router.delete("/users/:id", requireAdmin, adminCtrl.deleteUser);

router.get("/reports", requireAdmin, adminCtrl.allReports);
router.post("/reports/:id/handle", requireAdmin, adminCtrl.handleReport);

module.exports = router;

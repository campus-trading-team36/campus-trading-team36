const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productController");
const { requireAuth } = require("../middleware/auth");

router.post("/add", requireAuth, productCtrl.addFavorite);
router.post("/remove", requireAuth, productCtrl.removeFavorite);
router.get("/", requireAuth, productCtrl.getFavorites);

module.exports = router;

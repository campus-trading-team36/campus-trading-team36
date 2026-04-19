const express = require("express");
const router = express.Router();
const reportCtrl = require("../controllers/reportController");
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, reportCtrl.create);

module.exports = router;

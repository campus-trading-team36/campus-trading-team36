const express = require('express');
const router = express.Router();
const reviewCtrl = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, reviewCtrl.addReview);
router.get('/seller/:sellerId', reviewCtrl.getSellerReviews);
router.get('/product/:productId', reviewCtrl.getProductReviews);

module.exports = router;

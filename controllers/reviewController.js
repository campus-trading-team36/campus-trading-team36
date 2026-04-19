const reviewService = require('../services/reviewService');

function addReview(req, res) {
  const { productId, rating, comment } = req.body;
  if (!productId || !rating) return res.status(400).json({ success: false, message: 'productId and rating are required' });
  const result = reviewService.createReview(productId, req.user.id, req.user.username, rating, comment);
  res.status(result.success ? 201 : 400).json(result);
}

function getSellerReviews(req, res) {
  const result = reviewService.getSellerReviews(req.params.sellerId);
  res.json(result);
}

function getProductReviews(req, res) {
  const result = reviewService.getProductReviews(req.params.productId);
  res.json(result);
}

module.exports = { addReview, getSellerReviews, getProductReviews };

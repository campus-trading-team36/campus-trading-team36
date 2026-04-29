// 卖家评价相关业务逻辑

const { v4: uuidv4 } = require('uuid');
const { store, save } = require('../models/db');
const { cleanString, stripUnsafe } = require('../utils/validators');

function createReview(productId, buyerId, buyerName, rating, comment) {
  const product = store.products.find(p => p.id === productId);
  if (!product) return { success: false, message: 'Product not found' };
  if (product.sellerId === buyerId) return { success: false, message: 'You cannot review yourself' };

  const existing = store.reviews.find(r => r.productId === productId && r.buyerId === buyerId);
  if (existing) return { success: false, message: 'You have already reviewed this product' };

  const r = parseInt(rating);
  if (isNaN(r) || r < 1 || r > 5) return { success: false, message: 'Rating must be 1-5' };

  const cleanComment = stripUnsafe(cleanString(comment, 500));

  const review = {
    id: uuidv4(),
    productId,
    buyerId,
    buyerName,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    rating: r,
    comment: cleanComment,
    createdAt: new Date().toISOString()
  };

  store.reviews.push(review);
  save();
  return { success: true, message: 'Review submitted', data: review };
}

function getSellerReviews(sellerId) {
  const reviews = store.reviews
    .filter(r => r.sellerId === sellerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (reviews.length === 0) {
    return { success: true, data: { avgRating: 0, count: 0, reviews: [] } };
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return {
    success: true,
    data: {
      avgRating: Math.round(avg * 10) / 10,
      count: reviews.length,
      reviews
    }
  };
}

function getProductReviews(productId) {
  const reviews = store.reviews
    .filter(r => r.productId === productId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, data: reviews };
}

module.exports = { createReview, getSellerReviews, getProductReviews };

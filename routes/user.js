const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const productCtrl = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');
const browsingService = require('../services/browsingService');
const cartService = require('../services/cartService');

router.post('/verify', userCtrl.sendVerifyCode);
router.post('/register', userCtrl.register);
router.post('/login', userCtrl.login);

router.post('/logout', requireAuth, userCtrl.logout);
router.get('/profile', requireAuth, userCtrl.getProfile);
router.get('/listings', requireAuth, productCtrl.myListings);
router.get('/stats', requireAuth, productCtrl.getStats);

router.get('/history', requireAuth, (req, res) => {
  const result = browsingService.getBrowsingHistory(req.user.id);
  res.json(result);
});
router.delete('/history', requireAuth, (req, res) => {
  const result = browsingService.clearHistory(req.user.id);
  res.json(result);
});

router.post('/history', requireAuth, (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: 'productId required' });
  browsingService.recordView(req.user.id, productId);
  res.json({ success: true });
});

router.get('/cart', requireAuth, (req, res) => {
  const result = cartService.getCart(req.user.id);
  res.json(result);
});
router.post('/cart', requireAuth, (req, res) => {
  const { productId, note } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: 'productId required' });
  const result = cartService.addToCart(req.user.id, productId, note);
  res.status(result.success ? 200 : 400).json(result);
});
router.delete('/cart/:productId', requireAuth, (req, res) => {
  const result = cartService.removeFromCart(req.user.id, req.params.productId);
  res.json(result);
});
router.delete('/cart', requireAuth, (req, res) => {
  const result = cartService.clearCart(req.user.id);
  res.json(result);
});

module.exports = router;

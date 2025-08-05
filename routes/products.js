const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

// Phase 3: Product Advisory Integration Routes
router.get('/catalog', productController.getCatalog);
router.get('/catalog/:category', productController.getCategoryProducts);
router.get('/product/:productId', productController.getProduct);
router.post('/recommendations', productController.getRecommendations);
router.post('/advice/verify', authMiddleware, productController.verifyAdvice);
router.post('/advice/approve', authMiddleware, productController.approveAdvice);
router.get('/search', productController.searchProducts);

module.exports = router;
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

// Phase 4: Purchase & Payment Processing Routes
router.post('/checkout/initialize', authMiddleware, paymentController.initializeCheckout);
router.post('/checkout/process', authMiddleware, paymentController.processPayment);
router.post('/checkout/confirm', authMiddleware, paymentController.confirmOrder);
router.get('/order/:orderId', authMiddleware, paymentController.getOrder);
router.get('/orders/:accountId', authMiddleware, paymentController.getOrders);
router.post('/refund/:orderId', authMiddleware, paymentController.processRefund);

module.exports = router;
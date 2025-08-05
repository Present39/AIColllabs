const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/auth');

// Phase 2: Account Management Routes
router.post('/create', accountController.createAccount);
router.post('/complete-profile', accountController.completeProfile);
router.get('/profile/:accountId', authMiddleware, accountController.getProfile);
router.put('/profile/:accountId', authMiddleware, accountController.updateProfile);
router.post('/verify-age', accountController.verifyAge);
router.post('/parental-consent', accountController.handleParentalConsent);
router.get('/advice/:accountId', authMiddleware, accountController.getStoredAdvice);
router.post('/advice/:accountId', authMiddleware, accountController.storeAdvice);

module.exports = router;
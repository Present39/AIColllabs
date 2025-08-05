const express = require('express');
const router = express.Router();
const claudetteController = require('../controllers/claudetteController');

// Phase 1: Claudette Interaction Engine Routes
router.post('/welcome', claudetteController.handleWelcome);
router.post('/account-decision', claudetteController.handleAccountDecision);
router.post('/browse-mode', claudetteController.handleBrowseMode);
router.post('/account-mode', claudetteController.handleAccountMode);
router.post('/conversation', claudetteController.handleConversation);
router.get('/session/:sessionId', claudetteController.getSession);

module.exports = router;
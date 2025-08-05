const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');

// Phase 5: Child Safety & Compliance Routes
router.post('/age-verify', complianceController.verifyAge);
router.post('/parental-consent/initiate', complianceController.initiateParentalConsent);
router.post('/parental-consent/verify', complianceController.verifyParentalConsent);
router.get('/parental-consent/:token', complianceController.getConsentForm);
router.post('/parental-consent/:token', complianceController.submitConsent);
router.get('/compliance-status/:accountId', complianceController.getComplianceStatus);

module.exports = router;
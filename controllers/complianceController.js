const complianceService = require('../services/complianceService');

class ComplianceController {
  async verifyAge(req, res) {
    try {
      const { age, birthDate } = req.body;
      const verification = await complianceService.verifyAge(age, birthDate);
      res.json(verification);
    } catch (error) {
      console.error('Age verification error:', error);
      res.status(500).json({ error: 'Failed to verify age' });
    }
  }

  async initiateParentalConsent(req, res) {
    try {
      const { accountId } = req.body;
      const account = req.account; // From auth middleware
      
      const consent = await complianceService.initiateParentalConsent(account);
      res.json(consent);
    } catch (error) {
      console.error('Initiate parental consent error:', error);
      res.status(500).json({ error: 'Failed to initiate parental consent' });
    }
  }

  async verifyParentalConsent(req, res) {
    try {
      const { consentToken, accountId } = req.body;
      const consent = await complianceService.getConsentRequest(consentToken);
      
      if (!consent) {
        return res.status(404).json({ error: 'Consent request not found' });
      }

      res.json({
        valid: consent.accountId === accountId && consent.status === 'pending',
        consent
      });
    } catch (error) {
      console.error('Verify parental consent error:', error);
      res.status(500).json({ error: 'Failed to verify parental consent' });
    }
  }

  async getConsentForm(req, res) {
    try {
      const { token } = req.params;
      const consentRequest = await complianceService.getConsentRequest(token);
      
      if (!consentRequest) {
        return res.status(404).json({ error: 'Consent request not found' });
      }

      const formData = complianceService.generateConsentForm(consentRequest);
      res.json({ consentRequest, formData });
    } catch (error) {
      console.error('Get consent form error:', error);
      res.status(500).json({ error: 'Failed to get consent form' });
    }
  }

  async submitConsent(req, res) {
    try {
      const { token } = req.params;
      const { approved, parentInfo } = req.body;
      
      const consentRequest = await complianceService.getConsentRequest(token);
      if (!consentRequest) {
        return res.status(404).json({ error: 'Consent request not found' });
      }

      const result = await complianceService.processParentalConsent(
        consentRequest.accountId,
        token,
        approved,
        parentInfo
      );

      res.json(result);
    } catch (error) {
      console.error('Submit consent error:', error);
      res.status(500).json({ error: 'Failed to submit consent' });
    }
  }

  async getComplianceStatus(req, res) {
    try {
      const { accountId } = req.params;
      const status = await complianceService.getComplianceStatus(accountId);
      res.json(status);
    } catch (error) {
      console.error('Get compliance status error:', error);
      res.status(500).json({ error: 'Failed to get compliance status' });
    }
  }
}

module.exports = new ComplianceController();
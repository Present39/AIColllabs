const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const accountService = require('../services/accountService');
const complianceService = require('../services/complianceService');

class AccountController {
  // Phase 2: Profile creation during conversation
  async createAccount(req, res) {
    try {
      const { sessionId, firstName, age, email, interests, parentEmail } = req.body;
      
      // Age verification
      const ageVerification = await complianceService.verifyAge(age);
      
      const accountData = {
        id: uuidv4(),
        sessionId,
        firstName,
        age,
        email,
        interests: interests || [],
        parentEmail: ageVerification.requiresParentalConsent ? parentEmail : null,
        requiresParentalConsent: ageVerification.requiresParentalConsent,
        status: ageVerification.requiresParentalConsent ? 'pending-parental-consent' : 'active',
        createdAt: new Date(),
        claudetteAdvice: []
      };

      const account = await accountService.createAccount(accountData);
      
      // If parental consent is required, trigger the workflow
      if (ageVerification.requiresParentalConsent) {
        await complianceService.initiateParentalConsent(account);
      }

      // Generate token for authenticated requests
      const token = jwt.sign(
        { accountId: account.id, sessionId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        account: {
          id: account.id,
          firstName: account.firstName,
          age: account.age,
          status: account.status,
          requiresParentalConsent: account.requiresParentalConsent
        },
        token,
        message: ageVerification.requiresParentalConsent 
          ? "Account aangemaakt! We hebben een e-mail naar je ouders/verzorgers gestuurd voor toestemming."
          : "Welkom! Je account is succesvol aangemaakt."
      });
    } catch (error) {
      console.error('Account creation error:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  }

  // Complete profile with additional information
  async completeProfile(req, res) {
    try {
      const { accountId, additionalInfo } = req.body;
      
      const updatedAccount = await accountService.updateAccount(accountId, {
        ...additionalInfo,
        profileComplete: true,
        updatedAt: new Date()
      });

      res.json({
        account: updatedAccount,
        message: "Profiel succesvol voltooid!"
      });
    } catch (error) {
      console.error('Profile completion error:', error);
      res.status(500).json({ error: 'Failed to complete profile' });
    }
  }

  // Get account profile
  async getProfile(req, res) {
    try {
      const { accountId } = req.params;
      const account = await accountService.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Remove sensitive information
      const { password, parentEmail, ...safeProfile } = account;
      
      res.json(safeProfile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to retrieve profile' });
    }
  }

  // Update account profile
  async updateProfile(req, res) {
    try {
      const { accountId } = req.params;
      const updates = req.body;
      
      // Validate updates don't include sensitive fields
      const allowedUpdates = ['firstName', 'interests', 'preferences', 'learningGoals'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      const updatedAccount = await accountService.updateAccount(accountId, {
        ...filteredUpdates,
        updatedAt: new Date()
      });

      res.json({
        account: updatedAccount,
        message: "Profiel succesvol bijgewerkt!"
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  // Age verification endpoint
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

  // Handle parental consent
  async handleParentalConsent(req, res) {
    try {
      const { accountId, consentToken, approved } = req.body;
      
      const result = await complianceService.processParentalConsent(
        accountId, 
        consentToken, 
        approved
      );

      if (result.success) {
        await accountService.updateAccount(accountId, {
          status: approved ? 'active' : 'parental-consent-denied',
          parentalConsentDate: new Date()
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Parental consent error:', error);
      res.status(500).json({ error: 'Failed to process parental consent' });
    }
  }

  // Get stored Claudette advice for account
  async getStoredAdvice(req, res) {
    try {
      const { accountId } = req.params;
      const advice = await accountService.getAdvice(accountId);
      
      res.json({ advice });
    } catch (error) {
      console.error('Get advice error:', error);
      res.status(500).json({ error: 'Failed to retrieve advice' });
    }
  }

  // Store Claudette's advice for account
  async storeAdvice(req, res) {
    try {
      const { accountId } = req.params;
      const { advice, category, products, sessionId } = req.body;
      
      const adviceRecord = {
        id: uuidv4(),
        advice,
        category,
        products: products || [],
        sessionId,
        timestamp: new Date(),
        status: 'pending-review'
      };

      await accountService.addAdvice(accountId, adviceRecord);
      
      res.json({
        message: "Advies succesvol opgeslagen!",
        adviceId: adviceRecord.id
      });
    } catch (error) {
      console.error('Store advice error:', error);
      res.status(500).json({ error: 'Failed to store advice' });
    }
  }
}

module.exports = new AccountController();
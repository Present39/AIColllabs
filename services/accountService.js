// Account Service for managing user accounts and profiles
class AccountService {
  constructor() {
    this.accounts = new Map();
  }

  async createAccount(accountData) {
    this.accounts.set(accountData.id, accountData);
    return this.accounts.get(accountData.id);
  }

  async getAccount(accountId) {
    return this.accounts.get(accountId);
  }

  async updateAccount(accountId, updates) {
    const account = this.accounts.get(accountId);
    if (account) {
      Object.assign(account, updates);
      this.accounts.set(accountId, account);
    }
    return account;
  }

  async deleteAccount(accountId) {
    return this.accounts.delete(accountId);
  }

  async getAccountBySession(sessionId) {
    return Array.from(this.accounts.values()).find(acc => acc.sessionId === sessionId);
  }

  async getAccountByEmail(email) {
    return Array.from(this.accounts.values()).find(acc => acc.email === email);
  }

  // Advice management
  async getAdvice(accountId) {
    const account = this.accounts.get(accountId);
    return account ? account.claudetteAdvice || [] : [];
  }

  async addAdvice(accountId, adviceRecord) {
    const account = this.accounts.get(accountId);
    if (account) {
      if (!account.claudetteAdvice) {
        account.claudetteAdvice = [];
      }
      account.claudetteAdvice.push(adviceRecord);
      this.accounts.set(accountId, account);
    }
    return account;
  }

  async updateAdviceStatus(accountId, adviceId, status) {
    const account = this.accounts.get(accountId);
    if (account && account.claudetteAdvice) {
      const advice = account.claudetteAdvice.find(a => a.id === adviceId);
      if (advice) {
        advice.status = status;
        advice.updatedAt = new Date();
        this.accounts.set(accountId, account);
      }
    }
    return account;
  }

  // Profile completion tracking
  async checkProfileCompleteness(accountId) {
    const account = this.accounts.get(accountId);
    if (!account) return null;

    const requiredFields = ['firstName', 'age', 'interests'];
    const completedFields = requiredFields.filter(field => 
      account[field] !== undefined && account[field] !== null && account[field] !== ''
    );

    return {
      isComplete: completedFields.length === requiredFields.length,
      completedFields,
      missingFields: requiredFields.filter(field => !completedFields.includes(field)),
      completionPercentage: (completedFields.length / requiredFields.length) * 100
    };
  }

  // Get accounts requiring parental consent
  async getAccountsPendingConsent() {
    return Array.from(this.accounts.values()).filter(
      acc => acc.status === 'pending-parental-consent'
    );
  }

  // Search accounts
  async searchAccounts(criteria) {
    const accounts = Array.from(this.accounts.values());
    return accounts.filter(account => {
      return Object.keys(criteria).every(key => {
        if (key === 'age') {
          return account.age >= criteria.age.min && account.age <= criteria.age.max;
        }
        if (key === 'interests') {
          return criteria.interests.some(interest => 
            account.interests && account.interests.includes(interest)
          );
        }
        return account[key] === criteria[key];
      });
    });
  }
}

module.exports = new AccountService();
// Payment Service for handling payments and checkout
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  constructor() {
    this.checkouts = new Map();
    this.payments = new Map();
    this.refunds = new Map();
    
    // Mock payment methods
    this.paymentMethods = [
      { id: 'ideal', name: 'iDEAL', type: 'bank_transfer', enabled: true },
      { id: 'card', name: 'Credit/Debit Card', type: 'card', enabled: true },
      { id: 'paypal', name: 'PayPal', type: 'wallet', enabled: true },
      { id: 'bancontact', name: 'Bancontact', type: 'bank_transfer', enabled: true }
    ];
  }

  // Initialize checkout session
  async initializeCheckout({ accountId, products, adviceId, complianceRestrictions = [] }) {
    const checkoutId = uuidv4();
    
    // Calculate totals
    const subtotal = products.reduce((sum, p) => sum + (p.currentPrice * (p.quantity || 1)), 0);
    const tax = subtotal * 0.21; // 21% VAT
    const total = subtotal + tax;

    const checkout = {
      id: checkoutId,
      accountId,
      products,
      adviceId,
      status: 'initialized',
      summary: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        currency: 'EUR'
      },
      availablePaymentMethods: this.getAvailablePaymentMethods(complianceRestrictions),
      complianceRestrictions,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };

    this.checkouts.set(checkoutId, checkout);
    return checkout;
  }

  // Get checkout session
  async getCheckout(checkoutId) {
    return this.checkouts.get(checkoutId);
  }

  // Process payment
  async processPayment(checkoutId, paymentMethod, paymentDetails) {
    const checkout = this.checkouts.get(checkoutId);
    if (!checkout) {
      throw new Error('Checkout session not found');
    }

    if (new Date() > checkout.expiresAt) {
      return {
        success: false,
        error: 'Checkout session expired'
      };
    }

    // Mock payment processing
    const paymentResult = await this.mockPaymentProcessing(
      paymentMethod,
      paymentDetails,
      checkout.summary.total
    );

    if (paymentResult.success) {
      const payment = {
        id: uuidv4(),
        checkoutId,
        accountId: checkout.accountId,
        amount: checkout.summary.total,
        currency: checkout.summary.currency,
        method: paymentMethod,
        status: 'completed',
        transactionId: paymentResult.transactionId,
        processedAt: new Date()
      };

      this.payments.set(payment.id, payment);
      
      // Update checkout status
      checkout.status = 'paid';
      checkout.paymentId = payment.id;
      this.checkouts.set(checkoutId, checkout);

      return {
        success: true,
        paymentId: payment.id,
        transactionId: payment.transactionId
      };
    }

    return paymentResult;
  }

  // Mock payment processing
  async mockPaymentProcessing(paymentMethod, paymentDetails, amount) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock payment validation
    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
        return {
          success: false,
          error: 'Incomplete card details'
        };
      }

      // Mock card validation
      if (paymentDetails.cardNumber.startsWith('4000000000000002')) {
        return {
          success: false,
          error: 'Card declined'
        };
      }
    }

    if (paymentMethod === 'ideal') {
      if (!paymentDetails.bank) {
        return {
          success: false,
          error: 'Bank selection required'
        };
      }
    }

    // Mock success
    return {
      success: true,
      transactionId: `txn_${uuidv4().substring(0, 8)}`
    };
  }

  // Process refund
  async processRefund(paymentId, amount, reason) {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return {
        success: false,
        error: 'Payment not found'
      };
    }

    if (payment.status !== 'completed') {
      return {
        success: false,
        error: 'Payment cannot be refunded'
      };
    }

    if (amount > payment.amount) {
      return {
        success: false,
        error: 'Refund amount exceeds payment amount'
      };
    }

    // Mock refund processing
    const refund = {
      id: uuidv4(),
      paymentId,
      amount,
      reason,
      status: 'processed',
      processedAt: new Date(),
      refundId: `ref_${uuidv4().substring(0, 8)}`
    };

    this.refunds.set(refund.id, refund);

    // Update payment status if full refund
    if (amount === payment.amount) {
      payment.status = 'refunded';
      this.payments.set(paymentId, payment);
    }

    return {
      success: true,
      refundId: refund.refundId
    };
  }

  // Get available payment methods based on restrictions
  getAvailablePaymentMethods(restrictions = []) {
    let methods = [...this.paymentMethods];

    // Apply compliance restrictions
    if (restrictions.includes('parental-approval-required')) {
      // For minors, might want to limit payment methods
      methods = methods.filter(m => m.id !== 'paypal'); // Example restriction
    }

    return methods.filter(m => m.enabled);
  }

  // Get payment details
  async getPayment(paymentId) {
    return this.payments.get(paymentId);
  }

  // Get refund details
  async getRefund(refundId) {
    return this.refunds.get(refundId);
  }

  // Validate payment method
  validatePaymentMethod(method, details) {
    switch (method) {
      case 'card':
        return this.validateCardDetails(details);
      case 'ideal':
        return this.validateIdealDetails(details);
      case 'paypal':
        return this.validatePayPalDetails(details);
      default:
        return { valid: false, error: 'Unsupported payment method' };
    }
  }

  validateCardDetails(details) {
    if (!details.cardNumber || !details.expiryDate || !details.cvv || !details.holderName) {
      return { valid: false, error: 'Missing required card details' };
    }

    // Basic card number validation (Luhn algorithm would be used in production)
    if (details.cardNumber.length < 13 || details.cardNumber.length > 19) {
      return { valid: false, error: 'Invalid card number' };
    }

    return { valid: true };
  }

  validateIdealDetails(details) {
    if (!details.bank) {
      return { valid: false, error: 'Bank selection required' };
    }

    const validBanks = ['abn_amro', 'ing', 'rabobank', 'sns_bank', 'bunq'];
    if (!validBanks.includes(details.bank)) {
      return { valid: false, error: 'Invalid bank selection' };
    }

    return { valid: true };
  }

  validatePayPalDetails(details) {
    if (!details.email) {
      return { valid: false, error: 'PayPal email required' };
    }

    return { valid: true };
  }

  // Clean up expired checkouts
  cleanupExpiredCheckouts() {
    const now = new Date();
    for (const [id, checkout] of this.checkouts.entries()) {
      if (now > checkout.expiresAt && checkout.status === 'initialized') {
        this.checkouts.delete(id);
      }
    }
  }
}

module.exports = new PaymentService();
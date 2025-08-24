const paymentService = require('../services/paymentService');
const orderService = require('../services/orderService');
const productService = require('../services/productService');
const accountService = require('../services/accountService');
const complianceService = require('../services/complianceService');

class PaymentController {
  // Initialize checkout process
  async initializeCheckout(req, res) {
    try {
      const { accountId, products, adviceId } = req.body;
      
      // Validate account
      const account = await accountService.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Check compliance for purchases
      const complianceCheck = await complianceService.validatePurchasePermissions(
        account, 
        { products, totalAmount: this.calculateTotal(products) }
      );

      if (!complianceCheck.allowed) {
        return res.status(403).json({ 
          error: 'Purchase not allowed',
          reason: complianceCheck.reason
        });
      }

      // Validate product availability
      const availability = await this.validateProductAvailability(products);
      if (!availability.allAvailable) {
        return res.status(400).json({
          error: 'Some products are not available',
          unavailableProducts: availability.unavailable
        });
      }

      // Initialize checkout session
      const checkout = await paymentService.initializeCheckout({
        accountId,
        products: availability.validatedProducts,
        adviceId,
        complianceRestrictions: complianceCheck.restrictions
      });

      res.json({
        checkoutId: checkout.id,
        summary: checkout.summary,
        paymentMethods: checkout.availablePaymentMethods,
        restrictions: complianceCheck.restrictions,
        expiresAt: checkout.expiresAt
      });
    } catch (error) {
      console.error('Initialize checkout error:', error);
      res.status(500).json({ error: 'Failed to initialize checkout' });
    }
  }

  // Process payment
  async processPayment(req, res) {
    try {
      const { checkoutId, paymentMethod, paymentDetails } = req.body;
      
      // Get checkout session
      const checkout = await paymentService.getCheckout(checkoutId);
      if (!checkout) {
        return res.status(404).json({ error: 'Checkout session not found' });
      }

      if (checkout.status !== 'initialized') {
        return res.status(400).json({ error: 'Checkout session already processed' });
      }

      // Process payment
      const paymentResult = await paymentService.processPayment(
        checkoutId,
        paymentMethod,
        paymentDetails
      );

      if (paymentResult.success) {
        // Create order
        const order = await orderService.createOrder({
          checkoutId,
          accountId: checkout.accountId,
          products: checkout.products,
          totalAmount: checkout.summary.total,
          paymentId: paymentResult.paymentId,
          adviceId: checkout.adviceId
        });

        // Update product stock
        await this.updateProductStock(checkout.products);

        res.json({
          success: true,
          orderId: order.id,
          paymentId: paymentResult.paymentId,
          message: 'Betaling succesvol verwerkt!'
        });
      } else {
        res.status(400).json({
          success: false,
          error: paymentResult.error,
          message: 'Betaling mislukt. Probeer het opnieuw.'
        });
      }
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({ error: 'Failed to process payment' });
    }
  }

  // Confirm order and complete purchase
  async confirmOrder(req, res) {
    try {
      const { orderId } = req.body;
      
      const order = await orderService.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Confirm order
      const confirmedOrder = await orderService.confirmOrder(orderId);
      
      // Send confirmation email (mock)
      await this.sendOrderConfirmation(confirmedOrder);

      // Update account with purchases
      await this.updateAccountPurchases(confirmedOrder);

      res.json({
        success: true,
        order: confirmedOrder,
        message: 'Bestelling bevestigd! Je ontvangt een bevestiging per e-mail.',
        accessInfo: this.generateAccessInfo(confirmedOrder.products)
      });
    } catch (error) {
      console.error('Confirm order error:', error);
      res.status(500).json({ error: 'Failed to confirm order' });
    }
  }

  // Get single order
  async getOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({ error: 'Failed to retrieve order' });
    }
  }

  // Get all orders for account
  async getOrders(req, res) {
    try {
      const { accountId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      
      const orders = await orderService.getOrdersByAccount(accountId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  }

  // Process refund
  async processRefund(req, res) {
    try {
      const { orderId } = req.params;
      const { reason, amount } = req.body;
      
      const order = await orderService.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'confirmed') {
        return res.status(400).json({ error: 'Order cannot be refunded' });
      }

      // Process refund
      const refund = await paymentService.processRefund(order.paymentId, amount || order.totalAmount, reason);
      
      if (refund.success) {
        // Update order status
        await orderService.updateOrderStatus(orderId, 'refunded');
        
        // Restore product stock if needed
        await this.restoreProductStock(order.products);

        res.json({
          success: true,
          refundId: refund.refundId,
          message: 'Terugbetaling succesvol verwerkt.'
        });
      } else {
        res.status(400).json({
          success: false,
          error: refund.error
        });
      }
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({ error: 'Failed to process refund' });
    }
  }

  // Helper methods
  calculateTotal(products) {
    return products.reduce((total, product) => {
      return total + (product.price * (product.quantity || 1));
    }, 0);
  }

  async validateProductAvailability(products) {
    const validatedProducts = [];
    const unavailable = [];

    for (const productRef of products) {
      const availability = await productService.checkAvailability(
        productRef.id, 
        productRef.quantity || 1
      );

      if (availability.available) {
        validatedProducts.push({
          ...productRef,
          currentPrice: availability.product.price,
          name: availability.product.name
        });
      } else {
        unavailable.push({
          id: productRef.id,
          reason: availability.reason
        });
      }
    }

    return {
      allAvailable: unavailable.length === 0,
      validatedProducts,
      unavailable
    };
  }

  async updateProductStock(products) {
    for (const product of products) {
      await productService.updateStock(product.id, -(product.quantity || 1));
    }
  }

  async restoreProductStock(products) {
    for (const product of products) {
      await productService.updateStock(product.id, product.quantity || 1);
    }
  }

  async sendOrderConfirmation(order) {
    // Mock email sending
    console.log(`Sending order confirmation email for order ${order.id}`);
    return { sent: true };
  }

  async updateAccountPurchases(order) {
    const account = await accountService.getAccount(order.accountId);
    if (account) {
      if (!account.purchaseHistory) {
        account.purchaseHistory = [];
      }
      
      account.purchaseHistory.push({
        orderId: order.id,
        products: order.products,
        totalAmount: order.totalAmount,
        purchaseDate: order.confirmedAt || order.createdAt
      });

      await accountService.updateAccount(order.accountId, { purchaseHistory: account.purchaseHistory });
    }
  }

  generateAccessInfo(products) {
    return products.map(product => ({
      productId: product.id,
      name: product.name,
      type: product.type,
      accessUrl: this.generateAccessUrl(product),
      instructions: this.generateAccessInstructions(product)
    }));
  }

  generateAccessUrl(product) {
    switch (product.type) {
      case 'game':
        return `/games/${product.id}/play`;
      case 'subscription':
        return `/subscription/dashboard`;
      case 'blueprint':
        return `/blueprints/${product.id}`;
      default:
        return `/products/${product.id}`;
    }
  }

  generateAccessInstructions(product) {
    switch (product.type) {
      case 'game':
        return 'Je kunt nu het spel spelen in je account dashboard.';
      case 'subscription':
        return 'Je abonnement is actief. Toegang tot alle content is nu beschikbaar.';
      case 'blueprint':
        return 'Je blueprint is beschikbaar in je leerruimte. Begin wanneer je wilt!';
      default:
        return 'Product toegang is geactiveerd in je account.';
    }
  }
}

module.exports = new PaymentController();
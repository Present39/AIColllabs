// Order Service for managing orders and fulfillment
const { v4: uuidv4 } = require('uuid');

class OrderService {
  constructor() {
    this.orders = new Map();
  }

  // Create new order
  async createOrder({ checkoutId, accountId, products, totalAmount, paymentId, adviceId }) {
    const order = {
      id: uuidv4(),
      checkoutId,
      accountId,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        category: p.category,
        price: p.currentPrice,
        quantity: p.quantity || 1,
        subtotal: p.currentPrice * (p.quantity || 1)
      })),
      totalAmount,
      paymentId,
      adviceId,
      status: 'pending',
      orderNumber: this.generateOrderNumber(),
      createdAt: new Date(),
      fulfillmentStatus: 'pending'
    };

    this.orders.set(order.id, order);
    return order;
  }

  // Get order by ID
  async getOrder(orderId) {
    return this.orders.get(orderId);
  }

  // Get orders by account
  async getOrdersByAccount(accountId, { page = 1, limit = 10, status } = {}) {
    const allOrders = Array.from(this.orders.values())
      .filter(order => order.accountId === accountId)
      .filter(order => !status || order.status === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = allOrders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(allOrders.length / limit),
        totalItems: allOrders.length,
        itemsPerPage: limit
      }
    };
  }

  // Confirm order
  async confirmOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = 'confirmed';
    order.confirmedAt = new Date();
    order.fulfillmentStatus = 'processing';

    // Start fulfillment process
    await this.startFulfillment(order);

    this.orders.set(orderId, order);
    return order;
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      
      if (status === 'cancelled') {
        order.cancelledAt = new Date();
      } else if (status === 'refunded') {
        order.refundedAt = new Date();
      }
      
      this.orders.set(orderId, order);
    }
    return order;
  }

  // Start fulfillment process
  async startFulfillment(order) {
    // Process each product type differently
    for (const product of order.products) {
      await this.fulfillProduct(order, product);
    }

    // Update fulfillment status
    order.fulfillmentStatus = 'completed';
    order.fulfilledAt = new Date();
  }

  // Fulfill individual product
  async fulfillProduct(order, product) {
    switch (product.type) {
      case 'game':
        return await this.fulfillGame(order, product);
      case 'subscription':
        return await this.fulfillSubscription(order, product);
      case 'blueprint':
        return await this.fulfillBlueprint(order, product);
      default:
        console.log(`Unknown product type: ${product.type}`);
    }
  }

  // Fulfill game purchase
  async fulfillGame(order, product) {
    console.log(`Fulfilling game: ${product.name} for account ${order.accountId}`);
    
    // In production, this would:
    // - Add game to user's library
    // - Generate download/access codes
    // - Update user permissions
    
    return {
      type: 'game',
      accessMethod: 'library',
      accessUrl: `/games/${product.id}/play`,
      message: 'Game toegevoegd aan je bibliotheek'
    };
  }

  // Fulfill subscription purchase
  async fulfillSubscription(order, product) {
    console.log(`Fulfilling subscription: ${product.name} for account ${order.accountId}`);
    
    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (product.name.includes('Maandelijks')) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (product.name.includes('Jaarlijks')) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return {
      type: 'subscription',
      accessMethod: 'account',
      startDate,
      endDate,
      accessUrl: '/subscription/dashboard',
      message: 'Abonnement geactiveerd'
    };
  }

  // Fulfill blueprint purchase
  async fulfillBlueprint(order, product) {
    console.log(`Fulfilling blueprint: ${product.name} for account ${order.accountId}`);
    
    return {
      type: 'blueprint',
      accessMethod: 'learning_path',
      accessUrl: `/blueprints/${product.id}`,
      progress: 0,
      message: 'Blueprint beschikbaar in je leerruimte'
    };
  }

  // Generate order number
  generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `AC${year}${month}${day}${random}`;
  }

  // Cancel order
  async cancelOrder(orderId, reason) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'confirmed') {
      throw new Error('Cannot cancel confirmed order');
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    this.orders.set(orderId, order);
    return order;
  }

  // Get order statistics
  async getOrderStats(accountId) {
    const accountOrders = Array.from(this.orders.values())
      .filter(order => order.accountId === accountId);

    const stats = {
      totalOrders: accountOrders.length,
      totalSpent: accountOrders
        .filter(order => order.status === 'confirmed')
        .reduce((sum, order) => sum + order.totalAmount, 0),
      ordersByStatus: {},
      recentOrders: accountOrders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };

    // Count orders by status
    accountOrders.forEach(order => {
      stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;
    });

    return stats;
  }

  // Search orders
  async searchOrders(criteria) {
    const allOrders = Array.from(this.orders.values());
    
    return allOrders.filter(order => {
      if (criteria.accountId && order.accountId !== criteria.accountId) return false;
      if (criteria.status && order.status !== criteria.status) return false;
      if (criteria.orderNumber && !order.orderNumber.includes(criteria.orderNumber)) return false;
      if (criteria.dateFrom && new Date(order.createdAt) < new Date(criteria.dateFrom)) return false;
      if (criteria.dateTo && new Date(order.createdAt) > new Date(criteria.dateTo)) return false;
      
      return true;
    });
  }

  // Get fulfillment details
  async getFulfillmentDetails(orderId) {
    const order = this.orders.get(orderId);
    if (!order) return null;

    return {
      orderId: order.id,
      status: order.fulfillmentStatus,
      fulfilledAt: order.fulfilledAt,
      products: order.products.map(product => ({
        id: product.id,
        name: product.name,
        type: product.type,
        fulfillmentMethod: this.getFulfillmentMethod(product.type),
        accessInfo: this.getAccessInfo(product)
      }))
    };
  }

  getFulfillmentMethod(productType) {
    switch (productType) {
      case 'game':
        return 'Digital delivery - Added to library';
      case 'subscription':
        return 'Account activation - Immediate access';
      case 'blueprint':
        return 'Learning path - Available in dashboard';
      default:
        return 'Standard delivery';
    }
  }

  getAccessInfo(product) {
    switch (product.type) {
      case 'game':
        return {
          method: 'Play directly in your account',
          url: `/games/${product.id}/play`
        };
      case 'subscription':
        return {
          method: 'Access all content through subscription dashboard',
          url: '/subscription/dashboard'
        };
      case 'blueprint':
        return {
          method: 'Start learning in your personal learning space',
          url: `/blueprints/${product.id}`
        };
      default:
        return {
          method: 'Access through your account',
          url: `/products/${product.id}`
        };
    }
  }
}

module.exports = new OrderService();
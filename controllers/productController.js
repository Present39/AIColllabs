const productService = require('../services/productService');
const recommendationService = require('../services/recommendationService');
const accountService = require('../services/accountService');

class ProductController {
  // Get complete product catalog
  async getCatalog(req, res) {
    try {
      const { page = 1, limit = 20, sortBy = 'name' } = req.query;
      const catalog = await productService.getCatalog({ page, limit, sortBy });
      
      res.json(catalog);
    } catch (error) {
      console.error('Get catalog error:', error);
      res.status(500).json({ error: 'Failed to retrieve catalog' });
    }
  }

  // Get products by category
  async getCategoryProducts(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const products = await productService.getProductsByCategory(category, { page, limit });
      
      res.json({
        category,
        products: products.items,
        pagination: products.pagination
      });
    } catch (error) {
      console.error('Get category products error:', error);
      res.status(500).json({ error: 'Failed to retrieve category products' });
    }
  }

  // Get single product details
  async getProduct(req, res) {
    try {
      const { productId } = req.params;
      const product = await productService.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to retrieve product' });
    }
  }

  // Get personalized recommendations
  async getRecommendations(req, res) {
    try {
      const { accountId, sessionId, preferences, category } = req.body;
      
      let userProfile = null;
      if (accountId) {
        userProfile = await accountService.getAccount(accountId);
      }

      const recommendations = await recommendationService.generateRecommendations({
        userProfile,
        sessionId,
        preferences,
        category
      });

      res.json({
        recommendations,
        explanation: recommendations.reasoning,
        confidence: recommendations.confidence
      });
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }

  // Verify Claudette's advice
  async verifyAdvice(req, res) {
    try {
      const { accountId, adviceId, customerFeedback } = req.body;
      
      const account = await accountService.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const advice = account.claudetteAdvice?.find(a => a.id === adviceId);
      if (!advice) {
        return res.status(404).json({ error: 'Advice not found' });
      }

      // Verify recommended products are still available and accurate
      const verification = await this.verifyRecommendedProducts(advice.products);
      
      // Update advice with verification status
      await accountService.updateAdviceStatus(accountId, adviceId, 'verified');

      res.json({
        verified: true,
        advice,
        productVerification: verification,
        customerFeedback,
        message: "Advies geverifieerd! Je kunt nu doorgaan naar de aankoop."
      });
    } catch (error) {
      console.error('Verify advice error:', error);
      res.status(500).json({ error: 'Failed to verify advice' });
    }
  }

  // Approve advice for purchase
  async approveAdvice(req, res) {
    try {
      const { accountId, adviceId } = req.body;
      
      // Update advice status
      await accountService.updateAdviceStatus(accountId, adviceId, 'approved');
      
      const account = await accountService.getAccount(accountId);
      const advice = account.claudetteAdvice?.find(a => a.id === adviceId);
      
      // Prepare products for checkout
      const checkoutData = {
        products: advice.products,
        totalAmount: this.calculateTotal(advice.products),
        adviceId,
        accountId
      };

      res.json({
        approved: true,
        message: "Advies goedgekeurd! Ga door naar checkout.",
        checkoutData
      });
    } catch (error) {
      console.error('Approve advice error:', error);
      res.status(500).json({ error: 'Failed to approve advice' });
    }
  }

  // Search products
  async searchProducts(req, res) {
    try {
      const { query, category, ageGroup, priceRange, page = 1, limit = 20 } = req.query;
      
      const searchResults = await productService.searchProducts({
        query,
        category,
        ageGroup,
        priceRange: priceRange ? JSON.parse(priceRange) : undefined,
        page,
        limit
      });

      res.json(searchResults);
    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({ error: 'Failed to search products' });
    }
  }

  // Helper method to verify recommended products
  async verifyRecommendedProducts(products) {
    const verificationResults = [];
    
    for (const productRef of products) {
      const currentProduct = await productService.getProduct(productRef.id);
      const verification = {
        productId: productRef.id,
        isAvailable: !!currentProduct && currentProduct.status === 'active',
        priceChanged: currentProduct ? currentProduct.price !== productRef.originalPrice : true,
        currentPrice: currentProduct?.price,
        originalPrice: productRef.originalPrice,
        inStock: currentProduct?.stock > 0
      };
      
      verificationResults.push(verification);
    }

    return {
      allAvailable: verificationResults.every(v => v.isAvailable),
      allInStock: verificationResults.every(v => v.inStock),
      priceChanges: verificationResults.filter(v => v.priceChanged),
      details: verificationResults
    };
  }

  // Calculate total price for products
  calculateTotal(products) {
    return products.reduce((total, product) => {
      return total + (product.price * (product.quantity || 1));
    }, 0);
  }
}

module.exports = new ProductController();
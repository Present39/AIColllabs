// Product Service for managing catalog and products
const { v4: uuidv4 } = require('uuid');

class ProductService {
  constructor() {
    this.products = new Map();
    this.initializeCatalog();
  }

  // Initialize sample product catalog
  initializeCatalog() {
    const sampleProducts = [
      // Games
      {
        id: 'game-001',
        name: 'CodeCraft Adventures',
        type: 'game',
        category: 'games',
        description: 'Leer programmeren door middel van een avontuurlijk spel',
        price: 29.99,
        ageGroup: '8-14',
        subjects: ['Programming', 'Logic', 'Problem Solving'],
        features: ['Interactive coding', 'Progress tracking', 'Multiplayer mode'],
        duration: 'Unlimited',
        status: 'active',
        stock: 100,
        rating: 4.8,
        reviews: 245
      },
      {
        id: 'game-002',
        name: 'Math Kingdom',
        type: 'game',
        category: 'games',
        description: 'Verken wiskunde in een magische koninkrijk',
        price: 24.99,
        ageGroup: '6-12',
        subjects: ['Mathematics', 'Arithmetic', 'Geometry'],
        features: ['Adaptive difficulty', 'Parent dashboard', 'Achievement system'],
        duration: 'Unlimited',
        status: 'active',
        stock: 150,
        rating: 4.6,
        reviews: 189
      },
      
      // Subscriptions
      {
        id: 'sub-001',
        name: 'Learning Plus Maandelijks',
        type: 'subscription',
        category: 'subscriptions',
        description: 'Toegang tot alle games en leermateriaal',
        price: 14.99,
        billingCycle: 'monthly',
        features: ['All games access', 'Progress tracking', 'Customer support', 'Regular updates'],
        ageGroup: 'All ages',
        duration: '1 month',
        status: 'active',
        stock: 9999,
        rating: 4.7,
        reviews: 1243
      },
      {
        id: 'sub-002',
        name: 'Family Pack Jaarlijks',
        type: 'subscription',
        category: 'subscriptions',
        description: 'Perfect voor gezinnen met meerdere kinderen',
        price: 149.99,
        billingCycle: 'yearly',
        features: ['Up to 4 accounts', 'Parent dashboard', 'All content', 'Priority support'],
        ageGroup: 'All ages',
        duration: '12 months',
        status: 'active',
        stock: 9999,
        rating: 4.9,
        reviews: 567
      },

      // Blueprints
      {
        id: 'blueprint-001',
        name: 'Web Development Path',
        type: 'blueprint',
        category: 'blueprints',
        description: 'Complete gids voor het leren van webontwikkeling',
        price: 79.99,
        duration: '3 months',
        level: 'Beginner',
        modules: ['HTML/CSS', 'JavaScript', 'React', 'Node.js'],
        features: ['Step-by-step guides', 'Projects', 'Code reviews', 'Certificate'],
        ageGroup: '14+',
        status: 'active',
        stock: 500,
        rating: 4.8,
        reviews: 324
      },
      {
        id: 'blueprint-002',
        name: 'Game Design Mastery',
        type: 'blueprint',
        category: 'blueprints',
        description: 'Leer games ontwerpen van concept tot uitvoering',
        price: 99.99,
        duration: '6 months',
        level: 'Intermediate',
        modules: ['Game Theory', 'Unity Basics', 'C# Programming', 'Level Design'],
        features: ['Hands-on projects', 'Mentor support', 'Portfolio building'],
        ageGroup: '16+',
        status: 'active',
        stock: 200,
        rating: 4.9,
        reviews: 156
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  }

  // Get complete catalog with pagination
  async getCatalog({ page = 1, limit = 20, sortBy = 'name' } = {}) {
    const allProducts = Array.from(this.products.values());
    const activeProducts = allProducts.filter(p => p.status === 'active');
    
    // Sort products
    activeProducts.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = activeProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(activeProducts.length / limit),
        totalItems: activeProducts.length,
        itemsPerPage: limit
      },
      categories: this.getCategories()
    };
  }

  // Get products by category
  async getProductsByCategory(category, { page = 1, limit = 20 } = {}) {
    const allProducts = Array.from(this.products.values());
    const categoryProducts = allProducts
      .filter(p => p.category === category && p.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = categoryProducts.slice(startIndex, endIndex);

    return {
      items: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(categoryProducts.length / limit),
        totalItems: categoryProducts.length,
        itemsPerPage: limit
      }
    };
  }

  // Get single product
  async getProduct(productId) {
    return this.products.get(productId);
  }

  // Search products
  async searchProducts({ query, category, ageGroup, priceRange, page = 1, limit = 20 }) {
    let results = Array.from(this.products.values())
      .filter(p => p.status === 'active');

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        (p.subjects && p.subjects.some(s => s.toLowerCase().includes(searchTerm)))
      );
    }

    // Category filter
    if (category && category !== 'all') {
      results = results.filter(p => p.category === category);
    }

    // Age group filter
    if (ageGroup) {
      results = results.filter(p => this.matchesAgeGroup(p.ageGroup, ageGroup));
    }

    // Price range filter
    if (priceRange && priceRange.min !== undefined && priceRange.max !== undefined) {
      results = results.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    return {
      results: paginatedResults,
      totalResults: results.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(results.length / limit),
        totalItems: results.length,
        itemsPerPage: limit
      },
      filters: {
        query,
        category,
        ageGroup,
        priceRange
      }
    };
  }

  // Get available categories
  getCategories() {
    const categories = new Set();
    this.products.forEach(product => {
      if (product.status === 'active') {
        categories.add(product.category);
      }
    });
    return Array.from(categories);
  }

  // Check if product matches age group
  matchesAgeGroup(productAgeGroup, targetAgeGroup) {
    if (productAgeGroup === 'All ages') return true;
    if (typeof targetAgeGroup === 'number') {
      // Parse age range like "8-14" or "16+"
      if (productAgeGroup.includes('-')) {
        const [min, max] = productAgeGroup.split('-').map(a => parseInt(a));
        return targetAgeGroup >= min && targetAgeGroup <= max;
      } else if (productAgeGroup.includes('+')) {
        const min = parseInt(productAgeGroup.replace('+', ''));
        return targetAgeGroup >= min;
      }
    }
    return productAgeGroup === targetAgeGroup;
  }

  // Add new product
  async addProduct(productData) {
    const product = {
      id: uuidv4(),
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };
    
    this.products.set(product.id, product);
    return product;
  }

  // Update product
  async updateProduct(productId, updates) {
    const product = this.products.get(productId);
    if (product) {
      Object.assign(product, updates, { updatedAt: new Date() });
      this.products.set(productId, product);
    }
    return product;
  }

  // Update stock
  async updateStock(productId, quantity) {
    const product = this.products.get(productId);
    if (product) {
      product.stock = Math.max(0, product.stock + quantity);
      product.updatedAt = new Date();
      this.products.set(productId, product);
    }
    return product;
  }

  // Check product availability
  async checkAvailability(productId, quantity = 1) {
    const product = this.products.get(productId);
    if (!product) return { available: false, reason: 'Product not found' };
    if (product.status !== 'active') return { available: false, reason: 'Product not active' };
    if (product.stock < quantity) return { available: false, reason: 'Insufficient stock' };
    
    return { available: true, product };
  }
}

module.exports = new ProductService();
// Recommendation Service for generating personalized product recommendations
const productService = require('./productService');

class RecommendationService {
  constructor() {
    this.weightings = {
      age: 0.3,
      interests: 0.4,
      previousPurchases: 0.2,
      rating: 0.1
    };
  }

  // Generate personalized recommendations
  async generateRecommendations({ userProfile, sessionId, preferences, category }) {
    try {
      // Get all available products
      const catalog = await productService.getCatalog({ limit: 1000 });
      let products = catalog.products;

      // Filter by category if specified
      if (category && category !== 'all') {
        products = products.filter(p => p.category === category);
      }

      // Score products based on user profile
      const scoredProducts = products.map(product => ({
        ...product,
        score: this.calculateScore(product, userProfile, preferences),
        reasoning: this.generateReasoning(product, userProfile, preferences)
      }));

      // Sort by score
      scoredProducts.sort((a, b) => b.score - a.score);

      // Select top recommendations
      const topRecommendations = scoredProducts.slice(0, 6);

      // Group by category for better presentation
      const recommendations = this.groupRecommendations(topRecommendations);

      return {
        recommendations,
        totalProducts: products.length,
        confidence: this.calculateConfidence(userProfile, preferences),
        reasoning: this.generateOverallReasoning(recommendations, userProfile),
        sessionId
      };
    } catch (error) {
      console.error('Generate recommendations error:', error);
      throw error;
    }
  }

  // Calculate recommendation score for a product
  calculateScore(product, userProfile, preferences) {
    let score = 0;

    // Age compatibility
    if (userProfile?.age) {
      score += this.calculateAgeScore(product, userProfile.age) * this.weightings.age;
    }

    // Interest matching
    if (userProfile?.interests || preferences?.interests) {
      const interests = [...(userProfile?.interests || []), ...(preferences?.interests || [])];
      score += this.calculateInterestScore(product, interests) * this.weightings.interests;
    }

    // Previous purchases (simplified)
    if (userProfile?.purchaseHistory) {
      score += this.calculatePurchaseHistoryScore(product, userProfile.purchaseHistory) * this.weightings.previousPurchases;
    }

    // Product rating
    score += (product.rating / 5) * this.weightings.rating;

    return Math.min(score, 1); // Normalize to 0-1
  }

  // Calculate age compatibility score
  calculateAgeScore(product, userAge) {
    if (product.ageGroup === 'All ages') return 1;
    
    if (product.ageGroup.includes('-')) {
      const [min, max] = product.ageGroup.split('-').map(a => parseInt(a));
      if (userAge >= min && userAge <= max) return 1;
      
      // Partial score for close ages
      const distance = Math.min(Math.abs(userAge - min), Math.abs(userAge - max));
      return Math.max(0, 1 - (distance / 5)); // Decrease score for each year away
    }
    
    if (product.ageGroup.includes('+')) {
      const min = parseInt(product.ageGroup.replace('+', ''));
      return userAge >= min ? 1 : Math.max(0, 1 - (min - userAge) / 5);
    }
    
    return 0.5; // Default score if age group format is unknown
  }

  // Calculate interest matching score
  calculateInterestScore(product, interests) {
    if (!interests || interests.length === 0) return 0.5;
    
    const productKeywords = [
      ...product.subjects || [],
      product.name.toLowerCase(),
      product.description.toLowerCase(),
      product.category
    ].map(k => k.toLowerCase());

    const interestKeywords = interests.map(i => i.toLowerCase());
    
    let matches = 0;
    interestKeywords.forEach(interest => {
      if (productKeywords.some(keyword => keyword.includes(interest) || interest.includes(keyword))) {
        matches++;
      }
    });

    return Math.min(matches / interestKeywords.length, 1);
  }

  // Calculate purchase history score (simplified)
  calculatePurchaseHistoryScore(product, purchaseHistory) {
    if (!purchaseHistory || purchaseHistory.length === 0) return 0.5;
    
    // Check for similar products or categories
    const similarPurchases = purchaseHistory.filter(purchase => 
      purchase.category === product.category ||
      (purchase.subjects && product.subjects && 
       purchase.subjects.some(s => product.subjects.includes(s)))
    );

    return Math.min(similarPurchases.length / purchaseHistory.length, 1);
  }

  // Generate reasoning for recommendation
  generateReasoning(product, userProfile, preferences) {
    const reasons = [];

    if (userProfile?.age && this.calculateAgeScore(product, userProfile.age) > 0.8) {
      reasons.push(`Perfect voor jouw leeftijd (${userProfile.age} jaar)`);
    }

    if (userProfile?.interests) {
      const matchingInterests = userProfile.interests.filter(interest => 
        product.subjects?.some(subject => 
          subject.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(subject.toLowerCase())
        )
      );
      
      if (matchingInterests.length > 0) {
        reasons.push(`Matcht je interesses: ${matchingInterests.join(', ')}`);
      }
    }

    if (product.rating >= 4.5) {
      reasons.push(`Hoog beoordeeld (${product.rating}/5 sterren)`);
    }

    if (product.type === 'subscription' && userProfile?.learningGoals?.includes('comprehensive')) {
      reasons.push('Biedt toegang tot alle content');
    }

    return reasons.length > 0 ? reasons : ['Populaire keuze onder gebruikers'];
  }

  // Group recommendations by category
  groupRecommendations(recommendations) {
    const grouped = {
      games: [],
      subscriptions: [],
      blueprints: []
    };

    recommendations.forEach(rec => {
      if (grouped[rec.category]) {
        grouped[rec.category].push(rec);
      }
    });

    return grouped;
  }

  // Calculate confidence level
  calculateConfidence(userProfile, preferences) {
    let confidence = 0.3; // Base confidence

    if (userProfile?.age) confidence += 0.2;
    if (userProfile?.interests && userProfile.interests.length > 0) confidence += 0.3;
    if (userProfile?.purchaseHistory && userProfile.purchaseHistory.length > 0) confidence += 0.2;
    if (preferences?.category && preferences.category !== 'all') confidence += 0.1;

    return Math.min(confidence, 1);
  }

  // Generate overall reasoning
  generateOverallReasoning(recommendations, userProfile) {
    const totalRecommendations = Object.values(recommendations).flat().length;
    
    if (totalRecommendations === 0) {
      return "We hebben momenteel geen producten die perfect matchen met je profiel, maar ons aanbod wordt regelmatig uitgebreid.";
    }

    const reasons = [];
    
    if (userProfile?.age) {
      reasons.push(`geselecteerd voor leeftijd ${userProfile.age} jaar`);
    }
    
    if (userProfile?.interests && userProfile.interests.length > 0) {
      reasons.push(`gebaseerd op je interesses in ${userProfile.interests.slice(0, 2).join(' en ')}`);
    }

    const baseReason = reasons.length > 0 
      ? `Deze aanbevelingen zijn ${reasons.join(' en ')}.`
      : "Deze aanbevelingen zijn gebaseerd op populaire keuzes.";

    return `${baseReason} Alle producten zijn zorgvuldig geselecteerd voor de beste leerervaring.`;
  }

  // Get trending products
  async getTrendingProducts(category = 'all', limit = 5) {
    const catalog = await productService.getCatalog({ limit: 1000 });
    let products = catalog.products;

    if (category !== 'all') {
      products = products.filter(p => p.category === category);
    }

    // Sort by rating and review count
    products.sort((a, b) => {
      const scoreA = a.rating * Math.log(a.reviews + 1);
      const scoreB = b.rating * Math.log(b.reviews + 1);
      return scoreB - scoreA;
    });

    return products.slice(0, limit);
  }

  // Get similar products
  async getSimilarProducts(productId, limit = 4) {
    const targetProduct = await productService.getProduct(productId);
    if (!targetProduct) return [];

    const catalog = await productService.getCatalog({ limit: 1000 });
    let similarProducts = catalog.products
      .filter(p => p.id !== productId)
      .map(product => ({
        ...product,
        similarity: this.calculateSimilarity(targetProduct, product)
      }))
      .sort((a, b) => b.similarity - a.similarity);

    return similarProducts.slice(0, limit);
  }

  // Calculate similarity between products
  calculateSimilarity(product1, product2) {
    let similarity = 0;

    // Same category
    if (product1.category === product2.category) similarity += 0.4;

    // Similar age group
    if (product1.ageGroup === product2.ageGroup) similarity += 0.3;

    // Subject overlap
    if (product1.subjects && product2.subjects) {
      const overlap = product1.subjects.filter(s => product2.subjects.includes(s));
      similarity += (overlap.length / Math.max(product1.subjects.length, product2.subjects.length)) * 0.3;
    }

    return similarity;
  }
}

module.exports = new RecommendationService();
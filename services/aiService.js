// AI Service for generating Claudette responses
class AIService {
  constructor() {
    this.claudettePersonality = {
      name: "Claudette",
      role: "Sphere host",
      personality: "Vriendelijk, behulpzaam, en geduldig. Claudette is gespecialiseerd in het begeleiden van klanten door hun leertraject.",
      language: "Nederlands",
      expertise: ["Games", "Educatieve abonnementen", "Ontwikkelingsblueprints", "Leermethoden"]
    };
  }

  async generateResponse(userMessage, session) {
    // Simple rule-based response generation (replace with actual AI integration)
    const context = session.mode || 'general';
    const lowerMessage = userMessage.toLowerCase();

    // Handle different contexts
    switch (context) {
      case 'browse':
        return this.generateBrowseResponse(lowerMessage, session);
      case 'account-creation':
        return this.generateAccountResponse(lowerMessage, session);
      default:
        return this.generateGeneralResponse(lowerMessage, session);
    }
  }

  generateBrowseResponse(message, session) {
    if (message.includes('game') || message.includes('spel')) {
      return {
        message: "Ik zie dat je geïnteresseerd bent in games! We hebben geweldige educatieve games die leren en plezier combineren. Wil je games voor een specifieke leeftijd of onderwerp?",
        suggestions: ["Programmeer games", "Taal games", "Wiskunde games", "Creatieve games"],
        category: "games"
      };
    }
    
    if (message.includes('abonnement') || message.includes('subscription')) {
      return {
        message: "Onze abonnementen bieden toegang tot uitgebreide leerprogramma's. We hebben opties voor individuele leerlingen, gezinnen en scholen. Wat past het beste bij jouw situatie?",
        suggestions: ["Individueel abonnement", "Gezinsabonnement", "School abonnement"],
        category: "subscriptions"
      };
    }

    if (message.includes('blueprint') || message.includes('ontwikkeling')) {
      return {
        message: "Blueprints zijn onze gestructureerde leerplannen voor specifieke vaardigheden. Ze bevatten stap-voor-stap instructies, projecten en evaluaties. Welk gebied interesse je?",
        suggestions: ["Programmeren", "Design", "Business", "Wetenschappen"],
        category: "blueprints"
      };
    }

    return {
      message: "Interessant! Vertel me meer over wat je precies zoekt, dan kan ik je de beste opties laten zien.",
      action: "clarify"
    };
  }

  generateAccountResponse(message, session) {
    return {
      message: "Bedankt voor de informatie! Ik verwerk dit om je profiel aan te maken.",
      action: "process-account-data"
    };
  }

  generateGeneralResponse(message, session) {
    const responses = [
      "Dat is een goede vraag! Laat me kijken hoe ik je het beste kan helpen.",
      "Ik begrijp je vraag. Geef me even de tijd om de perfecte oplossing voor je te vinden.",
      "Interessant! Vertel me meer, dan kan ik je beter adviseren."
    ];
    
    return {
      message: responses[Math.floor(Math.random() * responses.length)],
      action: "general-help"
    };
  }

  // Analyze user intent from message
  analyzeIntent(message) {
    const intents = {
      browse: ['kijken', 'zoeken', 'bekijken', 'browse'],
      purchase: ['kopen', 'bestellen', 'aankoop', 'betalen'],
      account: ['account', 'profiel', 'registreren', 'aanmelden'],
      help: ['help', 'hulp', 'vraag', 'probleem']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }
    
    return 'general';
  }

  // Generate product recommendations based on user profile
  generateRecommendations(userProfile, productCategory = 'all') {
    // This would integrate with the product catalog and recommendation engine
    const baseRecommendations = {
      games: [
        { id: 'g1', name: 'CodeCraft Adventures', type: 'game', ageGroup: '8-14', subject: 'Programming' },
        { id: 'g2', name: 'Math Kingdom', type: 'game', ageGroup: '6-12', subject: 'Mathematics' }
      ],
      subscriptions: [
        { id: 's1', name: 'Learning Plus', type: 'subscription', duration: 'monthly', features: ['All games', 'Progress tracking'] },
        { id: 's2', name: 'Family Pack', type: 'subscription', duration: 'yearly', features: ['Multiple accounts', 'Parent dashboard'] }
      ],
      blueprints: [
        { id: 'b1', name: 'Web Development Path', type: 'blueprint', duration: '3 months', level: 'beginner' },
        { id: 'b2', name: 'Game Design Mastery', type: 'blueprint', duration: '6 months', level: 'intermediate' }
      ]
    };

    if (productCategory === 'all') {
      return {
        games: baseRecommendations.games,
        subscriptions: baseRecommendations.subscriptions,
        blueprints: baseRecommendations.blueprints
      };
    }

    return baseRecommendations[productCategory] || [];
  }
}

module.exports = new AIService();
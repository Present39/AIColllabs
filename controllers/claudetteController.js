const { v4: uuidv4 } = require('uuid');
const sessionService = require('../services/sessionService');
const aiService = require('../services/aiService');

class ClaudetteController {
  // Phase 1: Welcome flow implementation
  async handleWelcome(req, res) {
    try {
      const sessionId = uuidv4();
      const welcomeMessage = {
        message: "Hallo! Ik ben Claudette, jouw persoonlijke AI-gids. Ik help je graag bij het vinden van de perfecte games, abonnementen en blueprints voor jouw leervereisten.",
        sessionId,
        character: "claudette",
        options: [
          {
            id: "account_create",
            text: "Maak een account aan voor persoonlijk advies",
            action: "account-decision"
          },
          {
            id: "browse_only",
            text: "Gewoon rondkijken zonder account",
            action: "browse-mode"
          }
        ]
      };

      // Initialize session
      await sessionService.createSession(sessionId, {
        character: 'claudette',
        mode: 'welcome',
        startTime: new Date(),
        messages: [welcomeMessage]
      });

      res.json(welcomeMessage);
    } catch (error) {
      console.error('Welcome flow error:', error);
      res.status(500).json({ error: 'Failed to initialize welcome flow' });
    }
  }

  // Account creation decision handler
  async handleAccountDecision(req, res) {
    try {
      const { sessionId, decision } = req.body;
      
      const message = decision === 'create' 
        ? {
            message: "Perfect! Heb je bezwaar als ik meteen een account profiel voor je aanmaak zodat ik daar mijn advies in kan plaatsen of wil je alleen rondkijken?",
            options: [
              { id: "create_now", text: "Ja, maak meteen een profiel aan", action: "account-mode" },
              { id: "browse_first", text: "Eerst rondkijken", action: "browse-mode" }
            ]
          }
        : {
            message: "Geen probleem! Je kunt altijd later een account aanmaken. Laten we kijken wat ik voor je kan vinden.",
            action: "browse-mode"
          };

      // Update session
      await sessionService.updateSession(sessionId, {
        mode: decision === 'create' ? 'account-decision' : 'browse',
        lastMessage: message
      });

      res.json({ sessionId, ...message });
    } catch (error) {
      console.error('Account decision error:', error);
      res.status(500).json({ error: 'Failed to process account decision' });
    }
  }

  // Browse mode handler
  async handleBrowseMode(req, res) {
    try {
      const { sessionId } = req.body;
      
      const message = {
        message: "Geweldig! Vertel me waar je naar op zoek bent. Ben je geïnteresseerd in games, educatieve abonnementen, of misschien ontwikkelingsblueprints?",
        mode: "browse",
        options: [
          { id: "games", text: "Games", category: "games" },
          { id: "subscriptions", text: "Abonnementen", category: "subscriptions" },
          { id: "blueprints", text: "Blueprints", category: "blueprints" },
          { id: "all", text: "Laat me alles zien", category: "all" }
        ]
      };

      await sessionService.updateSession(sessionId, {
        mode: 'browse',
        browsing: true,
        lastMessage: message
      });

      res.json({ sessionId, ...message });
    } catch (error) {
      console.error('Browse mode error:', error);
      res.status(500).json({ error: 'Failed to enter browse mode' });
    }
  }

  // Account mode handler  
  async handleAccountMode(req, res) {
    try {
      const { sessionId } = req.body;
      
      const message = {
        message: "Fantastisch! Ik ga een profiel voor je aanmaken. Wat is je voornaam?",
        mode: "account-creation",
        step: "name",
        form: {
          currentField: "firstName",
          fields: ["firstName", "age", "interests", "parentalConsent"]
        }
      };

      await sessionService.updateSession(sessionId, {
        mode: 'account-creation',
        accountCreation: true,
        currentStep: 'name',
        lastMessage: message
      });

      res.json({ sessionId, ...message });
    } catch (error) {
      console.error('Account mode error:', error);
      res.status(500).json({ error: 'Failed to enter account mode' });
    }
  }

  // General conversation handler
  async handleConversation(req, res) {
    try {
      const { sessionId, message, context } = req.body;
      
      // Get current session
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Process message based on current mode
      let response;
      switch (session.mode) {
        case 'browse':
          response = await this.handleBrowseConversation(session, message, context);
          break;
        case 'account-creation':
          response = await this.handleAccountCreationConversation(session, message, context);
          break;
        default:
          response = await aiService.generateResponse(message, session);
      }

      // Update session with new message
      await sessionService.addMessage(sessionId, { user: message, claudette: response });

      res.json({ sessionId, response });
    } catch (error) {
      console.error('Conversation error:', error);
      res.status(500).json({ error: 'Failed to process conversation' });
    }
  }

  async handleBrowseConversation(session, message, context) {
    // Implement browse-specific conversation logic
    return {
      message: "Ik begrijp je vraag. Laat me de beste opties voor je zoeken...",
      action: "search",
      category: context?.category || "all"
    };
  }

  async handleAccountCreationConversation(session, message, context) {
    // Implement account creation conversation logic
    const step = session.currentStep;
    
    switch (step) {
      case 'name':
        return {
          message: `Leuk je te ontmoeten, ${message}! Hoe oud ben je?`,
          nextStep: 'age',
          data: { firstName: message }
        };
      case 'age':
        const age = parseInt(message);
        if (age < 16) {
          return {
            message: "Omdat je jonger bent dan 16, heb ik toestemming van je ouders/verzorgers nodig. Kan ik hun e-mailadres krijgen?",
            nextStep: 'parental-consent',
            data: { age, requiresParentalConsent: true }
          };
        }
        return {
          message: "Prima! Waar ben je vooral in geïnteresseerd? Games, leren, programmeren?",
          nextStep: 'interests',
          data: { age }
        };
      default:
        return {
          message: "Bedankt voor de informatie! Je profiel wordt aangemaakt...",
          action: "create-profile"
        };
    }
  }

  // Get session information
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await sessionService.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({ error: 'Failed to retrieve session' });
    }
  }
}

module.exports = new ClaudetteController();
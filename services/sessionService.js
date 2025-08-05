// Simple in-memory session storage (replace with database in production)
class SessionService {
  constructor() {
    this.sessions = new Map();
  }

  async createSession(sessionId, sessionData) {
    this.sessions.set(sessionId, {
      id: sessionId,
      ...sessionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return this.sessions.get(sessionId);
  }

  async getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { updatedAt: new Date() });
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  async addMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (!session.messages) {
        session.messages = [];
      }
      session.messages.push({
        ...message,
        timestamp: new Date()
      });
      session.updatedAt = new Date();
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  async deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  async getAllSessions() {
    return Array.from(this.sessions.values());
  }
}

module.exports = new SessionService();
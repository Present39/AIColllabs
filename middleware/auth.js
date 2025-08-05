const jwt = require('jsonwebtoken');
const accountService = require('../services/accountService');

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Get account details
    const account = await accountService.getAccount(decoded.accountId);
    if (!account) {
      return res.status(401).json({ error: 'Invalid token. Account not found.' });
    }

    req.accountId = decoded.accountId;
    req.sessionId = decoded.sessionId;
    req.account = account;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
};

module.exports = authMiddleware;
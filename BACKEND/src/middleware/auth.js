import { verifyAccessToken } from '../services/authService.js';
import logger from '../lib/logger.js';

export function authenticateToken(req, res, next) {
  try {
    // Get token from header or cookie
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { userId, orgId, role }

    next();
  } catch (error) {
    logger.error(`Auth error: ${error.message}`);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    return res.status(401).json({ error: 'Invalid token' });
  }
}
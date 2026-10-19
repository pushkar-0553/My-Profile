import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AuthService } from '../modules/auth/auth.service.js';

export function authenticate(req, res, next) {
  // Check HTTP-only session cookie first, then fallback to Authorization header
  let token = req.cookies?.admin_session || req.signedCookies?.admin_session;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. No active administrative session found.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    const sessionCheck = AuthService.validateSession(decoded);
    if (!sessionCheck.valid) {
      return res.status(401).json({ error: sessionCheck.error });
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in with your passkey again.' });
    }
    return res.status(401).json({ error: 'Invalid or forged authentication session.' });
  }
}

export function optionalAuthenticate(req, res, next) {
  let token = req.cookies?.admin_session || req.signedCookies?.admin_session;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      const sessionCheck = AuthService.validateSession(decoded);
      if (sessionCheck.valid) {
        req.user = decoded;
      }
    } catch {
      // Ignore invalid/expired tokens for optional endpoints
    }
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Strict email validation against whitelisted ADMIN_EMAIL
  if (req.user.email?.toLowerCase() !== config.auth.adminEmail.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied. You are not authorized to access CMS administration.' });
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied. Super Administrator role required.' });
  }

  next();
}

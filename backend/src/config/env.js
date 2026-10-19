import dotenv from 'dotenv';
dotenv.config();

const rawFrontend = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
let derivedRpId = (process.env.WEBAUTHN_RP_ID || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');

// Auto-derive valid domain RP ID if left empty or left as 'localhost' while pointing to production Vercel
if (!derivedRpId || (derivedRpId === 'localhost' && !rawFrontend.includes('localhost') && !rawFrontend.includes('127.0.0.1'))) {
  try {
    derivedRpId = new URL(rawFrontend).hostname;
  } catch {
    derivedRpId = 'localhost';
  }
}

const sanitizedOrigin = (process.env.WEBAUTHN_ORIGIN || rawFrontend).trim().replace(/\/+$/, '');

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: rawFrontend,
  
  tidb: {
    host: process.env.TIDB_HOST || '127.0.0.1',
    port: parseInt(process.env.TIDB_PORT || '4000', 10),
    user: process.env.TIDB_USER || 'root',
    password: process.env.TIDB_PASSWORD || '',
    database: process.env.TIDB_DATABASE || 'portfolio_db',
    enableSsl: process.env.TIDB_ENABLE_SSL === 'true',
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_fallback_key_32_chars_long',
    jwtExpiry: process.env.JWT_EXPIRY || '2h',
    adminEmail: (process.env.ADMIN_EMAIL || 'pushkarakagitha@gmail.com').toLowerCase(),
  },

  webauthn: {
    rpId: derivedRpId,
    rpName: process.env.WEBAUTHN_RP_NAME || 'Pushkara Portfolio Admin',
    origin: sanitizedOrigin,
  },

  github: {
    token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
    username: process.env.GITHUB_USERNAME || 'pushkar-0553',
  }
};

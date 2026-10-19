import crypto from 'crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';

// Derive 32-byte key from TOTP_ENCRYPTION_KEY
function getKey() {
  return crypto.createHash('sha256').update(String(config.auth.totpEncryptionKey)).digest();
}

/**
 * Encrypt a secret string using AES-256-GCM
 * @param {string} text - plaintext to encrypt
 * @returns {{ encrypted: string, iv: string, tag: string }}
 */
export function encryptSecret(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag
  };
}

/**
 * Decrypt an AES-256-GCM ciphertext
 * @param {string} encrypted - hex-encoded ciphertext
 * @param {string} ivHex - hex-encoded 16-byte IV
 * @param {string} tagHex - hex-encoded 16-byte auth tag
 * @returns {string} plaintext
 */
export function decryptSecret(encrypted, ivHex, tagHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

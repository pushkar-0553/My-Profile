import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import { config } from '../../config/env.js';
import { query } from '../../config/db.js';

export class AuthService {
  /**
   * Helper to hash recovery codes using SHA-256 and secret salt
   */
  static hashRecoveryCode(rawCode) {
    const clean = rawCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return crypto
      .createHash('sha256')
      .update(clean + config.auth.jwtSecret)
      .digest('hex');
  }

  /**
   * Helper to format recovery code string as XXXX-XXXX-XXXX
   */
  static generatePlainRecoveryCode() {
    const hex = crypto.randomBytes(6).toString('hex').toUpperCase();
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
  }

  /**
   * Get or initialize the primary Super Admin record
   */
  static async getOrCreateAdmin() {
    const normalizedEmail = config.auth.adminEmail.toLowerCase();
    const rows = await query('SELECT * FROM admins WHERE email = ?', [normalizedEmail]);
    if (rows && rows.length > 0) {
      return rows[0];
    }

    const result = await query(
      'INSERT INTO admins (email, full_name, role) VALUES (?, ?, ?)',
      [normalizedEmail, 'Pushkara Sai Vardhan', 'SUPER_ADMIN']
    );

    return {
      id: result.insertId || 1,
      email: normalizedEmail,
      full_name: 'Pushkara Sai Vardhan',
      role: 'SUPER_ADMIN'
    };
  }

  /**
   * Check CMS Setup Status (whether any passkeys are enrolled)
   */
  static async getSetupStatus() {
    const admin = await this.getOrCreateAdmin();
    const rows = await query('SELECT COUNT(*) as count FROM admin_passkeys WHERE admin_id = ?', [admin.id]);
    const passkeyCount = rows[0]?.count || 0;

    return {
      isConfigured: passkeyCount > 0,
      passkeyCount,
      adminEmail: admin.email
    };
  }

  /**
   * 1. Generate WebAuthn Registration Options
   */
  static async generateRegistrationOptions(authenticatedUser = null) {
    const admin = authenticatedUser
      ? await this.getOrCreateAdmin()
      : await this.getOrCreateAdmin();

    // Check if unauthenticated caller is allowed (only allowed if 0 passkeys exist for initial setup)
    if (!authenticatedUser) {
      const passkeys = await query('SELECT id FROM admin_passkeys WHERE admin_id = ?', [admin.id]);
      if (passkeys.length > 0) {
        throw new Error('Initial setup is already completed. Please authenticate with an existing passkey to add more devices.');
      }
    }

    // Retrieve existing passkeys to prevent re-registering the same authenticator
    const existingPasskeys = await query(
      'SELECT credential_id, transports FROM admin_passkeys WHERE admin_id = ?',
      [admin.id]
    );

    const excludeCredentials = existingPasskeys.map(pk => ({
      id: pk.credential_id,
      transports: pk.transports ? JSON.parse(pk.transports) : undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName: config.webauthn.rpName,
      rpID: config.webauthn.rpId,
      userID: isoUint8Array.fromUTF8String(String(admin.id)),
      userName: admin.email,
      userDisplayName: admin.full_name || 'Portfolio Admin',
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Save registration challenge in DB with 5-minute expiry
    await query(
      'INSERT INTO admin_challenges (challenge, admin_id, purpose, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
      [options.challenge, admin.id, 'registration']
    );

    return options;
  }

  /**
   * 2. Verify WebAuthn Registration Response and Save Passkey
   */
  static async verifyRegistrationResponse(response, deviceLabel, authenticatedUser = null) {
    const admin = await this.getOrCreateAdmin();

    if (!authenticatedUser) {
      const passkeys = await query('SELECT id FROM admin_passkeys WHERE admin_id = ?', [admin.id]);
      if (passkeys.length > 0) {
        throw new Error('Unauthorized registration attempt. Admin already initialized.');
      }
    }

    // Lookup latest active registration challenge
    const challenges = await query(
      `SELECT * FROM admin_challenges 
       WHERE admin_id = ? AND purpose = 'registration' AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [admin.id]
    );

    if (!challenges || challenges.length === 0) {
      throw new Error('Registration challenge expired or missing. Please restart passkey setup.');
    }

    const storedChallenge = challenges[0];

    // Cryptographic WebAuthn Verification
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: config.webauthn.origin,
      expectedRPID: config.webauthn.rpId,
      requireUserVerification: false // Allow platform PIN/biometrics per device capabilities
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('WebAuthn registration verification failed.');
    }

    const { credential, aaguid } = verification.registrationInfo;
    const credentialId = credential.id;
    const publicKeyBase64 = isoBase64URL.fromBuffer(credential.publicKey);
    const counter = credential.counter;
    const transports = JSON.stringify(
      response.response?.transports || credential.transports || []
    );

    const deviceName = deviceLabel?.trim() || 'Biometric Security Key / Device';

    // Store WebAuthn credential into database
    await query(`
      INSERT INTO admin_passkeys (admin_id, credential_id, public_key, counter, device_name, transports, aaguid, created_at, last_used_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [admin.id, credentialId, publicKeyBase64, counter, deviceName, transports, aaguid]);

    // Clean up used challenge
    await query('DELETE FROM admin_challenges WHERE id = ?', [storedChallenge.id]);

    // If no recovery codes exist yet, generate initial one-time recovery codes
    let recoveryCodes = null;
    const existingCodes = await query('SELECT id FROM admin_recovery_codes WHERE admin_id = ?', [admin.id]);
    if (!existingCodes || existingCodes.length === 0) {
      recoveryCodes = await this.generateRecoveryCodes(admin.id);
    }

    const session = this.createAdminSession(admin);

    return {
      verified: true,
      user: session.user,
      token: session.token,
      recoveryCodes
    };
  }

  /**
   * 3. Generate WebAuthn Login Options
   */
  static async generateLoginOptions() {
    const admin = await this.getOrCreateAdmin();

    const passkeys = await query(
      'SELECT credential_id, transports FROM admin_passkeys WHERE admin_id = ?',
      [admin.id]
    );

    if (!passkeys || passkeys.length === 0) {
      throw new Error('No passkeys registered for this CMS yet. Please complete initial setup.');
    }

    const allowCredentials = passkeys.map(pk => ({
      id: pk.credential_id,
      transports: pk.transports ? JSON.parse(pk.transports) : undefined,
    }));

    const options = await generateAuthenticationOptions({
      rpID: config.webauthn.rpId,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Save authentication challenge with 5-minute expiry
    await query(
      'INSERT INTO admin_challenges (challenge, admin_id, purpose, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
      [options.challenge, admin.id, 'authentication']
    );

    return options;
  }

  /**
   * 4. Verify WebAuthn Login Assertion
   */
  static async verifyLoginResponse(response) {
    const admin = await this.getOrCreateAdmin();

    // Find passkey record matching credential ID
    const passkeyRecords = await query(
      'SELECT * FROM admin_passkeys WHERE admin_id = ? AND credential_id = ?',
      [admin.id, response.id]
    );

    if (!passkeyRecords || passkeyRecords.length === 0) {
      throw new Error('Unknown passkey credential. This passkey is not recognized for CMS administration.');
    }

    const passkey = passkeyRecords[0];

    // Find matching challenge
    const challenges = await query(
      `SELECT * FROM admin_challenges 
       WHERE admin_id = ? AND purpose = 'authentication' AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [admin.id]
    );

    if (!challenges || challenges.length === 0) {
      throw new Error('Login challenge expired or not found. Please try logging in again.');
    }

    const storedChallenge = challenges[0];

    // Cryptographic WebAuthn Verification
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: config.webauthn.origin,
      expectedRPID: config.webauthn.rpId,
      credential: {
        id: passkey.credential_id,
        publicKey: isoBase64URL.toBuffer(passkey.public_key),
        counter: Number(passkey.counter),
        transports: passkey.transports ? JSON.parse(passkey.transports) : undefined,
      },
      requireUserVerification: false
    });

    if (!verification.verified) {
      throw new Error('Passkey signature verification failed.');
    }

    // Update counter and last_used_at timestamp
    const newCounter = verification.authenticationInfo?.newCounter ?? (Number(passkey.counter) + 1);
    await query(
      'UPDATE admin_passkeys SET counter = ?, last_used_at = NOW() WHERE id = ?',
      [newCounter, passkey.id]
    );

    // Delete used challenge
    await query('DELETE FROM admin_challenges WHERE id = ?', [storedChallenge.id]);

    const session = this.createAdminSession(admin);

    return {
      verified: true,
      user: session.user,
      token: session.token
    };
  }

  /**
   * 5. Verify Emergency Recovery Code
   */
  static async verifyRecoveryCode(rawCode) {
    if (!rawCode || typeof rawCode !== 'string') {
      throw new Error('Recovery code is required.');
    }

    const admin = await this.getOrCreateAdmin();
    const codeHash = this.hashRecoveryCode(rawCode);

    const matches = await query(
      'SELECT * FROM admin_recovery_codes WHERE admin_id = ? AND code_hash = ? AND is_used = 0',
      [admin.id, codeHash]
    );

    if (!matches || matches.length === 0) {
      throw new Error('Invalid or already used recovery code. Please check your emergency codes list.');
    }

    const codeRecord = matches[0];

    // Mark code as used immediately
    await query(
      'UPDATE admin_recovery_codes SET is_used = 1, used_at = NOW() WHERE id = ?',
      [codeRecord.id]
    );

    const session = this.createAdminSession(admin);

    return {
      verified: true,
      user: session.user,
      token: session.token
    };
  }

  /**
   * 6. Generate 8 Fresh One-Time Recovery Codes
   */
  static async generateRecoveryCodes(adminId) {
    // Invalidate all existing recovery codes
    await query('DELETE FROM admin_recovery_codes WHERE admin_id = ?', [adminId]);

    const plainCodes = [];
    for (let i = 0; i < 8; i++) {
      const plain = this.generatePlainRecoveryCode();
      plainCodes.push(plain);
      const hash = this.hashRecoveryCode(plain);

      await query(
        'INSERT INTO admin_recovery_codes (admin_id, code_hash, is_used, created_at) VALUES (?, ?, 0, NOW())',
        [adminId, hash]
      );
    }

    return plainCodes;
  }

  /**
   * 7. List Admin Passkeys
   */
  static async listPasskeys(adminId) {
    return query(
      `SELECT id, credential_id, device_name, aaguid, created_at, last_used_at 
       FROM admin_passkeys WHERE admin_id = ? ORDER BY created_at DESC`,
      [adminId]
    );
  }

  /**
   * 8. Rename Passkey Device Label
   */
  static async renamePasskey(adminId, passkeyId, deviceName) {
    const trimmed = (deviceName || '').trim();
    if (!trimmed) {
      throw new Error('Device name cannot be blank.');
    }

    await query(
      'UPDATE admin_passkeys SET device_name = ? WHERE id = ? AND admin_id = ?',
      [trimmed, passkeyId, adminId]
    );
    return { success: true };
  }

  /**
   * 9. Remove a Passkey (Prevent lockout if only 1 method remains)
   */
  static async deletePasskey(adminId, passkeyId) {
    const passkeys = await query('SELECT id FROM admin_passkeys WHERE admin_id = ?', [adminId]);

    if (passkeys.length <= 1) {
      // Check if unused recovery codes exist
      const recoveryCodes = await query(
        'SELECT id FROM admin_recovery_codes WHERE admin_id = ? AND is_used = 0',
        [adminId]
      );
      if (!recoveryCodes || recoveryCodes.length === 0) {
        throw new Error('Cannot delete your only registered passkey without active recovery codes. Add another passkey or generate recovery codes first to prevent permanent lockout.');
      }
    }

    await query(
      'DELETE FROM admin_passkeys WHERE id = ? AND admin_id = ?',
      [passkeyId, adminId]
    );

    return { success: true };
  }

  // Server-side session tracking for idle timeout (30m), absolute lifetime (12h), and revocation
  static activeSessions = new Map();
  static revokedSessions = new Set();

  static revokeSession(sessionId) {
    if (!sessionId) return;
    this.activeSessions.delete(sessionId);
    this.revokedSessions.add(sessionId);
    // Keep revoked set bounded
    if (this.revokedSessions.size > 1000) {
      const first = this.revokedSessions.values().next().value;
      this.revokedSessions.delete(first);
    }
  }

  static validateSession(decoded) {
    if (!decoded || !decoded.sessionId) return { valid: true }; // backwards compat if token without sessionId
    if (this.revokedSessions.has(decoded.sessionId)) {
      return { valid: false, error: 'Session has been revoked. Please sign in again.' };
    }

    const session = this.activeSessions.get(decoded.sessionId);
    const now = Date.now();
    const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours

    if (session) {
      if (now - session.lastActive > IDLE_TIMEOUT_MS) {
        this.activeSessions.delete(decoded.sessionId);
        return { valid: false, error: 'Session idle timeout (30 minutes of inactivity). Please authenticate again.' };
      }
      if (now - session.createdAt > ABSOLUTE_TIMEOUT_MS) {
        this.activeSessions.delete(decoded.sessionId);
        return { valid: false, error: 'Session reached maximum lifetime (12 hours). Please authenticate again.' };
      }
      // Update last activity timestamp
      session.lastActive = now;
    } else {
      // First sighting or server restarted while token is still within JWT expiry
      this.activeSessions.set(decoded.sessionId, {
        createdAt: decoded.authTime || now,
        lastActive: now,
        userId: decoded.id
      });
    }

    return { valid: true };
  }

  /**
   * Create authenticated JWT Session Token with short-lived expiry (2 hours)
   */
  static createAdminSession(admin) {
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    this.activeSessions.set(sessionId, {
      createdAt: now,
      lastActive: now,
      userId: admin.id
    });

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: 'SUPER_ADMIN',
        sessionId,
        authTime: now
      },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiry }
    );

    return {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: 'SUPER_ADMIN'
      }
    };
  }
}

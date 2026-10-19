import { AuthService } from './auth.service.js';
import { config } from '../../config/env.js';

const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours privileged admin session

function setSessionCookie(res, token) {
  res.cookie('admin_session', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: SESSION_MAX_AGE_MS,
    path: '/'
  });
}

function clearSessionCookie(res) {
  res.clearCookie('admin_session', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/'
  });
}

export class AuthController {
  /**
   * Check if any passkeys are enrolled in this CMS
   */
  static async getSetupStatus(req, res) {
    try {
      const status = await AuthService.getSetupStatus();
      return res.json(status);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Registration Options (WebAuthn Attestation challenge)
   */
  static async getRegisterOptions(req, res) {
    try {
      const options = await AuthService.generateRegistrationOptions(req.user);
      return res.json(options);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Registration Verification (Save new passkey)
   */
  static async verifyRegistration(req, res) {
    try {
      const { response, deviceName } = req.body;
      if (!response) {
        return res.status(400).json({ error: 'Missing WebAuthn registration response.' });
      }

      const result = await AuthService.verifyRegistrationResponse(response, deviceName, req.user);
      setSessionCookie(res, result.token);

      return res.json({
        success: true,
        user: result.user,
        token: result.token,
        recoveryCodes: result.recoveryCodes
      });
    } catch (error) {
      console.error('[WebAuthn Registration Error]:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Authentication Options (WebAuthn Assertion challenge)
   */
  static async getLoginOptions(req, res) {
    try {
      const options = await AuthService.generateLoginOptions();
      return res.json(options);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Authentication Verification (Login with passkey)
   */
  static async verifyLogin(req, res) {
    try {
      const { response } = req.body;
      if (!response) {
        return res.status(400).json({ error: 'Missing WebAuthn authentication response.' });
      }

      const result = await AuthService.verifyLoginResponse(response);
      setSessionCookie(res, result.token);

      return res.json({
        success: true,
        user: result.user,
        token: result.token
      });
    } catch (error) {
      console.error('[WebAuthn Login Error]:', error.message);
      return res.status(401).json({ error: error.message });
    }
  }

  /**
   * Emergency One-Time Recovery Code Verification
   */
  static async verifyRecoveryCode(req, res) {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Recovery code is required.' });
      }

      const result = await AuthService.verifyRecoveryCode(code);
      setSessionCookie(res, result.token);

      return res.json({
        success: true,
        user: result.user,
        token: result.token
      });
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  /**
   * Current Admin Session
   */
  static async getSession(req, res) {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.json({
        authenticated: false,
        user: null
      });
    }
    return res.json({
      authenticated: true,
      user: req.user
    });
  }

  /**
   * Admin Logout
   */
  static async logout(req, res) {
    if (req.user?.sessionId) {
      AuthService.revokeSession(req.user.sessionId);
    }
    clearSessionCookie(res);
    return res.json({ success: true, message: 'Logged out successfully.' });
  }

  /**
   * Passkey Management: List all enrolled passkeys
   */
  static async listPasskeys(req, res) {
    try {
      const passkeys = await AuthService.listPasskeys(req.user.id);
      return res.json(passkeys);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Passkey Management: Rename device label
   */
  static async renamePasskey(req, res) {
    try {
      const { deviceName } = req.body;
      await AuthService.renamePasskey(req.user.id, req.params.id, deviceName);
      return res.json({ success: true, message: 'Device name updated.' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Passkey Management: Remove a passkey
   */
  static async deletePasskey(req, res) {
    try {
      await AuthService.deletePasskey(req.user.id, req.params.id);
      return res.json({ success: true, message: 'Passkey deleted.' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Passkey Management: Generate new recovery codes
   */
  static async regenerateRecoveryCodes(req, res) {
    try {
      const recoveryCodes = await AuthService.generateRecoveryCodes(req.user.id);
      return res.json({ recoveryCodes });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

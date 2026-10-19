import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { authenticate, optionalAuthenticate, requireAdmin } from '../../middleware/authenticate.js';

const router = Router();

// 1. Setup Status check
router.get('/setup-status', AuthController.getSetupStatus);

// 2. Passkey Registration (First-time setup OR adding additional device passkey)
router.post('/passkey/register/options', optionalAuthenticate, AuthController.getRegisterOptions);
router.post('/passkey/register/verify', authLimiter, optionalAuthenticate, AuthController.verifyRegistration);

// 3. Passkey Authentication (Login)
router.post('/passkey/login/options', AuthController.getLoginOptions);
router.post('/passkey/login/verify', authLimiter, AuthController.verifyLogin);

// 4. Emergency Recovery Code Verification
router.post('/recovery-codes/verify', authLimiter, AuthController.verifyRecoveryCode);

// 5. Session Status & Logout
router.get('/session', optionalAuthenticate, AuthController.getSession);
router.get('/me', optionalAuthenticate, AuthController.getSession);
router.post('/logout', AuthController.logout);

// 6. Protected Passkey Management (Requires active Admin session)
router.get('/passkeys', authenticate, requireAdmin, AuthController.listPasskeys);
router.patch('/passkeys/:id', authenticate, requireAdmin, AuthController.renamePasskey);
router.delete('/passkeys/:id', authenticate, requireAdmin, AuthController.deletePasskey);
router.post('/recovery-codes', authenticate, requireAdmin, AuthController.regenerateRecoveryCodes);

export default router;

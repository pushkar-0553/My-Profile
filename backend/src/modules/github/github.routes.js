import { Router } from 'express';
import { GitHubController } from './github.controller.js';
import { authenticate, requireAdmin } from '../../middleware/authenticate.js';

const router = Router();

// Protect all GitHub management endpoints with JWT + 2FA
router.use(authenticate, requireAdmin);

router.get('/repositories', GitHubController.getRepositories);
router.post('/import', GitHubController.importRepository);
router.post('/sync/:id', GitHubController.syncProject);

export default router;

import { Router } from 'express';
import { ProfileController } from './profile.controller.js';
import { authenticate, requireAdmin } from '../../middleware/authenticate.js';
import { apiLimiter } from '../../middleware/rateLimiter.js';

const publicRouter = Router();
const adminRouter = Router();

// Public routes (Rate limited)
publicRouter.use(apiLimiter);
publicRouter.get('/overview', ProfileController.getPublicProfile);
publicRouter.get('/experience', ProfileController.getExperiences);
publicRouter.get('/skills', ProfileController.getSkills);

// Admin routes (Protected by JWT + 2FA)
adminRouter.use(authenticate, requireAdmin);
adminRouter.put('/settings', ProfileController.updateSettings);
adminRouter.get('/experience', ProfileController.getExperiences);
adminRouter.post('/experience', ProfileController.saveExperience);
adminRouter.delete('/experience/:id', ProfileController.deleteExperience);
adminRouter.get('/skills', ProfileController.getSkills);
adminRouter.post('/skills', ProfileController.saveSkill);
adminRouter.delete('/skills/:id', ProfileController.deleteSkill);

export { publicRouter as publicProfileRoutes, adminRouter as adminProfileRoutes };

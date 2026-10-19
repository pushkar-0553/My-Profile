import { Router } from 'express';
import { ProjectsController } from './projects.controller.js';
import { apiLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.use(apiLimiter);
router.get('/', ProjectsController.getPublicProjects);
router.get('/:slug', ProjectsController.getPublicProjectBySlug);

export default router;

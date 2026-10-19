import { Router } from 'express';
import { ProjectsController } from './projects.controller.js';
import { authenticate, requireAdmin } from '../../middleware/authenticate.js';

const router = Router();

// Protect all admin project endpoints with JWT + 2FA gate
router.use(authenticate, requireAdmin);

router.get('/', ProjectsController.getAllAdminProjects);
router.get('/:id', ProjectsController.getProjectById);
router.post('/', ProjectsController.createProject);
router.put('/:id', ProjectsController.updateProject);
router.delete('/:id', ProjectsController.deleteProject);
router.patch('/:id/publish', ProjectsController.togglePublish);
router.patch('/:id/feature', ProjectsController.toggleFeatured);
router.patch('/reorder', ProjectsController.reorderProjects);

export default router;

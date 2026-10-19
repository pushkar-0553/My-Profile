import { Router } from 'express';
import { ContactController } from './contact.controller.js';
import { contactLimiter } from '../../middleware/rateLimiter.js';
import { authenticate, requireAdmin } from '../../middleware/authenticate.js';

const publicRouter = Router();
const adminRouter = Router();

// Public submission with rate limiting
publicRouter.post('/', contactLimiter, ContactController.submitMessage);

// Admin message management (Protected)
adminRouter.use(authenticate, requireAdmin);
adminRouter.get('/', ContactController.getMessages);
adminRouter.patch('/:id/read', ContactController.markAsRead);
adminRouter.delete('/:id', ContactController.deleteMessage);

export { publicRouter as publicContactRoutes, adminRouter as adminContactRoutes };

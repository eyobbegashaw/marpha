import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notificationsController.list(req, res, next));
router.patch('/mark-all-read', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notificationsController.markAllAsRead(req, res, next));
router.patch('/:id/read', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notificationsController.markAsRead(req, res, next));
router.patch('/:id/resolve', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notificationsController.markAsResolved(req, res, next));
router.post('/check-expiry', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notificationsController.triggerExpiryCheck(req, res, next));

export default router;

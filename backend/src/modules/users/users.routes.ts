import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { createUserSchema, updateUserSchema, toggleUserStatusSchema } from './users.schema';
import { ownerResetPasswordSchema } from '../auth/auth.schema';

const router = Router();

router.use(authMiddleware);

// Only PHARMACY_OWNER (and PLATFORM_ADMIN) can manage employees
router.get('/reset-requests', requireRoles('PHARMACY_OWNER', 'PLATFORM_ADMIN'), (req, res, next) => usersController.listResetRequests(req, res, next));
router.get('/', requireRoles('PHARMACY_OWNER', 'PLATFORM_ADMIN'), (req, res, next) => usersController.list(req, res, next));
router.get('/:id', requireRoles('PHARMACY_OWNER', 'PLATFORM_ADMIN'), (req, res, next) => usersController.getById(req, res, next));
router.post('/', requireRoles('PHARMACY_OWNER', 'PLATFORM_ADMIN'), validateRequest(createUserSchema), (req, res, next) => usersController.create(req, res, next));
router.post('/:id/reset-password', requireRoles('PHARMACY_OWNER', 'PLATFORM_ADMIN'), validateRequest(ownerResetPasswordSchema), (req, res, next) => usersController.resetPassword(req, res, next));
router.put('/:id', requireRoles('PHARMACY_OWNER', 'PLATFORM_ADMIN'), validateRequest(updateUserSchema), (req, res, next) => usersController.update(req, res, next));
router.patch('/:id', requireRoles('PHARMACY_OWNER', 'PLATFORM_ADMIN'), validateRequest(updateUserSchema), (req, res, next) => usersController.update(req, res, next));
router.patch('/:id/status', requireRoles('PHARMACY_OWNER', 'PLATFORM_ADMIN'), validateRequest(toggleUserStatusSchema), (req, res, next) => usersController.toggleStatus(req, res, next));

export default router;

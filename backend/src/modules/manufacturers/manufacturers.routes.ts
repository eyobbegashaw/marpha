import { Router } from 'express';
import { manufacturersController } from './manufacturers.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';

const router = Router();

// Public / Customer View Access
router.get('/', optionalAuthMiddleware, (req, res, next) => manufacturersController.list(req, res, next));
router.get('/:id', optionalAuthMiddleware, (req, res, next) => manufacturersController.getById(req, res, next));

// Staff Management Operations
router.post('/', authMiddleware, requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => manufacturersController.create(req, res, next));
router.put('/:id', authMiddleware, requireRoles('PHARMACY_OWNER'), (req, res, next) => manufacturersController.update(req, res, next));

export default router;

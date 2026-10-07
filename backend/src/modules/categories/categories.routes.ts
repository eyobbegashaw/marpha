import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';

const router = Router();

// Public / Customer Access (no login or registration required)
router.get('/', optionalAuthMiddleware, (req, res, next) => categoriesController.list(req, res, next));
router.get('/:id', optionalAuthMiddleware, (req, res, next) => categoriesController.getById(req, res, next));

// Pharmacy Staff Management Operations
router.post('/', authMiddleware, requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => categoriesController.create(req, res, next));
router.put('/:id', authMiddleware, requireRoles('PHARMACY_OWNER'), (req, res, next) => categoriesController.update(req, res, next));

export default router;

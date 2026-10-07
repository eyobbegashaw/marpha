import { Router } from 'express';
import { locationsController } from './locations.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => locationsController.list(req, res, next));
router.get('/:id', (req, res, next) => locationsController.getById(req, res, next));
router.post('/', requireRoles('PHARMACY_OWNER'), (req, res, next) => locationsController.create(req, res, next));
router.put('/:id', requireRoles('PHARMACY_OWNER'), (req, res, next) => locationsController.update(req, res, next));

export default router;

import { Router } from 'express';
import { suppliersController } from './suppliers.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => suppliersController.list(req, res, next));
router.get('/:id', (req, res, next) => suppliersController.getById(req, res, next));
router.post('/', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => suppliersController.create(req, res, next));
router.put('/:id', requireRoles('PHARMACY_OWNER'), (req, res, next) => suppliersController.update(req, res, next));

export default router;

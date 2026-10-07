import { Router } from 'express';
import { batchesController } from './batches.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => batchesController.list(req, res, next));
router.get('/:id', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => batchesController.getById(req, res, next));
router.post('/', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => batchesController.create(req, res, next));
router.patch('/:id/quarantine', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => batchesController.updateQuarantine(req, res, next));

export default router;

import { Router } from 'express';
import { purchasesController } from './purchases.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { createPurchaseSchema, receivePurchaseSchema, cancelPurchaseSchema } from './purchases.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => purchasesController.list(req, res, next));
router.get('/:id', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => purchasesController.getById(req, res, next));
router.post('/', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(createPurchaseSchema), (req, res, next) => purchasesController.create(req, res, next));

// Purchase Order Lifecycle transitions
router.patch('/:id/submit', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => purchasesController.submit(req, res, next));
router.patch('/:id/approve', requireRoles('PHARMACY_OWNER'), (req, res, next) => purchasesController.approve(req, res, next));
router.patch('/:id/order', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => purchasesController.order(req, res, next));
router.post('/:id/receive', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(receivePurchaseSchema), (req, res, next) => purchasesController.receive(req, res, next));
router.patch('/:id/cancel', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(cancelPurchaseSchema), (req, res, next) => purchasesController.cancel(req, res, next));

export default router;

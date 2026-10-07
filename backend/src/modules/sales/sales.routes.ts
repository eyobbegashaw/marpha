import { Router } from 'express';
import { salesController } from './sales.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { createSaleSchema } from './sales.schema';

const router = Router();

router.use(authMiddleware);

// Customer's own purchase history (Restricted strictly to CUSTOMER role)
router.get('/my-purchases', requireRoles('CUSTOMER'), (req, res, next) => salesController.getMyPurchases(req, res, next));
router.get('/my-purchases/:id', requireRoles('CUSTOMER'), (req, res, next) => salesController.getMyPurchaseById(req, res, next));

// Pharmacy Operations (Pharmacy Owner and Pharmacist)
router.get('/', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => salesController.list(req, res, next));
router.get('/:id', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => salesController.getById(req, res, next));
router.post('/checkout', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(createSaleSchema), (req, res, next) => salesController.checkout(req, res, next));

export default router;

import { Router } from 'express';
import { productsController } from './products.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { createProductSchema, updateProductSchema, updateProductPriceSchema, updateProductStatusSchema } from './products.schema';

const router = Router();

// Public / Customer Access (no login or registration required)
router.get('/', optionalAuthMiddleware, (req, res, next) => productsController.list(req, res, next));
router.get('/barcode/:barcode', optionalAuthMiddleware, (req, res, next) => productsController.getByBarcode(req, res, next));
router.get('/:id/availability', optionalAuthMiddleware, (req, res, next) => productsController.getAvailability(req, res, next));
router.get('/:id', optionalAuthMiddleware, (req, res, next) => productsController.getById(req, res, next));

// Pharmacy Staff Management Operations (Pharmacy Owner or Pharmacist)
router.post('/', authMiddleware, requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(createProductSchema), (req, res, next) => productsController.create(req, res, next));
router.put('/:id', authMiddleware, requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(updateProductSchema), (req, res, next) => productsController.update(req, res, next));
router.patch('/:id', authMiddleware, requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(updateProductSchema), (req, res, next) => productsController.update(req, res, next));
router.patch('/:id/status', authMiddleware, requireRoles('PHARMACY_OWNER'), validateRequest(updateProductStatusSchema), (req, res, next) => productsController.updateStatus(req, res, next));

// Audited Price Management (Pharmacy Owner)
router.patch('/:id/price', authMiddleware, requireRoles('PHARMACY_OWNER'), validateRequest(updateProductPriceSchema), (req, res, next) => productsController.updatePrice(req, res, next));
router.get('/:id/price-history', authMiddleware, requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => productsController.getPriceHistory(req, res, next));

export default router;

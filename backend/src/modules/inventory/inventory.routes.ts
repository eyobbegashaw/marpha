import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { transferStockSchema, adjustStockSchema, recordLossSchema } from './inventory.schema';

const router = Router();

// Strict RBAC: All inventory overview and operational endpoints require authentication (Owner or Pharmacist)
router.use(authMiddleware);

router.get('/overview', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => inventoryController.getOverview(req, res, next));
router.get('/location/:locationId', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => inventoryController.getByLocation(req, res, next));
router.get('/transactions', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => inventoryController.getTransactions(req, res, next));

router.post('/transfer', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(transferStockSchema), (req, res, next) => inventoryController.transferStock(req, res, next));
router.post('/adjust', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(adjustStockSchema), (req, res, next) => inventoryController.adjustStock(req, res, next));
router.post('/loss', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(recordLossSchema), (req, res, next) => inventoryController.recordLoss(req, res, next));

export default router;

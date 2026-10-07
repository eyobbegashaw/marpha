import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', requireRoles('PHARMACY_OWNER'), (req, res, next) => analyticsController.getDashboard(req, res, next));
router.get('/top-selling', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => analyticsController.getTopSelling(req, res, next));
router.get('/categories', requireRoles('PHARMACY_OWNER'), (req, res, next) => analyticsController.getCategorySales(req, res, next));
router.get('/demand-restock', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => analyticsController.getDemandRecommendations(req, res, next));

export default router;

import { Router } from 'express';
import { organizationsController } from './organizations.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => organizationsController.getOrg(req, res, next));
router.put('/', requireRoles('PHARMACY_OWNER'), (req, res, next) => organizationsController.updateOrg(req, res, next));

router.get('/branches', (req, res, next) => organizationsController.listBranches(req, res, next));
router.post('/branches', requireRoles('PHARMACY_OWNER'), (req, res, next) => organizationsController.createBranch(req, res, next));
router.put('/branches/:branchId', requireRoles('PHARMACY_OWNER'), (req, res, next) => organizationsController.updateBranch(req, res, next));

export default router;

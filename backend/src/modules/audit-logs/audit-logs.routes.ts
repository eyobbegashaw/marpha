import { Router } from 'express';
import { auditLogsController } from './audit-logs.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRoles('PHARMACY_OWNER'), (req, res, next) => auditLogsController.list(req, res, next));

export default router;

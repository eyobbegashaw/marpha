import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authMiddleware } from '../../common/middlewares/authMiddleware';
import { requireRoles } from '../../common/middlewares/rbacMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { createExpenseSchema, updateExpenseSchema, voidExpenseSchema } from './expenses.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => expensesController.list(req, res, next));
router.get('/:id', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => expensesController.getById(req, res, next));
router.post('/', requireRoles('PHARMACY_OWNER', 'PHARMACIST'), validateRequest(createExpenseSchema), (req, res, next) => expensesController.create(req, res, next));
router.patch('/:id', requireRoles('PHARMACY_OWNER'), validateRequest(updateExpenseSchema), (req, res, next) => expensesController.update(req, res, next));
router.patch('/:id/void', requireRoles('PHARMACY_OWNER'), validateRequest(voidExpenseSchema), (req, res, next) => expensesController.void(req, res, next));

export default router;

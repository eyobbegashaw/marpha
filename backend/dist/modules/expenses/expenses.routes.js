"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expenses_controller_1 = require("./expenses.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const expenses_schema_1 = require("./expenses.schema");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => expenses_controller_1.expensesController.list(req, res, next));
router.get('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => expenses_controller_1.expensesController.getById(req, res, next));
router.post('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(expenses_schema_1.createExpenseSchema), (req, res, next) => expenses_controller_1.expensesController.create(req, res, next));
router.patch('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (0, validateRequest_1.validateRequest)(expenses_schema_1.updateExpenseSchema), (req, res, next) => expenses_controller_1.expensesController.update(req, res, next));
router.patch('/:id/void', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (0, validateRequest_1.validateRequest)(expenses_schema_1.voidExpenseSchema), (req, res, next) => expenses_controller_1.expensesController.void(req, res, next));
exports.default = router;
//# sourceMappingURL=expenses.routes.js.map
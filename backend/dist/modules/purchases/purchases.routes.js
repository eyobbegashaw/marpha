"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const purchases_controller_1 = require("./purchases.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const purchases_schema_1 = require("./purchases.schema");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => purchases_controller_1.purchasesController.list(req, res, next));
router.get('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => purchases_controller_1.purchasesController.getById(req, res, next));
router.post('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(purchases_schema_1.createPurchaseSchema), (req, res, next) => purchases_controller_1.purchasesController.create(req, res, next));
// Purchase Order Lifecycle transitions
router.patch('/:id/submit', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => purchases_controller_1.purchasesController.submit(req, res, next));
router.patch('/:id/approve', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => purchases_controller_1.purchasesController.approve(req, res, next));
router.patch('/:id/order', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => purchases_controller_1.purchasesController.order(req, res, next));
router.post('/:id/receive', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(purchases_schema_1.receivePurchaseSchema), (req, res, next) => purchases_controller_1.purchasesController.receive(req, res, next));
router.patch('/:id/cancel', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(purchases_schema_1.cancelPurchaseSchema), (req, res, next) => purchases_controller_1.purchasesController.cancel(req, res, next));
exports.default = router;
//# sourceMappingURL=purchases.routes.js.map
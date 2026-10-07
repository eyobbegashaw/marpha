"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_controller_1 = require("./sales.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const sales_schema_1 = require("./sales.schema");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
// Customer's own purchase history (Restricted strictly to CUSTOMER role)
router.get('/my-purchases', (0, rbacMiddleware_1.requireRoles)('CUSTOMER'), (req, res, next) => sales_controller_1.salesController.getMyPurchases(req, res, next));
router.get('/my-purchases/:id', (0, rbacMiddleware_1.requireRoles)('CUSTOMER'), (req, res, next) => sales_controller_1.salesController.getMyPurchaseById(req, res, next));
// Pharmacy Operations (Pharmacy Owner and Pharmacist)
router.get('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => sales_controller_1.salesController.list(req, res, next));
router.get('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => sales_controller_1.salesController.getById(req, res, next));
router.post('/checkout', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(sales_schema_1.createSaleSchema), (req, res, next) => sales_controller_1.salesController.checkout(req, res, next));
exports.default = router;
//# sourceMappingURL=sales.routes.js.map
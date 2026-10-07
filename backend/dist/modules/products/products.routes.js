"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_controller_1 = require("./products.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const products_schema_1 = require("./products.schema");
const router = (0, express_1.Router)();
// Public / Customer Access (no login or registration required)
router.get('/', authMiddleware_1.optionalAuthMiddleware, (req, res, next) => products_controller_1.productsController.list(req, res, next));
router.get('/barcode/:barcode', authMiddleware_1.optionalAuthMiddleware, (req, res, next) => products_controller_1.productsController.getByBarcode(req, res, next));
router.get('/:id/availability', authMiddleware_1.optionalAuthMiddleware, (req, res, next) => products_controller_1.productsController.getAvailability(req, res, next));
router.get('/:id', authMiddleware_1.optionalAuthMiddleware, (req, res, next) => products_controller_1.productsController.getById(req, res, next));
// Pharmacy Staff Management Operations (Pharmacy Owner or Pharmacist)
router.post('/', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(products_schema_1.createProductSchema), (req, res, next) => products_controller_1.productsController.create(req, res, next));
router.put('/:id', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(products_schema_1.updateProductSchema), (req, res, next) => products_controller_1.productsController.update(req, res, next));
router.patch('/:id', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(products_schema_1.updateProductSchema), (req, res, next) => products_controller_1.productsController.update(req, res, next));
router.patch('/:id/status', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (0, validateRequest_1.validateRequest)(products_schema_1.updateProductStatusSchema), (req, res, next) => products_controller_1.productsController.updateStatus(req, res, next));
// Audited Price Management (Pharmacy Owner)
router.patch('/:id/price', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (0, validateRequest_1.validateRequest)(products_schema_1.updateProductPriceSchema), (req, res, next) => products_controller_1.productsController.updatePrice(req, res, next));
router.get('/:id/price-history', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => products_controller_1.productsController.getPriceHistory(req, res, next));
exports.default = router;
//# sourceMappingURL=products.routes.js.map
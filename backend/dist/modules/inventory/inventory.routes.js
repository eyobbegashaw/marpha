"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("./inventory.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const inventory_schema_1 = require("./inventory.schema");
const router = (0, express_1.Router)();
// Strict RBAC: All inventory overview and operational endpoints require authentication (Owner or Pharmacist)
router.use(authMiddleware_1.authMiddleware);
router.get('/overview', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => inventory_controller_1.inventoryController.getOverview(req, res, next));
router.get('/location/:locationId', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => inventory_controller_1.inventoryController.getByLocation(req, res, next));
router.get('/transactions', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => inventory_controller_1.inventoryController.getTransactions(req, res, next));
router.post('/transfer', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(inventory_schema_1.transferStockSchema), (req, res, next) => inventory_controller_1.inventoryController.transferStock(req, res, next));
router.post('/adjust', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(inventory_schema_1.adjustStockSchema), (req, res, next) => inventory_controller_1.inventoryController.adjustStock(req, res, next));
router.post('/loss', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (0, validateRequest_1.validateRequest)(inventory_schema_1.recordLossSchema), (req, res, next) => inventory_controller_1.inventoryController.recordLoss(req, res, next));
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const suppliers_controller_1 = require("./suppliers.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (req, res, next) => suppliers_controller_1.suppliersController.list(req, res, next));
router.get('/:id', (req, res, next) => suppliers_controller_1.suppliersController.getById(req, res, next));
router.post('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => suppliers_controller_1.suppliersController.create(req, res, next));
router.put('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => suppliers_controller_1.suppliersController.update(req, res, next));
exports.default = router;
//# sourceMappingURL=suppliers.routes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const manufacturers_controller_1 = require("./manufacturers.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const router = (0, express_1.Router)();
// Public / Customer View Access
router.get('/', authMiddleware_1.optionalAuthMiddleware, (req, res, next) => manufacturers_controller_1.manufacturersController.list(req, res, next));
router.get('/:id', authMiddleware_1.optionalAuthMiddleware, (req, res, next) => manufacturers_controller_1.manufacturersController.getById(req, res, next));
// Staff Management Operations
router.post('/', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => manufacturers_controller_1.manufacturersController.create(req, res, next));
router.put('/:id', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => manufacturers_controller_1.manufacturersController.update(req, res, next));
exports.default = router;
//# sourceMappingURL=manufacturers.routes.js.map
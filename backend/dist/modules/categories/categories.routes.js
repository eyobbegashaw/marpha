"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categories_controller_1 = require("./categories.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const router = (0, express_1.Router)();
// Public / Customer Access (no login or registration required)
router.get('/', authMiddleware_1.optionalAuthMiddleware, (req, res, next) => categories_controller_1.categoriesController.list(req, res, next));
router.get('/:id', authMiddleware_1.optionalAuthMiddleware, (req, res, next) => categories_controller_1.categoriesController.getById(req, res, next));
// Pharmacy Staff Management Operations
router.post('/', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => categories_controller_1.categoriesController.create(req, res, next));
router.put('/:id', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => categories_controller_1.categoriesController.update(req, res, next));
exports.default = router;
//# sourceMappingURL=categories.routes.js.map
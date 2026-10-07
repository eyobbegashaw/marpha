"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const validateRequest_1 = require("../../common/middlewares/validateRequest");
const users_schema_1 = require("./users.schema");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
// Only PHARMACY_OWNER can manage (create, view, update, activate, deactivate) employees
router.get('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => users_controller_1.usersController.list(req, res, next));
router.get('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => users_controller_1.usersController.getById(req, res, next));
router.post('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (0, validateRequest_1.validateRequest)(users_schema_1.createUserSchema), (req, res, next) => users_controller_1.usersController.create(req, res, next));
router.put('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (0, validateRequest_1.validateRequest)(users_schema_1.updateUserSchema), (req, res, next) => users_controller_1.usersController.update(req, res, next));
router.patch('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (0, validateRequest_1.validateRequest)(users_schema_1.updateUserSchema), (req, res, next) => users_controller_1.usersController.update(req, res, next));
router.patch('/:id/status', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (0, validateRequest_1.validateRequest)(users_schema_1.toggleUserStatusSchema), (req, res, next) => users_controller_1.usersController.toggleStatus(req, res, next));
exports.default = router;
//# sourceMappingURL=users.routes.js.map
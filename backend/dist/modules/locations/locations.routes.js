"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locations_controller_1 = require("./locations.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (req, res, next) => locations_controller_1.locationsController.list(req, res, next));
router.get('/:id', (req, res, next) => locations_controller_1.locationsController.getById(req, res, next));
router.post('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => locations_controller_1.locationsController.create(req, res, next));
router.put('/:id', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => locations_controller_1.locationsController.update(req, res, next));
exports.default = router;
//# sourceMappingURL=locations.routes.js.map
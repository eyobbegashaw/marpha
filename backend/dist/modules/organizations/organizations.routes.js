"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organizations_controller_1 = require("./organizations.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (req, res, next) => organizations_controller_1.organizationsController.getOrg(req, res, next));
router.put('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => organizations_controller_1.organizationsController.updateOrg(req, res, next));
router.get('/branches', (req, res, next) => organizations_controller_1.organizationsController.listBranches(req, res, next));
router.post('/branches', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => organizations_controller_1.organizationsController.createBranch(req, res, next));
router.put('/branches/:branchId', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => organizations_controller_1.organizationsController.updateBranch(req, res, next));
exports.default = router;
//# sourceMappingURL=organizations.routes.js.map
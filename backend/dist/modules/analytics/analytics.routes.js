"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/dashboard', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => analytics_controller_1.analyticsController.getDashboard(req, res, next));
router.get('/top-selling', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => analytics_controller_1.analyticsController.getTopSelling(req, res, next));
router.get('/categories', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => analytics_controller_1.analyticsController.getCategorySales(req, res, next));
router.get('/demand-restock', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => analytics_controller_1.analyticsController.getDemandRecommendations(req, res, next));
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map
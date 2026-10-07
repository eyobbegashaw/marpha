"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_1 = require("./notifications.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notifications_controller_1.notificationsController.list(req, res, next));
router.patch('/mark-all-read', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notifications_controller_1.notificationsController.markAllAsRead(req, res, next));
router.patch('/:id/read', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notifications_controller_1.notificationsController.markAsRead(req, res, next));
router.patch('/:id/resolve', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notifications_controller_1.notificationsController.markAsResolved(req, res, next));
router.post('/check-expiry', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER', 'PHARMACIST'), (req, res, next) => notifications_controller_1.notificationsController.triggerExpiryCheck(req, res, next));
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map
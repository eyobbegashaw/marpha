"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_logs_controller_1 = require("./audit-logs.controller");
const authMiddleware_1 = require("../../common/middlewares/authMiddleware");
const rbacMiddleware_1 = require("../../common/middlewares/rbacMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, rbacMiddleware_1.requireRoles)('PHARMACY_OWNER'), (req, res, next) => audit_logs_controller_1.auditLogsController.list(req, res, next));
exports.default = router;
//# sourceMappingURL=audit-logs.routes.js.map